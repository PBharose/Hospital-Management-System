import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import sendMail from '../helpers/sendMail.js'
import randomstring from 'randomstring'
import config from '../config.json' assert {type: "json"}

import {
    userDataByEmail,
    insertUserData,
    allUserData,
    updateUserData,
    userDataByUserId,
    deletepatientsData,
    unApprovedAppointments,
    recoverpatientsData,
    approvedAppointmentData,
    getPatientAppointmentByDate,
    getDoctorAppointmentByDate
} from '../models/userModel.js'

import {
    patientPersonalByUserId,
    updatePatientPersonalData,
    updatePatientFamilyData,
    patientMedicalDataByUserId,
    insertPatientMedicalData,
    patientDocumentByPatientId,
    assignedPatientWithDoctor,
    patientAppointments,
    updateAppointments,
    insertApprovedAppointments,
    patientPersonalByPatientId
} from '../models/patientModel.js'

import {
    doctorDataByUserId,
    allMedicalData,
    doctorDataBydoctorId
} from '../models/doctorModel.js'


const registerUser = async (req, res) => {
    const { firstName, lastName, emailId, userPassword } = req.body
    if (!firstName || !lastName || !emailId || !userPassword) {
        return res.status(config.error.allValues.statusCode).send(config.error.allValues)
    }
    else {
        userDataByEmail(req)
            .then(async (userData) => {
                if (userData[0]) {
                    throw config.error.alreadyExist
                }
                else {
                    const password = await bcrypt.hash(userPassword, 12);
                    return insertUserData(req, password)
                }
            })
            .then(async (result) => {
                let mailSubject = 'Mail verification'
                const randomToken = randomstring.generate()
                let content = '<p> Hi ' + req.body.firstName + ', Please <a href = "http://localhost:4000/mail-verification?token=' + randomToken + '"> Verify your email!!</a>'
                sendMail(req.body.emailId, mailSubject, content);
                return res.status(config.success.create.statusCode).send(config.success.create)
            })
            .catch((error) => {
                return res.status(error.statusCode).send(error)
            })
    }
}

//USER LOGIN 
const loginUser = async (req, res, next) => {
    const { emailId, userPassword } = req.body
    if (!emailId || !userPassword) {
        return res.status(config.error.allValues.statusCode).send(config.error.allValues)
    }
    else {
        userDataByEmail(req)
            .then(async (userData) => {
                if (!userData[0]) {
                    throw config.error.notFoundError
                }
                else if (userData[0].isDeleted != 1) {
                    if (!userData[0] || !await bcrypt.compare(userPassword, userData[0].userPassword)) {
                        throw config.error.unAuthorized
                    }
                    else {
                        const token = jwt.sign({ id: userData[0].userId }, process.env.JWT_SECRET, {
                            expiresIn: process.env.JWT_LIFETIME
                        })
                        const user = { userId: userData[0].userId, name: userData[0].firstName + ' ' + userData[0].lastName, emailId: userData[0].emailId, isAdmin: userData[0].isAdmin, isDoctor: userData[0].isDoctor }

                        return res.json({
                            StatusCode: config.success.login.statusCode,
                            Message: config.success.login.Message,
                            token: token,
                            data: user
                        })
                    }
                }
                else {
                    throw config.error.notFoundError
                }
            })
            .catch((error) => {
                return res.status(error.statusCode).send(error)
            })
    }
}


