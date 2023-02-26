import db from '../db/connect.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import sendMail from '../helpers/sendMail.js'
import randomstring from 'randomstring'

const register = async (req, res) => {
    const { emailId, user_password, first_name, last_name } = req.body
    if (!emailId || !user_password || !first_name || !last_name) {
        return res.json({
            status: "error", error: "Please enter all details!!"
        })
    } else {
        db.query('SELECT * FROM userData where emailId = ?', [emailId], async (err, result) => {
            if (err) throw err;
            if (result[0]) return res.json({ status: "error", error: "Email Id is already registered!!" })
            else {
                const password = await bcrypt.hash(user_password, 12);
                db.query('INSERT INTO userData SET ?', {
                    emailID: emailId,
                    user_password: password,
                    first_name: first_name,
                    last_name: last_name,
                    isAdmin: false
                }, (error, results) => {
                    if (error) throw error;

                    let mailSubject = 'Mail verification'
                    const randomToken = randomstring.generate()
                    let content = '<p> Hi ' + req.body.first_name + ', Please <a href = "http://localhost:4000/mail-verification?token=' + randomToken + '"> Verify your email!!</a>'
                    sendMail(req.body.emailId, mailSubject, content);
                    return res.json({ status: "success", success: "User successfully registered!!" })
                })
            }
        })
    }
}

const login = async (req, res, next) => {
    const { emailId, user_password } = req.body;
    if (!emailId || !user_password) {
        return res.json({
            status: "error", error: "Please enter all details!!"
        });
    }
    else {
        db.query('SELECT * FROM userData WHERE emailId = ?', [emailId], async (err, result) => {
            if (err) throw err;
            if (!result[0] || !await bcrypt.compare(user_password, result[0].user_password)) return res.json({ status: "error", error: "Incorrect credentials" })
            else {
                const token = jwt.sign({ id: result[0].userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })
                const user = { userId: result[0].userId, name: result[0].first_name + ' ' + result[0].last_name, emailId: result[0].emailId, isAdmin: result[0].isAdmin }

                return res.json({ status: "success", success: "Login successful!!", token, user: user })
            }
        })
    }
}

const updateUser = (req, res) => {                                  //userData table
    const token = req.headers.authorization.split(' ')[1]
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    db.query('UPDATE userData SET ? where userId = ?', [req.body, decode.id], async (err, result) => {
        if (err) throw err;
        res.send("updated successfully")
    })

}

const allUsers = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    db.query("SELECT isAdmin from userData WHERE userId=?", [decode.id], async (err, isAdmin) => {
        if (err) throw err;
        else {
            if (isAdmin[0].isAdmin == 1) {
                db.query('SELECT userId, first_name, last_name, emailId, isAdmin FROM userData', async (err, result) => {
                    if (err) throw err;
                    else {
                        return res.json(result)
                    }
                })
            }
        }
    })
}

const deletePatient = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.params
    // console.log(id.id)
    db.query("SELECT isAdmin from userData WHERE userId=?", [decode.id], async (err, isAdmin) => {
        if (err) throw err;
        else {
            if (isAdmin[0].isAdmin == 1) {
                db.query("SELECT patientId from patientPersonalData WHERE userID=?", [id.id], async (err, PatientId) => {
                    if (err) throw err
                    else {
                        if (!PatientId[0]) {
                            connectDB.query("DELETE FROM userData WHERE userId=?", [id.id], async (err, result) => {
                                if (err) throw err;
                                else {
                                    return res.send("Record deleted Successfully")
                                }
                            })
                        }
                        else {
                            db.query("DELETE FROM patientFamilyData WHERE patientId =?", [PatientId[0].patientId], async (err, result) => {
                                if (err) throw err;
                                else {
                                    db.query("DELETE FROM patientPersonalData WHERE patientId=?", [PatientId[0].patientId], async (err, result) => {
                                        if (err) throw err;
                                        else {
                                            db.query("DELETE FROM userData WHERE userId=?", [id.id], async (err, result) => {
                                                if (err) throw err;
                                                else {
                                                    return res.send("Record deleted successfully")
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        }
                    }
                })
            }
            else {
                return res.send("you don't have access")
            }
        }
    })
}
export { register, login, updateUser, allUsers, deletePatient }