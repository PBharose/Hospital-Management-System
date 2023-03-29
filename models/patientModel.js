import { resolve } from 'path'
import pkg from 'promise'
import db from '../db/connect.js'
const { reject } = pkg;

const patientPersonalByUserId = (id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * from patientPersonalData WHERE userId=?', [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const insertPatientPersonalData = (req, id, age, BMI) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO patientPersonalData  SET ?', {
            userId: id,
            mobNumber: req.body.mobNumber,
            DOB: req.body.DOB,
            age: age,
            weight: req.body.weight,
            height: req.body.height,
            BMI: BMI,
            countryOfOrigin: req.body.countryOfOrigin,
            diabetic: req.body.diabetic,
            cardiac: req.body.cardiac,
            BP: req.body.BP,
            diseaseDescribe: req.body.diseaseDescribe,
        }, (err, result) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(result)
            }
        })
    })
}


const patientFamilyByPatientId = (id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * from patientFamilyData WHERE patientId=?', [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const insertPatientFamilyData = (req, id) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO patientFamilyData SET ?', {
            patientId: id,
            fatherName: req.body.fatherName,
            fatherAge: req.body.fatherAge,
            fatherCountry: req.body.fatherCountry,
            motherName: req.body.motherName,
            motherAge: req.body.motherAge,
            motherCountry: req.body.motherCountry,
            parentsDiabetic: req.body.parentsDiabetic,
            parentsCardiac: req.body.parentsCardiac,
            parentsBP: req.body.parentsBP
        }, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const patientDocumentByPatientId = (id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * from patientDocumentData WHERE patientId=?', [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const insertPatientIdDocumentData = (id) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO patientDocumentData SET ?', {
            patientId: id,
        }, (err, result) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(result)
            }
        })
    })
}


const insertPatientDocumentData = (req, id) => {
    return new Promise((resolve, reject) => {
        const url = 'https://drive.google.com/file/d/';
        if (req.name == 'AadharFront.png') {
            db.query("UPDATE patientDocumentData SET aadharFront=? WHERE patientId=?", [url + req.id, id], async (err, result) => {
                if (err) reject(err);
            })

        }
        else if (req.name == 'AadharBack.png') {
            db.query("UPDATE patientDocumentData SET aadharBack=? WHERE patientId=?", [url + req.id, id], async (err, result) => {
                if (err) reject(err);
            })
        }
        else if (req.name == 'InsuranceFront.png') {
            db.query("UPDATE patientDocumentData SET insuranceFront =? WHERE patientId=?", [url + req.id, id], async (err, result) => {
                if (err) reject(err);
            })
        }
        else if (req.name == 'InsuranceBack.png') {
            db.query("UPDATE patientDocumentData SET insuranceBack=? WHERE patientId=?", [url + req.id, id], async (err, result) => {
                if (err) reject(err);
            })
        }
    })
}


