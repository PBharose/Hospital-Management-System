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

const loginUser = async (req, res) => {
    const { emailId, userPassword } = req.body;
    if (!emailId || !userPassword) {
        return res.status(400).json({
            status: "error", error: "Please provide all values"
        });
    }
    else {
        userDataByEmail(req, async function (result) {
            if (!result[0] || !await bcrypt.compare(userPassword, result[0].userPassword)) return res.json({ status: "error", error: "Incorrect credentials" })
            else {
                const token = jwt.sign({ id: result[0].userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })
                const user = { userId: result[0].userId, name: result[0].firstName + ' ' + result[0].lastName, emailId: result[0].emailId, isAdmin: result[0].isAdmin, isDoctor: result[0].isDoctor }
                return res.status(200).json({ status: "success", success: "Login successful!!", token, userDetails: user })
            }
        })
    }
}

const allUsers = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    checkIsAdmin(userIdValue.id, async function (result) {
        if (result[0].isAdmin == 1) {
            allUserData(async function (result) {
                return res.status(200).json(result)
            })
        } else {
            return res.status(401).send("Unauthorized user");
        }
    })
}

const updateUser = (req, res) => {                                  //userData table
    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    updateUserData(req, userIdValue.id, async function (result) {
        return res.status(200).send("Data updated successfully")
    })
}

const editUserData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    checkIsAdmin(userIdValue.id, async function (result) {
        if (result[0].isAdmin == 1) {
            updateUserData(req, id.id, async function (result) {
                return res.status(200).send("User data updated successfully")
            })
        }
        else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

const editPersonalData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    checkIsAdmin(userIdValue.id, async function (result) {
        if (result[0].isAdmin == 1) {
            const { height, weight, DOB } = req.body
            var BMI, age;
            patientPersonalByUserId(id.id, async function (hwValue) {
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
                    //console.log(BMI)
                }
                else if (!height && weight) {
                    BMI = (weight / (hwValue[0].height[0] * 0.3048 + hwValue[0].height[2] * 0.0254) ** 2).toFixed(2)
                    // console.log(BMI)
                }
                else {
                    BMI = hwValue[0].BMI
                }
                updatePatientPersonalData(req, age, BMI, id.id, async function (result) {
                    return res.status(200).send("Personal data updated successfully")
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
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    checkIsAdmin(userIdValue.id, async function (result) {
        if (result[0].isAdmin == 1) {
            patientPersonalByUserId(id.id, async function (personalData) {
                updatePatientFamilyData(personalData[0].patientId, req, async function (results) {
                    if (results.affectedRows == 0) return res.status(404).send("data is not inserted")
                    else {
                        return res.status(200).send("Family data updated successfully")
                    }
                })
            })
        } else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

const deletePatient = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const id = req.query
    checkIsAdmin(userIdValue.id, async function (result) {
        if (result[0].isAdmin == 1) {
            patientPersonalByUserId(id.id, async function (personalData) {
                if (!personalData[0]) {
                    deleteUserData(id.id, async function (result) {
                        return res.status(200).send("Record deleted Successfully")
                    })
                }
                else {
                    deletePatientReportData(personalData[0].patientId, async function (del1) {
                        deletePatientMedicalData(personalData[0].patientId, async function (del2) {
                            deletePatientDocumentData(personalData[0].patientId, async function (del3) {
                                deletePatientFamilyData(personalData[0].patientId, async function (del4) {
                                    deletePatientPersonalData(personalData[0].patientId, async function (del4) {
                                        deleteUserData(id.id, async function (del5) {
                                            return res.status(200).send("Record deleted Successfully")
                                        })
                                    })
                                })
                            })
                        })
                    })
                }
            })
        } else {
            return res.status(401).send("Unauthorized user")
        }
    })
}

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

export { registerUser, loginUser, updateUser, allUsers, editFamilyData, editUserData, editPersonalData, deletePatient, insertMedicalDataByAdmin, viewPatientDocumentByAdmin }