import jwt from 'jsonwebtoken'
import multer from 'multer'
import path, { resolve } from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import fsExtra from 'fs-extra'
import open from 'open'
import sendMail from '../helpers/sendMail.js'
import config from '../config.json' assert {type: "json"}
import { userDataByUserId } from '../models/userModel.js';
import { tokens, authorizationUrl, oAuth2Client, drive, downloadFile } from '../models/fileModel.js'
import {
    doctorDataByUserId,
    insertDoctorsData,
    allPatientsByDoctorId,
    updateDoctorPersonalData,
    insertMedicalReport,
    allReportsByPatientId,
    insertPrescription,
    viewPatientMedicalHistory,
    updatePatientMedicalData,
    doctorDataBydoctorId
} from '../models/doctorModel.js'

import {
    patientPersonalByUserId,
    insertPatientPersonalData,
    patientMedicalDataByUserId,
    insertPatientMedicalData,
    viewMedicalHistoryByDoctor,
    insertUnApprovedAppointments,
    insertApprovedAppointments,
    viewAppointments,
    patientMedicalReportByUserId,
    appointmentsData,
    patientAppointments,
    patientPersonalByPatientId
} from '../models/patientModel.js';


const insertDoctorData = (req, res) => {
    const { specialization, licenseNo, contactNo } = req.body;
    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                if (!specialization || !licenseNo || !contactNo) {
                    throw config.error.allValues
                }
                else {
                    return doctorDataByUserId(userIdValue.id)
                }
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((doctorData) => {
            if (doctorData[0]) {
                throw config.error.alreadyExist
            }
            else {
                return insertDoctorsData(req, userIdValue.id)
            }
        })
        .then((result) => {
            throw config.success.insert

        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
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
    const userId = req.query.userId  //accept userId

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                if (!mobNumber || !DOB || !weight || !height || !countryOfOrigin || !diseaseDescribe) {
                    throw config.error.allValues
                }
                else {
                    return userDataByUserId(userId)
                }
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((user) => {
            if (!user[0] || user[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return patientPersonalByUserId(userId)
            }
        })
        .then((personalData) => {
            if (personalData[0]) {
                throw config.error.alreadyExist
            }
            else {
                return insertPatientPersonalData(req, userId, age, BMI)
            }
        })
        .then((result) => {
            throw config.success.insert
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}

//INSERT MEDICAL DATA OF PATIENTS BY PASSING THEIR USERID VIA DOCTOR
const insertMedicalDataByDoctor = (req, res) => {
    const { medicalHistory } = req.body;

    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId //accept userid

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                if (!medicalHistory) {
                    throw config.error.allValues
                }
                else {
                    return userDataByUserId(patientUserId)
                }
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((patientUserData) => {
            if (!patientUserData[0] || patientUserData[0].isDeleted == 1) {
                throw config.error.patientNotFoundError
            }
            else {
                return Promise.all([userDataByUserId(userIdValue.id), patientUserData])
            }
        })
        .then(([doctorUserData, patientUserData]) => {
            if (!doctorUserData[0] || doctorUserData[0].isDeleted == 1) {
                throw config.error.doctorNotFoundError
            }
            else {
                return Promise.all([patientPersonalByUserId(patientUserId), patientUserData, doctorUserData])
            }
        })
        .then(([personalData, patientUserData, doctorUserData]) => {
            if (!personalData[0]) {
                throw config.error.patientNotFoundError
            }
            else {
                return Promise.all([doctorDataByUserId(userIdValue.id), personalData, patientUserData, doctorUserData])
            }
        })
        .then(([doctorData, personalData, patientUserData, doctorUserData]) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            }
            else {
                return Promise.all([patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId), personalData, doctorData, patientUserData, doctorUserData])
            }
        })
        .then(([medicalData, personalData, doctorData, patientUserData, doctorUserData]) => {
            if (medicalData[0]) {
                throw config.error.alreadyAssigned
            }
            else {
                return Promise.all([insertPatientMedicalData(req, personalData[0].patientId, doctorData[0].doctorId), patientUserData, doctorUserData])
            }
        })
        .then(([result, patientUserData, doctorUserData]) => {
            if (result.affectedRows != 0) {
                let mailSubject = 'Doctor Assigned'
                let content = '<p> Hi ' + patientUserData[0].firstName + ' ' + patientUserData[0].lastName + '<p> You are successfully assigned to Dr.' + doctorUserData[0].firstName + ' ' + doctorUserData[0].lastName + '.'
                sendMail(patientUserData[0].emailId, mailSubject, content);
                throw config.success.insert
            }
            else {
                throw config.error.internalServerError
            }
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
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

const uploadMedicalReport = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId
    var i;

    await open(authorizationUrl);

    setTimeout(() => { oAuth2Client.setCredentials(tokens.tokens); }, 4000)
    setTimeout(() => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename)
        const __filePath = path.join(__dirname, '../Uploads/')

        userDataByUserId(userIdValue.id)
            .then((userData) => {
                if (userData[0].isDoctor == 1) {
                    return doctorDataByUserId(userIdValue.id)
                }
                else {
                    fsExtra.emptyDir(__filePath)
                    throw config.error.forbidden
                }
            })
            .then((doctorData) => {
                if (!doctorData[0]) {
                    fsExtra.emptyDir(__filePath)
                    throw config.error.doctorNotFoundError
                }
                else {
                    return Promise.all([userDataByUserId(patientUserId), doctorData])
                }
            })
            .then(([patientUserData, doctorData]) => {
                if (!patientUserData[0] || patientUserData[0].isDeleted == 1) {
                    fsExtra.emptyDir(__filePath)
                    throw config.error.notFoundError
                }
                else {
                    return Promise.all([patientPersonalByUserId(patientUserId), doctorData])
                }
            })
            .then(([personalData, doctorData]) => {
                if (!personalData[0]) {
                    fsExtra.emptyDir(__filePath)
                    throw config.error.patientNotFoundError
                }
                else {
                    return Promise.all([patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId), personalData, doctorData])
                }
            })
            .then(([medicalData, personalData, doctorData]) => {
                if (!medicalData[0]) {
                    fsExtra.emptyDir(__filePath)
                    throw config.error.forbidden
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
                        } catch (err) {
                            console.log(err)
                            throw err
                        }
                        fs.unlinkSync(file1)
                        return insertMedicalReport(i, doctorData[0].doctorId, personalData[0].patientId)
                    }
                }
            })
            .then((result) => {
                throw config.success.insert
            })
            .catch((error) => {
                return res.status(error.statusCode).send(error)
            })
    }, 5000)
}


