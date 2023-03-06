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
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const patientFamilyByPatientId = (id, callback) => {
    db.query('SELECT * FROM patientFamilyData  WHERE patientId = ?', [id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const insertPatientFamilyData = (id, req, callback) => {
    db.query('INSERT INTO patientFamilyData  SET ?', {
        patientId: id,
        fatherName: req.body.fatherName,
        fatherAge: req.body.fatherAge,
        fatherCountry: req.body.fatherCountry,
        motherName: req.body.motherName,
        motherAge: req.body.motherAge,
        motherCountry: req.body.motherCountry,
        parentsDiabetic: req.body.parentsDiabetic,
        parentsCardiac: req.body.parentsCardiac,
        parentsBP: req.body.parentsBP,
    }, (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const patientDocumentByPatientId = (id, callback) => {
    db.query('SELECT * FROM patientDocumentData  WHERE patientId = ?', [id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const insertPatientIdDocumentData = (id,callback) =>{
    db.query('INSERT INTO patientDocumentData SET?',{
        patientId:id
    },(err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
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

const updatePatientPersonalData = (req, age, BMI, id, callback) => {
    db.query("UPDATE patientPersonalData SET ?,age=?, BMI =? WHERE userId=?", [req.body, age, BMI, id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const updatePatientFamilyData = (req,id, callback) => {
    db.query("UPDATE patientFamilyData SET ? WHERE patientId=?", [req.body, id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const deletePatientFamilyData = (id, callback) => {
    db.query("DELETE FROM patientFamilyData WHERE patientId =?", [id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const deletePatientPersonalData = (id, callback) => {
    db.query("DELETE FROM patientPersonalData WHERE patientId=?", [id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const deletePatientDocumentData = (id, callback) => {
    db.query("DELETE FROM patientDocumentData WHERE patientId=?", [id], async (err, result) => {
        if (err){
            console.log(err);
        }
        return callback(result)
    })
}

const insertPatientMedicalData = (req, patientId,doctorId, callback) => {
    db.query('INSERT INTO patientMedicalData SET ?', {
        patientId: patientId,
        doctorId:doctorId,
        medicalHistory:req.body.medicalHistory,
        treatmentPlan:req.body.treatmentPlan,
        appointmentDateTime:req.body.appointmentDateTime,
        reasonForAppointment:req.body.reasonForAppointment
    }, (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const patientMedicalDataByUserId = (patientId,doctorId, callback) => {
    db.query('SELECT * from patientMedicalData WHERE patientId=? and doctorId=?', [patientId,doctorId], async (err, result) => {
        if (err) {
            console.log(err)
        } else {

            return callback(result)
        }
    })
}

const patientAppointmentData = (id,callback) => {
    db.query('select firstName, lastName, appointmentDateTime from patientMedicalData Join doctorData on patientMedicalData.doctorId = doctorData.doctorId join userData on userData.userId = doctorData.userId where patientMedicalData.patientId = ? and appointmentDateTime >= now() ', [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {

            return callback(result)
        }
    })
}
export {patientPersonalByUserId, insertPatientPersonalData, patientFamilyByPatientId, insertPatientFamilyData, patientDocumentByPatientId, insertPatientIdDocumentData, insertPatientDocumentData, updatePatientPersonalData, updatePatientFamilyData, deletePatientFamilyData, deletePatientPersonalData, deletePatientDocumentData, insertPatientMedicalData, patientMedicalDataByUserId, patientAppointmentData }