import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { google } from 'googleapis'
import {deleteUserData} from '../models/userModel.js'
import { patientPersonalByUserId, insertPatientPersonalData, patientFamilyByPatientId, insertPatientFamilyData, patientDocumentByPatientId, insertPatientIdDocumentData, insertPatientDocumentData, updatePatientPersonalData, updatePatientFamilyData, deletePatientFamilyData, deletePatientPersonalData, deletePatientDocumentData, patientAppointmentData } from '../models/patientModel.js'
import { fileURLToPath } from 'url'
import fs from 'fs'

const insertPersonalData = async (req, res) => {
    const { mobNumber, DOB, weight, height, countryOfOrigin, diabetic, cardiac, BP, diseaseDescribe } = req.body;
    if (!mobNumber || !DOB || !weight || !height || !countryOfOrigin || !diseaseDescribe) {
        return res.json({ status: "error", error: "please provide all values" })
    }
    else {
        var age = new Date().getFullYear() - new Date(DOB).getFullYear()
        var h = height.split("-")
        var h_m = h[0] * 0.3048 + h[1] * 0.0254
        var BMI = (weight / h_m ** 2).toFixed(2)

        const token = req.headers.authorization.split(' ')[1]
        const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
        patientPersonalByUserId(userIdValue.id, async function (result) {
            if (result[0]) return res.json({ error: "Personal data already filled!!" })
            else {
                insertPatientPersonalData(req, userIdValue.id, age, BMI, async function (result1) {
                    return res.json({ status: "success", success: "Personal data filled!!" })
                })
            }
        })
    }
}




const insertFamilyData = async (req, res) => {
    const { fatherName, fatherAge, fatherCountry, motherName, motherAge, motherCountry, parentsDiabetic, parentsCardiac, parentsBP } = req.body;
    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)

    if (!fatherName || !fatherAge || !fatherCountry || !motherName || !motherAge || !motherCountry) {
        return res.json({ status: "error", error: "please provide all values" })
    }
    else {
        patientPersonalByUserId(userIdValue.id, async function (personalData) {
            patientFamilyByPatientId(personalData[0].patientId, async function (familyData) {
                if (familyData[0]) return res.json({ error: "Family data is already filled!!" })
                else {
                    insertPatientFamilyData(personalData[0].patientId, req, async function (result) {
                        return res.json({ status: "success", success: "Family data filled!!" })
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
            //console.log(file)
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
        patientPersonalByUserId(userIdValue.id, async function (personalData) {
            patientDocumentByPatientId(personalData[0].patientId, async function (documentData) {
                if (documentData[0]) {
                    return res.send("Patient Id already filled.")
                } else {
                    insertPatientIdDocumentData(personalData[0].patientId, async function (result) {
                        return res.send("Documents uploaded.")
                    })
                }
            })
        })
        files.forEach(file => newf.push(path.join(__filePath, file)))
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
        patientPersonalByUserId(userIdValue.id, async function (personalData) {
            insertPatientDocumentData(i, personalData[0].patientId, function (result) {
                res.send("File uploaded successfully");
            })
        })
        fs.unlinkSync(newfilepath)
    }
}

const updatePersonalData = async (req, res) => {

    const { height, weight, DOB } = req.body
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    var BMI, age;

    patientPersonalByUserId(userIdValue.id, async function (hwValue) {
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
        updatePatientPersonalData(req, age, BMI, userIdValue.id, async function (result) {
            return res.send("Personal data updated successfully.")
        })
    })
}

const updateFamilyData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    patientPersonalByUserId(userIdValue.id, async function (personalData) {
        updatePatientFamilyData(personalData[0].patientId, req, async function (result) {
            return res.send("Family data updated successfully.")
        })
    })
}


const deleteSelfProfile = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET);

    patientPersonalByUserId(userIdValue.id, async function (personalData) {
        if (!personalData[0]) {
            deleteUserData(userIdValue.id, async function (del) {
                return res.send("Record deleted Successfully.")
            })
        }
        else {
            deletePatientDocumentData(personalData[0].patientId, async function (del1) {
                deletePatientFamilyData(personalData[0].patientId, async function (del2) {
                    deletePatientPersonalData(personalData[0].patientId, async function (del3) {
                        deleteUserData(userIdValue.id, async function (del4) {
                            return res.send("Record deleted Successfully")
                        })
                    })
                })
            })
        }
    })
}

const patientViewAppointments = (req,res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET);

    patientPersonalByUserId(userIdValue.id, async function (personalData) {
        patientAppointmentData(personalData[0].patientId, async function (result) {
            return res.json(result);
        })
    })
}


export { insertPersonalData, insertFamilyData, updatePersonalData, updateFamilyData, deleteSelfProfile, uploadDocument, upload, patientViewAppointments}