//SCHEDULE APPOINTMENTS FOR EACH PATIENTS WHICH ARE ASSIGNED TO THEM BY PASSING THEIR USERID
const insertAppointmentsByDoctor = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId  //accept userId

    const { appointmentDateTime, reasonForAppointment } = req.body;
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                if (!appointmentDateTime || !reasonForAppointment) {
                    throw config.error.allValues
                }
                else {
                    return Promise.all([doctorDataByUserId(userIdValue.id), userData])
                }
            }
            else {
                throw config.error.forbidden
            }
        })
        .then(([doctorData, userData]) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            }
            else {
                return Promise.all([userDataByUserId(patientUserId), doctorData, userData])
            }
        })
        .then(([patientUserData, doctorData, userData]) => {
            if (!patientUserData[0] || patientUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return Promise.all([patientPersonalByUserId(patientUserId), doctorData, userData])
            }
        })
        .then(([personalData, doctorData, userData]) => {
            if (!personalData[0]) {
                throw config.error.patientNotFoundError
            }
            else {
                return Promise.all([patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId), personalData, doctorData, userData])
            }
        })
        .then(([medicalData, personalData, doctorData, userData]) => {
            if (!medicalData[0]) {
                throw config.error.forbidden
            }
            else {
                return Promise.all([appointmentsData(req, personalData[0].patientId, doctorData[0].doctorId), personalData, doctorData, userData])
            }
        })
        .then(([appointmentData, personalData, doctorData, userData]) => {
            if (appointmentData[0]) {
                throw config.error.alreadyExist
            }
            else {
                if (userData[0].isAdmin == 1) {
                    return insertApprovedAppointments(req, doctorData[0].doctorId, personalData[0].patientId)
                }
                else {
                    return insertUnApprovedAppointments(req, doctorData[0].doctorId, personalData[0].patientId)
                }
            }
        })
        .then((result) => {
            throw config.success.insert
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


const uploadPrescription = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const appointmentId = req.query.appointmentId
    var i;
    var date_time = new Date()
    await open(authorizationUrl);

    setTimeout(() => { oAuth2Client.setCredentials(tokens.tokens); }, 4000)
    setTimeout(() => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename)
        const __filePath = path.join(__dirname, '../Uploads/')

        userDataByUserId(userIdValue.id)
            .then((userData) => {
                if (userData[0].isDoctor == 1) {
                    return patientAppointments(appointmentId)
                }
                else {
                    fsExtra.emptyDir(__filePath)
                    throw config.error.forbidden
                }
            })
            .then((appointmentData) => {
                if (appointmentData[0].prescription == null && appointmentData[0].appointmentDateTime < date_time && appointmentData[0].isApproved == 1) {
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
                        } catch (err) {
                            console.log(err)
                            throw err
                        }
                        fs.unlinkSync(file1)
                        insertPrescription(i, appointmentId)
                    }
                    return appointmentData
                }
                else {
                    throw config.error.alreadyExist
                }
            })
            .then((appointmentData) => {
                return Promise.all([patientPersonalByPatientId(appointmentData[0].patientId), appointmentData])
            })
            .then(([patientData, appointmentData]) => {
                return Promise.all([doctorDataBydoctorId(appointmentData[0].doctorId), patientData])
            })
            .then(([doctorData, patientData]) => {
                return Promise.all([userDataByUserId(patientData[0].userId), doctorData])
            })
            .then(([patientUserData, doctorData]) => {
                return Promise.all([userDataByUserId(doctorData[0].userId), patientUserData])
            })
            .then(([doctorUserData, patientUserData]) => {
                setTimeout(async () => {
                    await drive.permissions.create({
                        fileId: i.id,
                        requestBody: {
                            role: "reader",
                            type: "anyone"
                        }
                    })
                    const link = await drive.files.get({
                        fileId: i.id,
                        fields: 'webViewLink, webContentLink',
                    });
                    let mailSubject = 'Download document'
                    let content = '<p> Hi ' + patientUserData[0].firstName + ' ' + patientUserData[0].lastName + '<p> Your prescription is ' + link.data.webContentLink + ' uploaded by Dr.' + doctorUserData[0].firstName + ' ' + doctorUserData[0].lastName
                    sendMail(patientUserData[0].emailId, mailSubject, content);
                    return res.status(config.success.insert.statusCode).send(config.success.insert)
                }, 5000)
            })
            .catch((error) => {
                return res.status(error.statusCode).send(error)
            })
    }, 6000)
}



