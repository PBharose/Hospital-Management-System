import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { google } from 'googleapis'
import fs from 'fs'
import { fileURLToPath } from 'url'
import fsExtra from 'fs-extra'

import { checkIsDoctor, doctorDataByUserId, fillDoctorData, allPatientsByDoctorId, updateDoctorPersonalData, insertMedicalReport, allReportsByPatientId } from '../models/doctorModel.js'
import { patientPersonalByUserId, insertPatientPersonalData, patientMedicalDataByUserId, insertPatientMedicalData } from '../models/patientModel.js';
import { userDataByUserId } from '../models/userModel.js';

import credentials from '../credentials.json' assert {type: "json"};
const client_id = credentials.web.client_id;
const client_secret = credentials.web.client_secret;
const redirect_uris = credentials.web.redirect_uris;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPE = ['https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive']



const insertDoctorData = (req, res) => {
    const { specialization, licenseNo, contactNo } = req.body;
    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            if (!specialization || !licenseNo || !contactNo) {
                return res.status(400).json({ status: "error", error: "please provide all values" })
            }
            else {
                doctorDataByUserId(userIdValue.id, function (doctorData) {
                    if (doctorData[0]) return res.status(409).json({ error: "Doctor data is already filled" })
                    else {
                        fillDoctorData(req, userIdValue.id, function (result) {
                            return res.status(201).json({ status: "success", success: "Doctor data is filled." })
                        })
                    }
                })
            }
        }
        else {
            return res.status(401).send('Unauthorized user')
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
                return res.status(400).json({ status: "error", error: "please provide all values" })
            }
            else {
                userDataByUserId(id.id, function (userData) {
                    if (!userData[0]) return res.status(404).json({ error: "User is not registered." })
                    else {
                        patientPersonalByUserId(id.id, function (result) {
                            if (result[0]) return res.status(409).json({ error: "Personal data is already filled" })
                            else {
                                insertPatientPersonalData(req, id.id, age, BMI, function (result1) {
                                    return res.status(201).json({ status: "success", success: "Personal data is filled." })
                                })
                            }
                        })
                    }
                })
            }
        }
        else {
            return res.status(401).send("Unauthorized user")
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
                return res.status(400).json({ status: "error", error: "please provide all values" })
            }
            else {
                doctorDataByUserId(userIdValue.id, function (doctorData) {
                    if (!doctorData[0]) {
                        return res.status(404).send("Fill doctor's details first")
                    }
                    else {
                        patientPersonalByUserId(id.id, function (personalData) {
                            if (!personalData[0]) return res.status(404).json({ error: "Fill the patient's personal details first" })
                            else {
                                patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (result) {
                                    if (result[0]) return res.status(409).json({ error: "Patient is already assigned to you." })
                                    else {
                                        insertPatientMedicalData(req, personalData[0].patientId, doctorData[0].doctorId, function (result1) {
                                            return res.status(201).json({ status: "success", success: "Patient is now assigned to you." })
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
            return res.status(401).send("Unauthorized user")
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
                    return res.status(404).send("Fill doctor details first")
                }
                else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            return res.status(404).send("No such patient exist")
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    return res.status(403).send("Can't Update!! This patient is not assigned you.")
                                }
                                else {
                                    viewPatientMedicalHistory(doctorData[0].doctorId, personalData[0].patientId, function (medicalHistory) {
                                        updatePatientMedicalData(req, medicalHistory[0].medicalHistory, doctorData[0].doctorId, personalData[0].patientId, function (results) {
                                            return res.status(200).send("Medical Data updated successfully")
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
            return res.status(401).send("Unauthorized user")
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
                    return res.status(404).send("Fill doctor's details first")
                } else {
                    allPatientsByDoctorId(doctorData[0].doctorId, async function (result) {
                        return res.status(200).json(result)
                    })
                }
            })
        } else {
            return res.status(401).send("Unauthorized user");
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
                    return res.status(404).send("Cannot update fill doctor's details first")
                }
                else {
                    updateDoctorPersonalData(req, userIdValue.id, async function (result) {
                        return res.status(200).send("Doctor personal data updated successfully.")
                    })
                }
            })
        } else {
            return res.status(401).send("Unauthorized user");
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
    const id = req.params
    var i;
    const authToken= JSON.parse( req.body.token);
    console.log(authToken)
    oAuth2Client.setCredentials(authToken)

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
                    return res.status(404).send("Fill doctor details first")
                }
                else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            fsExtra.emptyDir(__filePath)
                            return res.status(404).send("No such patient exist")
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    fsExtra.emptyDir(__filePath)
                                    return res.status(403).send("This patient is not assigned you.")

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
                                            res.status(201).send("Report uploaded successfully");
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
            return res.status(401).send("Unauthorized user");
        }
    })

}
/*
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
    const id = req.params
    var i;
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_REDIRECT_URI,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: process.env.GOOGLE_DRIVE_ACCESS_TOKEN })

    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client
    })
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename)
    const __filePath = path.join(__dirname, '../Uploads/')
    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    fsExtra.emptyDir(__filePath)
                    return res.status(404).send("Fill doctor details first")
                }
                else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            fsExtra.emptyDir(__filePath)
                            return res.status(404).send("No such patient exist")
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    fsExtra.emptyDir(__filePath)
                                    return res.status(403).send("This patient is not assigned you.")

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
                                            res.status(201).send("Report uploaded successfully");
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
            return res.status(401).send("Unauthorized user");
        }
    })

}*/

const viewPatientReports = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id =req.params;
    checkIsDoctor(userIdValue.id, async function (result) {
        if (result[0].isDoctor == 1) {
            doctorDataByUserId(userIdValue.id, function (doctorData) {
                if (!doctorData[0]) {
                    return res.status(404).send("Fill doctor's details first")
                } else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            return res.status(404).send("No such patient exist")
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    return res.status(403).send("This patient is not assigned you.")
                                }
                                else {
                                    allReportsByPatientId(personalData[0].patientId, doctorData[0].doctorId, function (result){
                                        return res.status(200).json(result)
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
        else {
            return res.send("Unauthorized user");
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
                    return res.status(404).send("Fill doctor details first")
                }
                else {
                    viewAppointments(doctorData[0].doctorId, function (result) {
                        return res.status(200).json({ result })
                    })
                }
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

const availablePatientsForAppointment = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsDoctor(userIdValue.id, function (result) {
        if (result[0].isDoctor == 1) {

            availablePatients(function (result) {
                return res.status(200).json({ result })
            })

            }
        else {
            return res.status(401).send("Unauthorized user")
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
                    return res.status(404).send("Fill doctor details first")
                }
                else {
                    viewMedicalHistoryByDoctor(doctorData[0].doctorId, function (result) {
                        return res.status(200).json({ result })
                    })
                }
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
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
                    return res.status(404).send("Fill doctor details first")
                }
                else {
                    patientPersonalByUserId(id.id, function (personalData) {
                        if (!personalData[0]) {
                            return res.status(404).send("No such patient exist")
                        }
                        else {
                            patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (patientData) {
                                if (!patientData[0]) {
                                    return res.status(403).send("Can't Update!! This patient is not assigned you.")
                                }
                                else {
                                    ScheduleAppointments(req, doctorData[0].doctorId, personalData[0].patientId, function (results) {
                                        return res.status(200).send("Medical Data updated successfully")
                                    })
                                }
                            })
                        }
                    })
                }

            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}


export { insertDoctorData, createPatientByDoctor, insertMedicalDataByDoctor, viewAssignedPatients, updateDoctorData, uploadReport, uploadMedicalReport, viewPatientReports ,updatePMDataByDoctor, viewMedicalHistory, ScheduleAppointmentsByDoctor, viewAppointmentByDoctor,availablePatientsForAppointment}
