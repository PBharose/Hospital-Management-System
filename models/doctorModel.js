import { resolve } from 'path'
import pkg from 'promise'
import db from '../db/connect.js'
const { reject } = pkg;


const doctorDataByUserId = (id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * from doctorData WHERE userId=?', [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const insertDoctorsData = (req, id) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO doctorData SET ?', {
            userId: id,
            specialization: req.body.specialization,
            licenseNo: req.body.licenseNo,
            contactNo: req.body.contactNo
        }, (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

const viewPatientMedicalHistory = (patientId, doctorId) => {
    return new Promise((resolve,reject)=>{
        db.query("SELECT medicalHistory FROM patientMedicalData WHERE patientId=? and doctorId=?  ", [patientId, doctorId], async (err, result) => {
            if (err) {
                reject (err)
            } else {
                resolve(result)
            }
        })
    })
   
}

const updatePatientMedicalData = (req, medicalHistory, patientId, doctorId) => {
    return new Promise((resolve,reject)=>{
        db.query("UPDATE patientMedicalData SET medicalHistory =CONCAT(?,', ',?) WHERE patientId=? and doctorId=?", [medicalHistory, req.body.medicalHistory, patientId, doctorId], async (err, result) => {
            if (err) {
                reject (err)
            } else {
                resolve(result)
            }
        })
    })
}


const allPatientsByDoctorId = (id) => {
    return new Promise((resolve,reject)=>{
        db.query('SELECT userData.userId,patientPersonalData.patientId, firstName,lastName from userData join patientPersonalData on userData.userId=patientPersonalData.userId join patientMedicalData on patientPersonalData.patientId=patientMedicalData.patientId where patientMedicalData.doctorId=? and userData.isDeleted=0', [id], async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
}

const updateDoctorPersonalData = (req, id) => {
    return new Promise((resolve,reject)=>{
        db.query("UPDATE doctorData SET ? WHERE userId= ?", [req.body, id], async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
}


const insertMedicalReport = (req, doctorId, patientId,) => {
    return new Promise((resolve,reject)=>{
        console.log(req.id)
        const url = 'https://drive.google.com/file/d/';
        db.query("INSERT INTO patientMedicalReport SET ?", {
            doctorId: doctorId,
            patientId: patientId,
            medicalReport: url + req.id
        }, async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
   
}


const allReportsByPatientId = (patientId, doctorId) => {
    return new Promise((resolve,reject)=>{
        db.query(' SELECT medicalReport from patientMedicalReport where patientId =? and doctorId =?', [patientId, doctorId], async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
    
}


const allMedicalData = () => {
    return new Promise((resolve, reject) => {
        db.query('SELECT userData.userId,patientpersonaldata.patientId,patientmedicaldata.doctorId,appointments.appointmentId,userdata.firstName AS patientfirstName,userdata.LastName AS patientLastName, appointments.appointmentDateTime,appointments.prescription,appointments.reasonForAppointment,patientmedicaldata.medicalHistory,patientmedicalreport.medicalReport,medicalHistoryReport.previousMedicalReport FROM patientpersonaldata JOIN userData ON patientpersonaldata.userId = userData.userId LEFT OUTER JOIN appointments ON appointments.patientId = patientpersonaldata.patientId LEFT OUTER JOIN  patientmedicaldata ON  appointments.patientId = patientmedicaldata.patientId and appointments.doctorId = patientmedicaldata.doctorId LEFT OUTER JOIN patientmedicalreport ON  patientmedicalreport.patientId = patientmedicaldata.patientId and patientmedicalreport.doctorId = patientmedicaldata.doctorId  LEFT OUTER JOIN medicalhistoryreport ON medicalhistoryreport.patientId = patientpersonaldata.patientId;', async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
}

const insertPrescription = (req, appointmentId) => {
    return new Promise((resolve,reject)=>{
        const url = 'https://drive.google.com/file/d/';
        db.query("UPDATE appointments SET prescription=? WHERE appointmentId=? ", [url + req.id, appointmentId],  (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
}

const doctorDataBydoctorId = (id) => {
    return new Promise((resolve,reject)=>{
        db.query('SELECT * from doctorData WHERE doctorId=?', [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


export {
    doctorDataByUserId,
    insertDoctorsData,
    allPatientsByDoctorId,
    updateDoctorPersonalData,
    insertMedicalReport,
    allReportsByPatientId,
    allMedicalData,
    doctorDataBydoctorId,
    insertPrescription,
    viewPatientMedicalHistory,
    updatePatientMedicalData
}