const updateDoctorData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                return doctorDataByUserId(userIdValue.id)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((doctorData) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            }
            else {
                return updateDoctorPersonalData(req, userIdValue.id)
            }
        })
        .then((result) => {
            throw config.success.update
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


//UPDATE PATIENTS MEDICAL DATA BY DOCTOR
const updatePMDataByDoctor = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId //accept userId
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                return doctorDataByUserId(userIdValue.id)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((doctorData) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            }
            else {
                return Promise.all([userDataByUserId(patientUserId), doctorData])
            }
        })
        .then(([patientUserData, doctorData]) => {
            if (!patientUserData[0] || patientUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return Promise.all([patientPersonalByUserId(patientUserId), doctorData])
            }
        })
        .then(([personalData, doctorData]) => {
            if (!personalData[0]) {
                throw config.error.patientNotFoundError
            }
            else {
                return Promise.all([patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId), personalData, doctorData])
            }
        })
        .then(([medicalData, personalData, doctorData]) => {
            if (!medicalData[0]) {
                throw config.error.forbidden
            }
            else {
                return Promise.all([viewPatientMedicalHistory(personalData[0].patientId, doctorData[0].doctorId), personalData, doctorData])
            }
        })
        .then(([medicalHistory, personalData, doctorData]) => {
            if (!medicalHistory[0]) {
                throw config.error.invalid
            }
            else {
                return updatePatientMedicalData(req, medicalHistory[0].medicalHistory, personalData[0].patientId, doctorData[0].doctorId)
            }
        })
        .then((result) => {
            throw config.success.update
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}

const viewAssignedPatients = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                return doctorDataByUserId(userIdValue.id)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((doctorData) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            }
            else {
                return allPatientsByDoctorId(doctorData[0].doctorId)
            }
        })
        .then((result) => {
            return res.json({
                StatusCode: config.success.retrive.statusCode,
                Message: config.success.retrive.Message,
                data: result
            })
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}

const viewPatientReports = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId;

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                return doctorDataByUserId(userIdValue.id)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((doctorData) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            }
            else {
                return Promise.all([userDataByUserId(patientUserId), doctorData])
            }
        })
        .then(([patientUserData, doctorData]) => {
            if (!patientUserData[0] || patientUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return Promise.all([patientPersonalByUserId(patientUserId), doctorData])
            }
        })
        .then(([personalData, doctorData]) => {
            if (!personalData[0]) {
                throw config.error.patientNotFoundError
            }
            else {
                return Promise.all([patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId), personalData, doctorData])
            }
        })
        .then(([medicalData, personalData, doctorData]) => {
            if (!medicalData[0]) {
                throw config.error.forbidden
            }
            else {
                return allReportsByPatientId(personalData[0].patientId, doctorData[0].doctorId)
            }
        })
        .then((result) => {
            return res.json({
                StatusCode: config.success.retrive.statusCode,
                Message: config.success.retrive.Message,
                data: result
            })

        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


//GET UPCOMING APPOINTMENTS WITH PATIENTS FOR LOGGED DOCTOR
const viewAppointmentByDoctor = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                return doctorDataByUserId(userIdValue.id)
            } else {
                throw config.error.forbidden
            }
        })
        .then((doctorData) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            } else {
                return viewAppointments(doctorData[0].doctorId)
            }
        })
        .then((result) => {
            return res.json({
                StatusCode: config.success.retrive.statusCode,
                Message: config.success.retrive.Message,
                data: result
            })
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


//GET MEDICAL HISTORY AND TREATEMENT PLAN FOR PATIENTS WHICH  ARE ASSIGNED TO LOGGED DOCTOR
const viewMedicalHistory = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isDoctor == 1) {
                return doctorDataByUserId(userIdValue.id)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((doctorData) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            }
            else {
                return viewMedicalHistoryByDoctor(doctorData[0].doctorId)
            }
        })
        .then((result) => {
            return res.json({
                StatusCode: config.success.retrive.statusCode,
                Message: config.success.retrive.Message,
                data: result
            })
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


const downloadPatientReports = async (req, res) => {
    let authed = false;
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId;
    const fileUrl = req.query.fileUrl //accept file url
    var fileId = fileUrl.split("/");
    await open(authorizationUrl)
    setTimeout(() => { oAuth2Client.setCredentials(tokens.tokens); authed = true; }, 10000)
    setTimeout(() => {
        userDataByUserId(userIdValue.id)
            .then((userData) => {
                if (userData[0].isDoctor == 1) {
                    return doctorDataByUserId(userIdValue.id)
                }
                else {
                    throw config.error.forbidden
                }
            })
            .then((doctorData) => {
                if (!doctorData[0]) {
                    return config.error.doctorNotFoundError
                } else {
                    return Promise.all([userDataByUserId(patientUserId), doctorData])
                }
            })
            .then(([patientUserData, doctorData]) => {
                if (patientUserData[0].isDeleted == 1) {
                    throw config.error.notFoundError
                }
                else {
                    return Promise.all([patientPersonalByUserId(patientUserId), doctorData])
                }
            })
            .then(([personalData, doctorData]) => {
                if (!personalData[0]) {
                    throw config.error.patientNotFoundError
                }
                else {
                    return Promise.all([patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId), personalData, doctorData])
                }

            })
            .then(([medicalData, personalData, doctorData]) => {
                if (!medicalData[0]) {
                    throw config.error.forbidden
                }
                else {
                    return patientMedicalReportByUserId(personalData[0].patientId, doctorData[0].doctorId, fileUrl)
                }
            })
            .then((medicalReport) => {
                if (!medicalReport[0]) {
                    throw config.error.fileNotFound
                } else {
                    if (authed == true) {
                        downloadFile(fileId[5]);
                        throw config.success.download
                    }
                }
            })
            .catch((error) => {
                return res.status(error.statusCode).send(error)
            })
    }, 12000);
}


export {
    insertDoctorData,
    createPatientByDoctor,
    insertMedicalDataByDoctor,
    viewAssignedPatients,
    updateDoctorData,
    uploadReport,
    uploadMedicalReport,
    viewPatientReports,
    updatePMDataByDoctor,
    viewMedicalHistory,
    insertAppointmentsByDoctor,
    viewAppointmentByDoctor,
    downloadPatientReports,
    uploadPrescription
}
