import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import sendMail from '../helpers/sendMail.js'
import randomstring from 'randomstring'
import { userDataByEmail, insertUserData, checkIsAdmin, allUserData, updateUserData, deleteUserData, deletePatientReportData, deletePatientMedicalData } from '../models/userModel.js'
import { patientPersonalByUserId, updatePatientPersonalData, updatePatientFamilyData, deletePatientFamilyData, deletePatientPersonalData, deletePatientDocumentData, patientMedicalDataByUserId, insertPatientMedicalData, patientDocumentByPatientId } from '../models/patientModel.js'
import { doctorDataByUserId } from '../models/doctorModel.js'


const registerUser = async (req, res) => {
    const { emailId, userPassword, firstName, lastName } = req.body
    if (!firstName || !lastName || !emailId || !userPassword) {
        return res.status(400).json({
            status: "error", error: "Please provide all values"
        })
    } else {
        userDataByEmail(req, async function (result) {
            if (result[0]) return res.status(409).json({ status: "error", error: "Email Id is already registered!!" })
            else {
                const password = await bcrypt.hash(userPassword, 12);
                insertUserData(req, password, function (result) {
                    let mailSubject = 'Mail verification'
                    const randomToken = randomstring.generate()
                    let content = '<p> Hi ' + req.body.firstName + ', Please <a href = "http://localhost:4000/mail-verification?token=' + randomToken + '"> Verify your email!!</a>'
                    sendMail(req.body.emailId, mailSubject, content);
                    return res.status(200).json({ status: "success", success: "User registered successfully!!" })
                })
            }
        })
    }
}

//USER LOGIN 
const loginUser = async (req, res, next) => {
    const { emailId, userPassword } = req.body
    if (!emailId || !userPassword) return res.status(400).json({ status: "error", error: "please provide all values" })
    else {
        userDataByEmail(req, async function (result) {

            if (!result[0] || !await bcrypt.compare(userPassword, result[0].userPassword)) {
                return res.json({ status: "error", error: "Incorrect credentials" })
            }
            else {
                const token = jwt.sign({ id: result[0].userId }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_LIFETIME
                })
                const user = { userId: result[0].userId, name: result[0].firstName + ' ' + result[0].lastName, emailId: result[0].emailId, isAdmin: result[0].isAdmin, isDoctor: result[0].isDoctor }

                return res.status(200).json({ status: "success", success: " login Successful!!", token, userDetails: user })
            }
        })
    }
}


//ADMIN FUNCTION TO SHOW ALL USERS IN DATABASE
const allUsers = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsAdmin(userIdvalue.id, function (result) {
        if (result[0].isAdmin == 1) {
            allUserData(function (result) {
                return res.status(200).json({ result })
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}


//PERSONAL PROFILE/ USERDATA ONLY UPDATE
const updateUser = async (req, res) => {

    const token = req.headers.authorization.split(' ')[1];
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)

    updateUserData(req, userIdvalue.id, function (result) {
        return res.status(200).send("Data updated successfully")
    })
}


const editUserData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    checkIsAdmin(userIdvalue.id, function (result) {
        if (result[0].isAdmin == 1) {
            updateUserData(req, id.id, function (result) {
                return res.status(200).send("User Data updated successfully")
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

const editPersonalData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    checkIsAdmin(userIdvalue.id, function (result) {
        if (result[0].isAdmin == 1) {
            const { height, weight, DOB } = req.body
            var BMI, age;

            patientPersonalByUserId(id.id, function (hwValue) {
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
                updatePatientPersonalData(req, age, BMI, id.id, function (result) {
                    return res.status(200).send("Personal Data updated successfully")
                })
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

const editFamilyData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    checkIsAdmin(userIdvalue.id, function (result) {
        if (result[0].isAdmin == 1) {
            patientPersonalByUserId(id.id, function (personalData) {
                updatePatientFamilyData(req, personalData[0].patientId, function (results) {
                    if (results.affectedRows == 0) return res.status(404).send("data is not inserted")
                    else {
                        return res.status(200).send("Family Data updated successfully")

                    }
                })
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

const deletePatient = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    checkIsAdmin(userIdvalue.id, function (result) {
        if (result[0].isAdmin == 1) {
            patientPersonalByUserId(id.id, function (personalData) {
                if (!personalData[0]) {
                    deleteUserData(req, id.id, function (del) {
                        return res.status(204).send("Record deleted Successfully")
                    })
                }
                else {
                    deletePatientReportData(personalData[0].patientId, function (del1) {
                        deletePatientMedicalData(personalData[0].patientId, function (del2) {
                            deletePatientDocumentData(personalData[0].patientId, function (del3) {
                                deletePatientFamilyData(personalData[0].patientId, function (del4) {
                                    deletePatientPersonalData(personalData[0].patientId, function (del5) {
                                        deleteUserData(id.id, function (del6) {
                                            return res.status(202).send("Record deleted successfully")
                                        })
                                    })
                                })
                            })
                        })
                    })
                }
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }

    })
}

//Inserting patientMedicalData by Admin
const insertMedicalDataByAdmin = (req, res) => {
    const { medicalHistory, treatmentPlan, appointmentDateTime, reasonForAppointment } = req.body;

    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const patientUserId = req.query.patientUserId
    const doctorUserId = req.query.doctorUserId
    checkIsAdmin(userIdValue.id, function (result) {
        if (result[0].isAdmin == 1) {
            if (!appointmentDateTime || !reasonForAppointment) {
                return res.status(400).json({ status: "error", error: "please provide all values" })
            }
            else {
                patientPersonalByUserId(patientUserId, function (personalData) {
                    if (!personalData[0]) {
                        return res.status(404).send("No such patient exist")
                    }
                    else {
                        doctorDataByUserId(doctorUserId, function (doctorData) {
                            if (!doctorData[0]) {
                                return res.status(404).send("No such doctor exist")
                            }
                            else {
                                patientMedicalDataByUserId(personalData[0].patientId, doctorData[0].doctorId, function (result) {
                                    if (result[0]) return res.status(409).json({ error: "Patient is already assigned." })
                                    else {
                                        insertPatientMedicalData(req, personalData[0].patientId, doctorData[0].doctorId, function (result1) {
                                            return res.status(201).json({ status: "success", success: "Patient is now assigned." })
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            }
        } else {
            return res.status(401).send("Unauthorized user")
        }
    })
}
const viewPatientDoctor = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsAdmin(userIdValue.id, function (result) {
        if (result[0].isAdmin == 1) {
            assignedPatientWithDoctor(function (result) {
              
                return res.status(200).json({result })
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

const viewPatientDocumentByAdmin = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET);
    const id = req.query
    checkIsAdmin(userIdValue.id, function (result) {
        if (result[0].isAdmin == 1) {

            patientPersonalByUserId(id.id, async function (personalData) {
                patientDocumentByPatientId(personalData[0].patientId, async function (result) {
                    return res.status(200).json(result);
                })
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

export { registerUser, loginUser, updateUser, allUsers, editFamilyData, editUserData, editPersonalData, deletePatient, insertMedicalDataByAdmin,viewPatientDoctor, viewPatientDocumentByAdmin }
