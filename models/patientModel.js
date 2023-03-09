import db from '../db/connect.js'

const patientPersonalByUserId = (id, callback) => {
    db.query('SELECT * from patientPersonalData WHERE userId=?', [id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const insertPatientPersonalData = (req,id, age, BMI, callback) => {
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
            console.log(err)
        }
        else {
            return callback(result)
        }
    })
}

const insertPatientFamilyData = (req, id, callback) => {
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
            console.log(err)
        } else {
            return callback(result)
        }
    })
}


const insertPatientIdDocumentData = (id, callback) => {

    db.query('INSERT INTO patientDocumentData SET ?', {
        patientId: id,

    }, (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            return callback(result)
        }
    })
}

const insertPatientDocumentData = (req, id, callback) => {
    const url = 'https://drive.google.com/file/d/';
    if (req.name == 'AadharFront.png') {
        db.query("UPDATE patientDocumentData SET aadharFront=? WHERE patientId=?", [url+req.id, id], async (err, result)=>{
            if (err) throw err;
        })

    }

    else if (req.name == 'AadharBack.png') {
        db.query("UPDATE patientDocumentData SET aadharBack=? WHERE patientId=?", [url+req.id, id], async (err, result) => {
            if (err) throw err
        })
    }

    else if (req.name == 'InsuranceFront.png') {
        db.query("UPDATE patientDocumentData SET insuranceFront =? WHERE patientId=?", [url+req.id, id], async (err, result) => {
            if (err) throw err
        })
    }

    else if (req.name == 'InsuranceBack.png') {
        db.query("UPDATE patientDocumentData SET insuranceBack=? WHERE patientId=?", [url+req.id, id], async (err, result) => {
            if (err) throw err
        })
    }
}


const insertPatientMedicalData = (req, patientId, doctorId, callback) => {
    db.query('INSERT INTO patientMedicalData SET ?', {
        patientId: patientId,
        doctorId: doctorId,
        medicalHistory: req.body.medicalHistory,
        treatmentPlan: req.body.treatmentPlan,
        appointmentDateTime: req.body.appointmentDateTime,
        reasonForAppointment: req.body.reasonForAppointment
    }, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}


const patientFamilyByPatientId = (id, callback) => {
    db.query('SELECT * from patientFamilyData WHERE patientId=?', [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}
const patientDocumentByPatientId = (id, callback) => {
    db.query('SELECT * from patientDocumentData WHERE patientId=?', [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const patientMedicalDataByUserId = (patientId, doctorId, callback) => {
    db.query('SELECT * from patientMedicalData WHERE patientId=? and doctorId=?', [patientId, doctorId], async (err, result) => {
        if (err) {
            console.log(err)
        } else {

            return callback(result)
        }
    })
}
const updatePatientPersonalData = (req, age, BMI, id, callback) => {
    db.query("UPDATE patientPersonalData SET ?,age=?, BMI =? WHERE userId=?", [req.body, age, BMI, id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const updatePatientFamilyData = (req, id, callback) => {
    db.query("UPDATE patientFamilyData SET ? WHERE patientId=?", [req.body, id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const deletePatientMedicalData = (id, callback) => {
    db.query("DELETE FROM patientMedicalData WHERE patientId =?", [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}
const deletePatientReportData = (id, callback) => {
    db.query("DELETE FROM patientMedicalReport WHERE patientId =?", [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const deletePatientDocumentData = (id, callback) => {
    db.query("DELETE FROM patientDocumentData WHERE patientId =?", [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const deletePatientFamilyData = (id, callback) => {
    db.query("DELETE FROM patientFamilyData WHERE patientId =?", [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const deletePatientPersonalData = (id, callback) => {
    db.query("DELETE FROM patientPersonalData WHERE patientId =?", [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const viewPatientMedicalHistory = (doctorId, patientId, callback) => {
    db.query("SELECT medicalHistory FROM patientMedicalData WHERE doctorId=? and patientId=? ", [doctorId, patientId], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const updatePatientMedicalData = (req, medicalHistory, doctorId, patientId, callback) => {
    db.query("UPDATE patientMedicalData SET medicalHistory =CONCAT(?,', ',?), treatmentPlan=? WHERE doctorId=? and patientId=?", [medicalHistory, req.body.medicalHistory, req.body.treatmentPlan, doctorId, patientId], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const viewMedicalHistoryByDoctor = (doctorId, callback) => {
    db.query("SELECT userData.userId,firstName,lastName,medicalHistory,treatmentPlan FROM patientMedicalData JOIN patientpersonaldata ON patientMedicalData.patientId=patientpersonaldata.patientId JOIN userdata ON userdata.userId = patientpersonaldata.userId WHERE patientmedicaldata.doctorId=?", [doctorId], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const ScheduleAppointments = (req, doctorId, patientId, callback) => {
    db.query("UPDATE patientMedicalData SET appointmentDateTime=?,reasonForAppointment=? WHERE doctorId=? and patientId=?", [req.body.appointmentDateTime, req.body.reasonForAppointment, doctorId, patientId], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const viewAppointments = (doctorId, callback) => {
    db.query("SELECT userData.userId,firstName,lastName,appointmentDateTime,reasonForAppointment FROM patientMedicalData JOIN patientpersonaldata ON patientMedicalData.patientId=patientpersonaldata.patientId JOIN userdata ON userdata.userId = patientpersonaldata.userId WHERE patientmedicaldata.doctorId=? AND appointmentDateTime >= now()", [doctorId], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const availablePatients = (callback) => {
    db.query("SELECT patientId,firstName,lastName FROM userData JOIN patientpersonaldata ON userData.userId=patientpersonaldata.userId WHERE patientId NOT IN(SELECT patientId FROM patientmedicaldata WHERE appointmentDateTime>now()", (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            return callback(result)
        }
    })
}


const assignedPatientWithDoctor = (callback) => {
    db.query("SELECT patientpersonaldata.patientId,firstName,lastName,doctorId as assigned_doctorId FROM userData JOIN patientpersonaldata ON userData.userId=patientpersonaldata.userId JOIN patientmedicaldata ON patientpersonaldata.patientId=patientmedicaldata.patientId", (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            return callback(result)
        }
    })
}
export { patientPersonalByUserId, insertPatientPersonalData, insertPatientFamilyData, insertPatientIdDocumentData, insertPatientDocumentData, insertPatientMedicalData, patientFamilyByPatientId, patientDocumentByPatientId, patientMedicalDataByUserId, updatePatientPersonalData, updatePatientFamilyData, deletePatientMedicalData, deletePatientReportData, deletePatientDocumentData, deletePatientFamilyData, deletePatientPersonalData, viewPatientMedicalHistory, updatePatientMedicalData, viewMedicalHistoryByDoctor, ScheduleAppointments, viewAppointments, availablePatients, assignedPatientWithDoctor }
