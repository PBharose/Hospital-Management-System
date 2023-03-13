import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { google } from 'googleapis'
import fs from 'fs'
import { fileURLToPath } from 'url'
import fsExtra from 'fs-extra'
import OAuth2Data from '../credentials.json' assert {type: "json"}
import config from '../config.json' assert {type: "json"}


import { checkIsDoctor, doctorDataByUserId, fillDoctorData, allPatientsByDoctorId, updateDoctorPersonalData, insertMedicalReport, allReportsByPatientId } from '../models/doctorModel.js'
import { patientPersonalByUserId, insertPatientPersonalData, patientMedicalDataByUserId, insertPatientMedicalData, viewPatientMedicalHistory, updatePatientMedicalData, viewMedicalHistoryByDoctor, ScheduleAppointments, viewAppointments, availablePatients } from '../models/patientModel.js';
import { userDataByUserId } from '../models/userModel.js';

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URI = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
)

var authed = false
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile"

const getAuthURL = (req, res) => {
    if (!authed) {
        var url = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
        })
        console.log(url)
        //res.redirect(url)
    } else {
        console.log("success")
    }
    return res.send("Auth URL send successfully")
}

const getAccessToken = (req, res) => {
    const code = req.query.code

    if (code) {
        oAuth2Client.getToken(code, function (err, tokens) {
            if (err) {
                console.log("Error in Authentication")
                console.log(err)
            } else {
                console.log(tokens)
                oAuth2Client.setCredentials(tokens)
                authed = true;
                res.redirect('/')
            }
        })
    }
}



const insertDoctorData = (req, res) => {
    const { specialization, licenseNo, contactNo } = req.body;
    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            if (!specialization || !licenseNo || !contactNo) {
                return res.status(config.error.allValues.statusCode).send(config.error.allValues)
            }
            else {
                doctorDataByUserId(userIdValue.id, function (doctorData) {
                    if (doctorData[0]) return res.status(409).json({ error: "Doctor data is already filled" })
                    else {
                        fillDoctorData(req, userIdValue.id, function (result) {
                            return res.status(config.success.insert.statusCode).send(config.success.insert)
                        })
                    }
                })
            }
        }
        else {
            return res.status(config.error.unAuthorized.statusCode).send(config.error.unAuthorized)
        }
    })
}


//DOCTOR CREATE PATIENTS
const createPatientByDoctor = (req, res) => {
    const { mobNumber, DOB, weight, height, countryOfOrigin, diabetic, cardiac, BP, diseaseDescribe } = req.body;

    var age = new Date().getFullYear() - new Date(DOB).getFullYear()
    var h = height.split("-")
    var BMI = (weight / (h[0] * 0.3048 + h[1] * 0.0254) ** 2).toFixed(2)

    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query  //accept userId

    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            if (!mobNumber || !DOB || !weight || !height || !countryOfOrigin || !diseaseDescribe) {
                return res.status(config.error.allValues.statusCode).send(config.error.allValues)
            }
            else {
                userDataByUserId(id.id, function (userData) {
                    if (!userData[0]) return res.status(config.error.notFoundError.statusCode).send(config.error.notFoundError)

                    else {
                        patientPersonalByUserId(id.id, function (result) {
                            if (result[0]) return res.status(config.error.alreadyExist.statusCode).send(config.error.alreadyExist)

                            else {
                                insertPatientPersonalData(req, id.id, age, BMI, function (result1) {
                                    return res.status(config.success.insert.statusCode).send(config.success.insert)
                                })
                            }
                        })
                    }
                })
            }
        }
        else {
            return res.status(config.error.unAuthorized.statusCode).send(config.error.unAuthorized)
        }
    })
}

//INSERT MEDICAL DATA OF PATIENTS BY PASSING THEIR USERID VIA DOCTOR
const insertMedicalDataByDoctor = (req, res) => {
    const { medicalHistory, treatmentPlan, appointmentDateTime, reasonForAppointment } = req.body;

    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query //accept userid

    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            if (!appointmentDateTime || !reasonForAppointment) {
                return res.status(config.error.allValues.statusCode).send(config.error.allValues)
            }
            else {
                doctorDataByUserId(userIdValue.id, function (doctorData) {
                    if (!doctorData[0]) {
                        return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                    }
                    else {
                        patientPersonalByUserId(id.id, function (personalData) {
                            if (!personalData[0]) return res.status(config.error.patientNotFoundError.statusCode).send(config.error.patientNotFoundError)

                            else {
                                patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (result) {
                                    if (result[0]) return res.status(config.error.AlreadyAssigned.statusCode).send(config.error.AlreadyAssigned)

                                    else {
                                        insertPatientMedicalData(req, personalData[0].patientId, doctorData[0].doctorId, function (result1) {
                                            return res.status(config.success.insert.statusCode).send(config.success.insert)
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        }
        else {
            return res.status(config.error.unAuthorized.statusCode).send(config.error.unAuthorized)
        }
    })
}


//UPDATE PATIENTS MEDICAL DATA BY DOCTOR
const updatePMDataByDoctor = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query  //accept userId

    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                }
                else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            return res.status(config.error.patientNotFoundError.statusCode).send(config.error.patientNotFoundError)
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
                                }
                                else {
                                    viewPatientMedicalHistory(doctorData[0].doctorId, personalData[0].patientId, function (medicalHistory) {
                                        updatePatientMedicalData(req, medicalHistory[0].medicalHistory, doctorData[0].doctorId, personalData[0].patientId, function (results) {
                                            return res.status(config.success.update.statusCode).send(config.success.update)
                                        })
                                    })
                                }
                            })
                        }
                    })
                }

            })
        }
        else {
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })
}

