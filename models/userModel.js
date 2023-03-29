import { resolve } from 'path'
import pkg from 'promise'
import db from '../db/connect.js'
const { reject } = pkg;


const userDataByEmail = (req) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM userData WHERE emailId = ?', [req.body.emailId], (err, result) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(result)
            }
        })
    })

}

const insertUserData = (req, password,) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO userData SET ?', {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            emailId: req.body.emailId,
            userPassword: password,
            isAdmin: false,
            isDoctor: false,
            isDeleted: false
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


const updateUserData = (req, id) => {
    return new Promise((resolve, reject) => {
        db.query("UPDATE userData SET ? WHERE userId=? and isDeleted=0", [req.body, id], async (err, result) => {
            if (err) {
                reject(err)
            } else {

                resolve(result)
            }
        })
    })
}


const userDataByUserId = (id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * from userData WHERE userId=?', [id], async (err, result) => {
            if (err) {
                reject(err);
            }
            resolve(result)
        })
    })
}

const allUserData = () => {
    return new Promise((resolve, reject) => {
        db.query("select userData.userId,patientId,firstName,lastName,emailId,isAdmin,isDoctor from userData left outer join patientpersonaldata on userData.userId = patientpersonaldata.userId WHERE isDeleted=0", async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const unApprovedAppointments = () => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM appointments WHERE isApproved=0", (err, result) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(result)
            }
        })
    })

}

const deletepatientsData = (id) => {
    return new Promise((resolve, reject) => {
        db.query("UPDATE userData SET isDeleted=1  WHERE userId =?", [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const recoverpatientsData = (id) => {
    return new Promise((resolve, reject) => {
        db.query("UPDATE userData SET isDeleted=0  WHERE userId =? and isDeleted=1", [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

const approvedAppointmentData = (id) => {
    return new Promise((resolve, reject) => {
        db.query("UPDATE appointments SET isApproved=1  WHERE appointmentId=?", [id], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

const getDoctorAppointmentByDate = (doctorId, appointmentDateTime) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM appointments WHERE doctorId = ? AND appointmentDateTime = ?", [doctorId, appointmentDateTime], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}


const getPatientAppointmentByDate = (patientId, appointmentDateTime) => {
    return new Promise((resolve, reject) => {
        db.query("SELECT * FROM appointments WHERE patientId = ? AND appointmentDateTime = ?", [patientId, appointmentDateTime], async (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })
}

export {
    userDataByEmail,
    insertUserData,
    allUserData,
    updateUserData,
    userDataByUserId,
    deletepatientsData,
    unApprovedAppointments,
    recoverpatientsData,
    approvedAppointmentData,
    getDoctorAppointmentByDate,
    getPatientAppointmentByDate
}
