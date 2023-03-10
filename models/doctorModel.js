import db from '../db/connect.js'

const checkIsDoctor = (id, callback) => {

    db.query("SELECT isDoctor from userData WHERE userId=?", [id], async (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            return callback(result)
        }

    })
}

const doctorDataByUserId = (id, callback) => {
    db.query('SELECT * from doctorData WHERE userId=?', [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}


const fillDoctorData = (req, id, callback) => {
   
    db.query('INSERT INTO doctorData SET ?', {
        userId: id,
        specialization: req.body.specialization,
        licenseNo: req.body.licenseNo,
        contactNo: req.body.contactNo
    }, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const allPatientsByDoctorId = (id,callback) => {
    db.query('select patientPersonalData.patientId, firstName,lastName from userData join patientPersonalData on userData.userId=patientPersonalData.userId join patientMedicalData on patientPersonalData.patientId=patientMedicalData.patientId where patientMedicalData.doctorId=?', [id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const updateDoctorPersonalData = (req, id, callback) => {
    db.query("UPDATE doctorData SET ? WHERE userId= ?", [req.body, id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}
const insertMedicalReport = (req, doctorId, patientId, callback) => {
    const url = 'https://drive.google.com/file/d/';
    db.query("INSERT INTO patientMedicalReport SET ?",{
        doctorId: doctorId,
        patientId: patientId,
        medicalReport: url+req.id
    }, async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const allReportsByPatientId = (patientId, doctorId, callback) => {
    db.query (' SELECT medicalReport from patientMedicalReport where patientId =? and doctorId =?', [patientId,doctorId], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}


export { checkIsDoctor, doctorDataByUserId, fillDoctorData, allPatientsByDoctorId, updateDoctorPersonalData, insertMedicalReport, allReportsByPatientId }