const updatePatientPersonalData = (req, age, BMI, id) => {
    return new Promise((resolve, reject) => {
        db.query("UPDATE patientPersonalData SET ?,age=?, BMI =? WHERE userId=?", [req.body, age, BMI, id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const updatePatientFamilyData = (req, id) => {
    return new Promise((resolve, reject) => {
        db.query("UPDATE patientFamilyData SET ? WHERE patientId=?", [req.body, id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const patientAppointmentData = (id) => {
    return new Promise((resolve, reject) => {
        db.query('select firstName, lastName, appointmentId,appointmentDateTime,reasonForAppointment from appointments Join doctorData on appointments.doctorId = doctorData.doctorId join userData on userData.userId = doctorData.userId where appointments.patientId = ? and appointmentDateTime >= now() and isApproved=1', [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {

                resolve(result)
            }
        })
    })
}


const insertMedicalHistoryReport = (req, patientId) => {
    return new Promise((resolve, reject) => {
        const url = 'https://drive.google.com/file/d/';
        db.query("INSERT INTO medicalHistoryReport SET ?", {
            patientId: patientId,
            previousMedicalReport: url + req.id
        }, async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
}

const updateMedicalHistory = (req, patientId, fileUrl) => {
    return new Promise((resolve, reject) => {
        const url = 'https://drive.google.com/file/d/';
        db.query("UPDATE medicalHistoryReport SET previousMedicalReport=? WHERE patientId=? and previousMedicalReport=? ", [url + req.id, patientId, fileUrl], async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
}


const patientMedicalDataByUserId = (patientId, doctorId) => {
    return new Promise((resolve,reject)=>{
        db.query('SELECT * from patientMedicalData WHERE patientId=? and doctorId=?', [patientId, doctorId], async (err, result) => {
            if (err) {
                reject(err)
            } else {
    
                resolve(result)
            }
        })
    })
}


const insertPatientMedicalData = (req, patientId, doctorId) => {
    return new Promise((resolve,reject)=>{
        db.query('INSERT INTO patientMedicalData SET ?', {
            patientId: patientId,
            doctorId: doctorId,
            medicalHistory: req.body.medicalHistory,
        }, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const viewMedicalHistoryByDoctor = (doctorId) => {
    return new Promise((resolve,reject)=>{
        db.query("SELECT userData.userId,firstName,lastName,medicalHistory FROM patientMedicalData JOIN patientpersonaldata ON patientMedicalData.patientId=patientpersonaldata.patientId JOIN userdata ON userdata.userId = patientpersonaldata.userId WHERE patientmedicaldata.doctorId=? and isDeleted=0", [doctorId], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
   
}


const viewAppointments = (doctorId) => {
    return new Promise((resolve,reject)=>{
        db.query("SELECT userData.userId,firstName,lastName,appointmentId,appointmentDateTime,reasonForAppointment,prescription FROM appointments JOIN patientpersonaldata ON appointments.patientId=patientpersonaldata.patientId JOIN userdata ON userdata.userId = patientpersonaldata.userId WHERE appointments.doctorId=? AND appointmentDateTime >= now() and isApproved=1 AND isDeleted=0", [doctorId], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
    
}

const assignedPatientWithDoctor = () => {
    return new Promise((resolve,reject)=>{
        db.query("SELECT patientpersonaldata.patientId,firstName,lastName,doctorId as assigned_doctorId FROM userData JOIN patientpersonaldata ON userData.userId=patientpersonaldata.userId JOIN patientmedicaldata ON patientpersonaldata.patientId=patientmedicaldata.patientId", (err, result) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(result)
            }
        })
    })
   
}



const patientMedicalReportByUserId = (patientId, doctorId, fileUrl) => {
    return new Promise((resolve,reject)=>{
        db.query('SELECT * from patientMedicalReport WHERE patientId=? and doctorId=? and medicalReport = ?', [patientId, doctorId, fileUrl], async (err, result) => {
            if (err) {
                reject (err)
            } else {
    
                resolve(result)
            }
        })
    })
   
}


const appointmentsData = (req, patientId, doctorId) => {
    return new Promise((resolve,reject)=>{
        db.query('SELECT * from appointments WHERE patientId=? and doctorId=? and appointmentDateTime=? ', [patientId, doctorId, req.body.appointmentDateTime], async (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result)
            }
        })
    })
   
}

const insertApprovedAppointments = (req, doctorId, patientId) => {
    return new Promise((resolve,reject)=>{
        db.query('INSERT INTO appointments SET ?', {
            patientId: patientId,
            doctorId: doctorId,
            appointmentDateTime: req.body.appointmentDateTime,
            reasonForAppointment: req.body.reasonForAppointment,
            prescription: null,
            isApproved: true
        }, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
   
}

const insertUnApprovedAppointments = (req, doctorId, patientId) => {
    db.query('INSERT INTO appointments SET ?', {
        patientId: patientId,
        doctorId: doctorId,
        appointmentDateTime: req.body.appointmentDateTime,
        reasonForAppointment: req.body.reasonForAppointment,
        prescription: null,
        isApproved: false
    }, (err, result) => {
        if (err) {
            reject(err)
        } else {
            resolve(result)
        }
    })
}


const patientAppointments = (id) => {
    return new Promise((resolve,reject)=>{
        db.query('SELECT * from appointments WHERE appointmentId=?', [id], async (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result)
            }
        })
    })
}

const updateAppointments = (req, appointmentId) => {
    return new Promise((resolve,reject)=>{
        db.query("UPDATE appointments SET ? WHERE appointmentId=?", [req.body, appointmentId], (err, result) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(result)
            }
        })
    })
    
}

const patientPersonalByPatientId = (id) => {
    return new Promise((resolve,reject)=>{
        db.query('SELECT * from patientPersonalData WHERE patientId=?', [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
   
}

export {
    patientPersonalByUserId,
    insertPatientPersonalData,
    insertPatientFamilyData,
    insertPatientIdDocumentData,
    insertPatientDocumentData,
    insertPatientMedicalData,
    patientFamilyByPatientId,
    patientDocumentByPatientId,
    patientMedicalDataByUserId,
    updatePatientPersonalData,
    updatePatientFamilyData,
    viewMedicalHistoryByDoctor,
    viewAppointments,
    assignedPatientWithDoctor,
    patientAppointmentData,
    patientMedicalReportByUserId,
    insertMedicalHistoryReport,
    updateMedicalHistory,
    patientAppointments,
    updateAppointments,
    insertUnApprovedAppointments,
    insertApprovedAppointments,
    appointmentsData,
    patientPersonalByPatientId
}