const viewAssignedPatients = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsDoctor(userIdValue.id, async function (result) {
        if (result[0].isDoctor == 1) {

            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                } else {
                    allPatientsByDoctorId(doctorData[0].doctorId, async function (result) {
                        return res.json({
                            StatusCode: config.success.retrive.statusCode,
                            Message: config.success.retrive.Message,
                            data: result
                        })
                    })
                }
            })
        } else {
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })

}

const updateDoctorData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsDoctor(userIdValue.id, async function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                }
                else {
                    updateDoctorPersonalData(req, userIdValue.id, async function (result) {
                        return res.status(config.success.update.statusCode).send(config.success.update)
                    })
                }
            })
        } else {
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })
}

const uploadReport = multer({
    storage: multer.diskStorage({
        destination: "./Uploads/",
        filename: function (req, file, callback) {
            //console.log(file)
            callback(null, file.originalname)
        }
    })
}).single("filename");

const uploadMedicalReport = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    var i;

    const drive = google.drive({
        version: 'v3',
        auth: oAuth2Client
    })
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename)
    const __filePath = path.join(__dirname, '../Uploads/')
    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    fsExtra.emptyDir(__filePath)
                    return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                }
                else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            fsExtra.emptyDir(__filePath)
                            return res.status(config.error.patientNotFoundError.statusCode).send(config.error.patientNotFoundError)
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    fsExtra.emptyDir(__filePath)
                                    return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)

                                }
                                else {

                                    fs.readdir(__filePath, (err, file) => {
                                        const file1 = path.join(__filePath, file[0])
                                        uploadFile(file1)
                                    })
                                    async function uploadFile(file1) {

                                        try {
                                            const responses = await drive.files.create({
                                                requestBody: {
                                                    name: path.basename(file1),
                                                    mimeType: 'applications/pdf'
                                                },
                                                media: {
                                                    mimeType: 'applications/pdf',
                                                    body: fs.createReadStream(file1)
                                                }
                                            });
                                            i = responses.data
                                            //console.log(i)
                                        } catch (err) {
                                            console.log(err)
                                            throw err
                                        }
                                        insertMedicalReport(i, doctorData[0].doctorId, personalData[0].patientId, function (result) {
                                            return res.status(config.success.insert.statusCode).send(config.success.insert)
                                        })
                                        fs.unlinkSync(file1)
                                    }
                                }
                            })
                        }
                    })
                }

            })
        } else {
            fsExtra.emptyDir(__filePath)
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })

}

const viewPatientReports = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query;
    checkIsDoctor(userIdValue.id, async function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                } else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            return res.status(config.error.patientNotFoundError.statusCode).send(config.error.patientNotFoundError)
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
                                }
                                else {
                                    allReportsByPatientId(personalData[0].patientId, doctorData[0].doctorId, function (result) {
                                        return res.json({
                                            StatusCode: config.success.retrive.statusCode,
                                            Message: config.success.retrive.Message,
                                            data: result
                                        })
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
        else {
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })
}

//GET UPCOMING APPOINTMENTS WITH PATIENTS FOR LOGGED DOCTOR
const viewAppointmentByDoctor = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                }
                else {
                    viewAppointments(doctorData[0].doctorId, function (result) {
                        return res.json({
                            StatusCode: config.success.retrive.statusCode,
                            Message: config.success.retrive.Message,
                            data: result
                        })
                    })
                }
            })
        }
        else {
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })
}

const availablePatientsForAppointment = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {

            availablePatients(function (result) {
                return res.json({
                    StatusCode: config.success.retrive.statusCode,
                    Message: config.success.retrive.Message,
                    data: result
                })
            })

        }
        else {
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })
}

//GET MEDICAL HISTORY AND TREATEMENT PLAN FOR PATIENTS WHICH  ARE ASSIGNED TO LOGGED DOCTOR
const viewMedicalHistory = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                }
                else {
                    viewMedicalHistoryByDoctor(doctorData[0].doctorId, function (result) {
                        return res.json({
                            StatusCode: config.success.retrive.statusCode,
                            Message: config.success.retrive.Message,
                            data: result
                        })
                    })
                }
            })
        }
        else {
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })
}


//SCHEDULE APPOINTMENTS FOR EACH PATIENTS WHICH ARE ASSIGNED TO THEM BY PASSING THEIR USERID
const ScheduleAppointmentsByDoctor = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query  //accept userId

    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    return res.status(config.error.doctorNotFoundError.statusCode).send(config.error.doctorNotFoundError)
                }
                else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            return res.status(config.error.patientNotFoundError.statusCode).send(config.error.patientNotFoundError)
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
                                }
                                else {
                                    ScheduleAppointments(req, doctorData[0].doctorId, personalData[0].patientId, function (results) {
                                        return res.status(config.success.update.statusCode).send(config.success.update)
                                    })
                                }
                            })
                        }
                    })
                }

            })
        }
        else {
            return res.status(config.error.forbidden.statusCode).send(config.error.forbidden)
        }
    })
}

export { getAuthURL, getAccessToken, insertDoctorData, createPatientByDoctor, insertMedicalDataByDoctor, viewAssignedPatients, updateDoctorData, uploadReport, uploadMedicalReport, viewPatientReports, updatePMDataByDoctor, viewMedicalHistory, ScheduleAppointmentsByDoctor, viewAppointmentByDoctor, availablePatientsForAppointment }
