import db from "../db/connect.js";

const userDataByEmail = (req, callback) => {
    db.query('SELECT * FROM userData WHERE emailId = ?', [req.body.emailId], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            return callback(result)

        }
    })
}

const insertUserData = (req, password, callback) => {
    db.query('INSERT INTO userData SET ?', {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        emailId: req.body.emailId,
        userPassword: password,
        isAdmin: false,
        isDoctor: false
    }, (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            return callback(result)
        }
    })
}

const checkIsAdmin = (id, callback) => {

    db.query("SELECT isAdmin from userData WHERE userId=?", [id], async (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            return callback(result)
        }

    })
}

const allUserData = (callback) => {
    db.query("SELECT userId,firstName,lastName,emailId,isAdmin,isDoctor FROM userData", async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const updateUserData = (req, id, callback) => {
    db.query("UPDATE userData SET ? WHERE userId=?", [req.body, id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {

            return callback(result)
        }
    })
}

const deleteUserData = (id, callback) => {
    db.query("DELETE FROM userData WHERE userId=?", [id], async (err, result) => {
        if (err) {
            console.log(err)
        } else {
            return callback(result)
        }
    })
}

const userDataByUserId = (id, callback) => {
    db.query('SELECT * from userData WHERE userId=?', [id], async (err, result) => {
        if (err) {
            console.log(err);
        }
        return callback(result)
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
export { userDataByEmail, insertUserData, checkIsAdmin, allUserData, updateUserData, deleteUserData, userDataByUserId,deletePatientMedicalData, deletePatientReportData }
