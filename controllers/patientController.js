import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'
import { deleteUserData, } from "../models/userModel.js"
import { patientPersonalByUserId, patientFamilyByPatientId, patientDocumentByPatientId, insertPatientPersonalData, insertPatientFamilyData, insertPatientIdDocumentData, insertPatientDocumentData, updatePatientPersonalData, updatePatientFamilyData, deletePatientFamilyData, deletePatientPersonalData, deletePatientDocumentData, deletePatientReportData, deletePatientMedicalData, patientAppointmentData } from '../models/patientModel.js'

//INSERTING PERSONAL DETAILS FOR LOGGED USER
const insertPersonalData = (req, res) => {
    const { mobNumber, DOB, weight, height, countryOfOrigin, diabetic, cardiac, BP, diseaseDescribe } = req.body;

    var age = new Date().getFullYear() - new Date(DOB).getFullYear()
    var h = height.split("-")
    var BMI = (weight / (h[0] * 0.3048 + h[1] * 0.0254) ** 2).toFixed(2)

    const token = req.headers.authorization.split(' ')[1]
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)

    if (!mobNumber || !DOB || !weight || !height || !countryOfOrigin || !diseaseDescribe) {
        return res.status(400).json({ status: "error", error: "please provide all values" })
    }
    else {
        patientPersonalByUserId(userIdvalue.id, function (result) {
            if (result[0]) return res.status(409).json({ error: "Personal data is already filled" })
            else {
                insertPatientPersonalData(req, userIdvalue.id, age, BMI, function (result1) {
                    return res.status(201).json({ status: "success", success: "Personal data is filled." })
                })
            }
        })
    }
}

//INSERTING FAMILY DETAILS FOR LOGGED USER
const insertFamilyData = (req, res) => {
    const { fatherName, fatherAge, fatherCountry, motherName, motherAge, motherCountry, parentsDiabetic, parentsCardiac, parentsBP } = req.body;

    const token = req.headers.authorization.split(' ')[1]
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)

    if (!fatherName || !fatherAge || !fatherCountry || !motherName || !motherAge || !motherCountry) {
        return res.status(400).json({ status: "error", error: "please provide all values" })
    }
    else {
        patientPersonalByUserId(userIdvalue.id, function (personalData) {
            patientFamilyByPatientId(personalData[0].patientId, function (familyData) {
                if (familyData[0]) return res.status(409).json({ error: "Family data is alreay filled" })
                else {
                    insertPatientFamilyData(req, personalData[0].patientId, function (result) {
                        return res.status(201).json({ status: "success", success: "Patient family data filled." })
                    })
                }
            })
        })
    }
}

const upload = multer({
    storage: multer.diskStorage({
        destination: "./Uploads/",
        filename: function (req, file, callback) {
            callback(null, file.originalname)
        }
    })
}).array("filename", 4);

const uploadDocument = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    var i;
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_REDIRECT_URI,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: process.env.GOOGLE_DRIVE_ACCESS_TOKEN })

    const drive = google.drive({
        version: 'v3',
        auth: oauth2Client
    })
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename)
    const __filePath = path.join(__dirname, '../Uploads/')

    fs.readdir(__filePath, (err, files) => {
        var newf = []
        if (err) throw err;
        files.forEach(file => newf.push(path.join(__filePath, file)))

        patientPersonalByUserId(userIdValue.id, function (personalData) {
            patientDocumentByPatientId(personalData[0].patientId, function (documentData) {
                if (documentData[0]) return res.status(409).json({ error: "patientId already filled" })
                else {
                    insertPatientIdDocumentData(personalData[0].patientId, function (result) {
                        return res.status(201).json({ status: "success", success: "Documents uploaded." })
                    })
                }
            })
        })

        newf.forEach(pathOfFile => uploadFile(pathOfFile))
    })

    async function uploadFile(newfilepath) {
        try {
            const responses = await drive.files.create({
                requestBody: {
                    name: path.basename(newfilepath),
                    mimeType: 'image/png'
                },
                media: {
                    mimeType: 'image/png',
                    body: fs.createReadStream(newfilepath)
                }
            });
            i = responses.data
        } catch (err) {
            console.log(err)
            throw err
        }
        patientPersonalByUserId(userIdValue.id, function (personalData) {
            insertPatientDocumentData(i, personalData[0].patientId, function (result) {
                return res.status(201).send("File uploaded successfully");
            })
        })
        fs.unlinkSync(newfilepath)
    }
}

//UPDATE PERONAL DATA OF LOGGED USER
const updatePersonalData = async (req, res, next) => {

    const { height, weight, DOB } = req.body
    const token = req.headers.authorization.split(' ')[1];
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)
    var BMI, age;

    patientPersonalByUserId(userIdvalue.id, function (hwValue) {
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
        updatePatientPersonalData(req, age, BMI, userIdvalue.id, async function (result) {
            return res.status(200).send("Personal data updated successfully.")
        })
    })
}

const updateFamilyData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    patientPersonalByUserId(userIdValue.id, async function (personalData) {
        updatePatientFamilyData(req, personalData[0].patientId, async function (result) {
            return res.status(200).send("Family data updated successfully.")
        })
    })
}


const deleteSelfProfile = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET);
    
    patientPersonalByUserId(userIdValue.id, async function (personalData) {
        if (!personalData[0]) {
            deleteUserData(userIdValue.id, async function (del) {
                return res.status(200).send("Record deleted Successfully.")
            })
        }
        else {
            deletePatientDocumentData(personalData[0].patientId, async function (del1) {
                deletePatientFamilyData(personalData[0].patientId, async function (del2) {
                    deletePatientPersonalData(personalData[0].patientId, async function (del3) {
                        deleteUserData(userIdValue.id, async function (del4) {
                            return res.status(200).send("Record deleted Successfully")
                        })
                    })
                })
            })
        }
    })
}

const patientViewAppointments = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET);

    patientPersonalByUserId(userIdValue.id, async function (personalData) {
        patientAppointmentData(personalData[0].patientId, async function (result) {
            return res.status(200).json(result);
        })
    })
}


export { insertPersonalData, insertFamilyData, updatePersonalData, updateFamilyData, deleteSelfProfile, uploadDocument, upload, patientViewAppointments }