//PERSONAL PROFILE/ USERDATA ONLY UPDATE
const updateUser = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    updateUserData(req, userIdValue.id)
        .then((userData) => {
            if (userData.affectedRows == 0) {
                throw config.error.notFoundError
            }
            else {
                throw config.success.update
            }
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


//Inserting patientMedicalData by Admin
const insertMedicalDataByAdmin = (req, res) => {
    const { medicalHistory } = req.body;

    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId
    const doctorUserId = req.query.doctorUserId

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
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
                return Promise.all([userDataByUserId(doctorUserId), patientUserData])
            }
        })
        .then(([doctorUserData, patientUserData]) => {
            if (!doctorUserData[0] || doctorUserData[0].isDoctor == 0 || doctorUserData[0].isDeleted == 1) {
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
                return Promise.all([doctorDataByUserId(doctorUserId), personalData, patientUserData, doctorUserData])
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

const insertAppointmentsByAdmin = (req, res) => {
    const { appointmentDateTime, reasonForAppointment } = req.body;
    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId
    const doctorUserId = req.query.doctorUserId
    var date_ob = new Date();
    var day = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var seconds = date_ob.getSeconds();
    var date_time = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                if (!appointmentDateTime || !reasonForAppointment) {
                    throw config.error.allValues
                }
                else if (appointmentDateTime < date_time) {
                    throw config.error.invalid
                }
                else {
                    return userDataByUserId(patientUserId)
                }
            } else {
                throw config.error.forbidden
            }
        })
        .then((patientUserData) => {
            if (!patientUserData[0] || patientUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            } else {
                return userDataByUserId(doctorUserId)
            }
        })
        .then((doctorUserData) => {
            if (!doctorUserData[0] || doctorUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            } else {
                return patientPersonalByUserId(patientUserId)
            }
        })
        .then((personalData) => {
            if (!personalData[0]) {
                throw config.error.patientNotFoundError
            } else {
                return Promise.all([doctorDataByUserId(doctorUserId), personalData])
            }
        })
        .then(([doctorData, personalData]) => {
            if (!doctorData[0]) {
                throw config.error.doctorNotFoundError
            } else {
                return Promise.all([patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId), doctorData, personalData])
            }
        })
        .then(([medicalData, doctorData, personalData]) => {
            if (!medicalData[0]) {
                throw config.error.forbidden
            } else {
                return Promise.all([getPatientAppointmentByDate(personalData[0].patientId, appointmentDateTime), doctorData, personalData])
            }
        })
        .then(([pAppointmentData, doctorData, personalData]) => {
            if (!pAppointmentData[0]) {
                return Promise.all([getDoctorAppointmentByDate(doctorData[0].doctorId, appointmentDateTime), doctorData, personalData])
            } else {
                throw config.error.alreadyExist
            }
        })
        .then(([dAppointmentData, doctorData, personalData]) => {
            if (!dAppointmentData[0]) {
                return insertApprovedAppointments(req, doctorData[0].doctorId, personalData[0].patientId)
            } else {
                throw config.error.alreadyExist
            }
        })
        .then((result) => {
            throw config.success.insert
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


const editAppointments = async (req, res) => {
    const appointmentDateTime = req.body.appointmentDateTime
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const appointmentId = req.query.appointmentId
    var date_ob = new Date();
    var day = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var seconds = date_ob.getSeconds();
    var date_time = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                if (appointmentDateTime < date_time) {
                    throw config.error.invalid
                }
                else {
                    return patientAppointments(appointmentId)
                }
            } else {
                throw config.error.forbidden
            }
        })
        .then((appointmentData) => {
            if (!appointmentData[0]) {
                throw config.error.appointmentNotFound
            }
            else {
                return Promise.all([patientPersonalByPatientId(appointmentData[0].patientId), appointmentData])
            }
        })
        .then(([personalData, appointmentData]) => {
            return Promise.all([userDataByUserId(personalData[0].userId), appointmentData])
        })
        .then(([patientUserData, appointmentData]) => {
            if (patientUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return Promise.all([doctorDataBydoctorId(appointmentData[0].doctorId), appointmentData])
            }
        })
        .then(([doctorData, appointmentData]) => {
            return Promise.all([userDataByUserId(doctorData[0].userId), appointmentData])
        })
        .then(([doctorUserData, appointmentData]) => {
            if (doctorUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return Promise.all([getPatientAppointmentByDate(appointmentData[0].patientId, appointmentDateTime), appointmentData])
            }
        })
        .then(([pAppointmentData, appointmentData]) => {
            if (!pAppointmentData[0]) {
                return getDoctorAppointmentByDate(appointmentData[0].doctorId,appointmentDateTime)
            }
            else {
                throw config.error.alreadyExist
            }
        })
        .then((dAppointmentData) => {
            if (!dAppointmentData[0]) {
                return updateAppointments(req, appointmentId)
            }
            else {
                throw config.error.alreadyExist
            }
        })
        .then((result) => {
            throw config.success.update
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}

const editUserData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const userId = req.query.userId

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return updateUserData(req, userId)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((result) => {
            if (result.affectedRows == 0) {
                throw config.error.notFoundError
            }
            else {
                throw config.success.update
            }
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}

const editPersonalData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const userId = req.query.userId
    const { height, weight, DOB } = req.body
    var BMI, age;
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return userDataByUserId(userId)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((checkUser) => {
            if (!checkUser[0] || checkUser[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return patientPersonalByUserId(userId)
            }
        })
        .then((hwValue) => {
            if (DOB) {
                age = new Date().getFullYear() - new Date(DOB).getFullYear()
            }
            else {
                age = hwValue[0].age
            }
            if (height && weight) {
                var h = height.split("-")
                BMI = (weight / (h[0] * 0.3048 + h[1] * 0.0254) ** 2).toFixed(2)
            }
            else if (!weight && height) {
                var h = height.split("-")
                BMI = (hwValue[0].weight / (h[0] * 0.3048 + h[1] * 0.0254) ** 2).toFixed(2)
            }
            else if (!height && weight) {
                BMI = (weight / (hwValue[0].height[0] * 0.3048 + hwValue[0].height[2] * 0.0254) ** 2).toFixed(2)
            }
            else {
                BMI = hwValue[0].BMI
            }
            return updatePatientPersonalData(req, age, BMI, userId)
        })
        .then((results) => {
            if (results.affectedRows == 0) {
                throw config.error.notFoundError
            }
            else {
                throw config.success.update
            }
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}

const editFamilyData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const userId = req.query.userId
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return userDataByUserId(userId)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((checkUser) => {
            if (!checkUser[0] || checkUser[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return patientPersonalByUserId(userId)
            }
        })
        .then((personalData) => {
            if (!personalData[0]) {
                throw config.error.patientNotFoundError
            }
            else {
                return updatePatientFamilyData(req, personalData[0].patientId)
            }
        })
        .then((results) => {
            if (results.affectedRows == 0) {
                throw config.error.notFoundError
            }
            else {
                throw config.success.update
            }
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}



//ADMIN FUNCTION TO SHOW ALL USERS IN DATABASE
const allUsers = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return allUserData()
            }
            else {
                throw config.error.forbidden
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


const viewPatientDoctor = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return assignedPatientWithDoctor()
            }
            else {
                throw config.error.forbidden
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

const viewPatientDocumentByAdmin = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET);
    const patientUserId = req.query.patientUserId

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return patientPersonalByUserId(patientUserId)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((personalData) => {
            if (!personalData[0]) {
                throw config.error.notFoundError
            }
            else {
                return patientDocumentByPatientId(personalData[0].patientId)
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


const viewMedicalInfoByAdmin = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return allMedicalData()
            }
            else {
                throw config.error.forbidden
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


const viewUnApprovedAppointments = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return unApprovedAppointments()
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((result) => {
            return res.json({
                StatusCode: config.success.retrive.statusCode,
                Message: config.success.retrive.Message,
                data: result
            })
        })
}


const deletePatient = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const userId = req.query.userId

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return userDataByUserId(userId)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((checkUser) => {
            if (!checkUser[0] || checkUser[0].isDeleted == 1) {
                throw config.error.notFoundError
            }
            else {
                return deletepatientsData(userId)
            }
        })
        .then((results) => {
            if (results.affectedRows == 0) {
                throw config.error.notFoundError
            }
            else {
                throw config.success.delete
            }
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


const recoverPatient = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const userId = req.query.userId

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return userDataByUserId(userId)
            }
            else {
                throw config.error.forbidden
            }
        })
        .then((checkUser) => {
            if (!checkUser[0]) {
                throw config.error.notFoundError
            }
            else {
                return recoverpatientsData(userId)
            }
        })
        .then((results) => {
            if (results.affectedRows == 0) {
                throw config.error.notFoundError
            }
            else {
                throw config.success.retrive
            }
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}



const approveAppointment = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const appointmentId = req.query.appointmentId

    userDataByUserId(userIdValue.id)
        .then((userData) => {
            if (userData[0].isAdmin == 1) {
                return patientAppointments(appointmentId)
            } else {
                throw config.error.forbidden
            }
        })
        .then((appointmentData) => {
            if (!appointmentData[0]) {
                throw config.error.appointmentNotFound
            } else {
                return Promise.all([patientPersonalByPatientId(appointmentData[0].patientId), appointmentData])
            }
        })
        .then(([personalData, appointmentData]) => {
            return Promise.all([userDataByUserId(personalData[0].userId), appointmentData])
        })
        .then(([patientUserData, appointmentData]) => {
            if (patientUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            } else {
                return doctorDataBydoctorId(appointmentData[0].doctorId)
            }
        })
        .then((doctorData) => {
            return userDataByUserId(doctorData[0].userId)
        })
        .then((doctorUserData) => {
            if (doctorUserData[0].isDeleted == 1) {
                throw config.error.notFoundError
            } else {
                return approvedAppointmentData(appointmentId)
            }
        })
        .then((results) => {
            if (results.affectedRows == 0) {
                throw config.error.notFoundError
            }
            else {
                throw config.success.update
            }
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


export {
    registerUser,
    loginUser,
    updateUser,
    allUsers,
    editFamilyData,
    editUserData,
    editPersonalData,
    deletePatient,
    insertMedicalDataByAdmin,
    viewPatientDoctor,
    viewPatientDocumentByAdmin,
    viewMedicalInfoByAdmin,
    viewUnApprovedAppointments,
    editAppointments,
    insertAppointmentsByAdmin,
    recoverPatient,
    approveAppointment
}
