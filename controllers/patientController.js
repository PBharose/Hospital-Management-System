import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import { fileURLToPath } from 'url'
import open from 'open'
import config from '../config.json' assert {type: "json"}

import { tokens, authorizationUrl, oAuth2Client, drive, deleteFile } from '../models/fileModel.js'
import {
    patientPersonalByUserId,
    patientFamilyByPatientId,
    patientDocumentByPatientId,
    insertPatientPersonalData,
    insertPatientFamilyData,
    insertPatientIdDocumentData,
    insertPatientDocumentData,
    updatePatientPersonalData,
    updatePatientFamilyData,
    patientAppointmentData,
    insertMedicalHistoryReport,
    updateMedicalHistory
} from '../models/patientModel.js'


//INSERTING PERSONAL DETAILS FOR LOGGED USER
const insertPersonalData = (req, res) => {
    const { mobNumber, DOB, weight, height, countryOfOrigin, diabetic, cardiac, BP, diseaseDescribe } = req.body;

    var age = new Date().getFullYear() - new Date(DOB).getFullYear()
    var h = height.split("-")
    var BMI = (weight / (h[0] * 0.3048 + h[1] * 0.0254) ** 2).toFixed(2)

    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)

    if (!mobNumber || !DOB || !weight || !height || !countryOfOrigin || !diseaseDescribe) {
        return res.status(config.error.allValues.statusCode).send(config.error.allValues)
    }
    else {
        patientPersonalByUserId(userIdValue.id)
            .then((personalData) => {
                if (personalData[0]) {
                    throw config.error.alreadyExist
                }
                else {
                    return insertPatientPersonalData(req, userIdValue.id, age, BMI)
                }
            })
            .then((result) => {
                throw config.success.insert
            })
            .catch((error) => {
                return res.status(error.statusCode).send(error)
            })
    }
}


//INSERTING FAMILY DETAILS FOR LOGGED USER
const insertFamilyData = (req, res) => {
    const { fatherName, fatherAge, fatherCountry, motherName, motherAge, motherCountry, parentsDiabetic, parentsCardiac, parentsBP } = req.body;

    const token = req.headers.authorization.split(' ')[1]
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)

    if (!fatherName || !fatherAge || !fatherCountry || !motherName || !motherAge || !motherCountry) {
        return res.status(config.error.allValues.statusCode).send(config.error.allValues)
    }
    else {

        patientPersonalByUserId(userIdValue.id)
            .then((personalData) => {
                if (!personalData[0]) {
                    throw config.error.patientNotFoundError
                }
                else {
                    return Promise.all([patientFamilyByPatientId(personalData[0].patientId), personalData])
                }
            })
            .then(([familyData, personalData]) => {
                if (familyData[0]) {
                    throw config.error.alreadyExist
                }
                else {
                    return insertPatientFamilyData(req, personalData[0].patientId)
                }
            })
            .then((result) => {
                throw config.success.insert
            })
            .catch((error) => {
                return res.status(error.statusCode).send(error)
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


const uploadDocument = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    var i;

    await open(authorizationUrl);

    setTimeout(() => { oAuth2Client.setCredentials(tokens.tokens); }, 4000)
    setTimeout(() => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename)
        const __filePath = path.join(__dirname, '../Uploads/')

        fs.readdir(__filePath, (err, files) => {
            var newf = []
            if (err) throw err;
            files.forEach(file => newf.push(path.join(__filePath, file)))

            patientPersonalByUserId(userIdValue.id)
                .then((personalData) => {
                    if (!personalData[0]) {
                        throw config.error.patientNotFoundError
                    }
                    else {
                        return Promise.all([patientDocumentByPatientId(personalData[0].patientId), personalData])
                    }
                })
                .then(([documentData, personalData]) => {
                    if (documentData[0]) {
                        throw config.error.alreadyExist
                    }
                    else {
                        return insertPatientIdDocumentData(personalData[0].patientId)
                    }
                })
                .then((result) => {
                    throw config.success.insert
                })
                .catch((error) => {
                    return res.status(error.statusCode).send(error)
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
            patientPersonalByUserId(userIdValue.id)
                .then((personalData) => {
                    if (!personalData[0]) {
                        throw config.error.patientNotFoundError
                    }
                    else {
                        return insertPatientDocumentData(i, personalData[0].patientId)
                    }
                })
                .then((result) => {
                    throw config.success.insert
                })
                .catch((error) => {
                    return res.status(error.statusCode).send(error)
                })
            fs.unlinkSync(newfilepath)
        }
    }, 5000);
}


const uploadMedicalHistoryReport = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    var i;
    await open(authorizationUrl);

    setTimeout(() => { oAuth2Client.setCredentials(tokens.tokens); }, 4000)
    setTimeout(() => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename)
        const __filePath = path.join(__dirname, '../Uploads/')
        fs.readdir(__filePath, (err, file) => {
            const file1 = path.join(__filePath, file[0])
            uploadFile(file1)
        })
        async function uploadFile(file1) {
            try {
                const responses = await drive.files.create({
                    requestBody: {
                        name: path.basename(file1),
                        mimeType: 'applications/pdf'
                    },
                    media: {
                        mimeType: 'applications/pdf',
                        body: fs.createReadStream(file1)
                    }
                });
                i = responses.data
            } catch (err) {
                console.log(err)
                throw err
            }
            patientPersonalByUserId(userIdValue.id)
                .then((personalData) => {
                    if (!personalData[0]) {
                        throw config.error.patientNotFoundError
                    }
                    else {
                        return insertMedicalHistoryReport(i, personalData[0].patientId)
                    }
                })
                .then((result) => {
                    throw config.success.insert
                })
                .catch((error) => {
                    return res.status(error.statusCode).send(error)
                })
            fs.unlinkSync(file1)
        }
    }, 5000);
}


//UPDATE PERONAL DATA OF LOGGED USER
const updatePersonalData = async (req, res, next) => {

    const { height, weight, DOB } = req.body
    const token = req.headers.authorization.split(' ')[1];
    const userIdvalue = jwt.verify(token, process.env.JWT_SECRET)
    var BMI, age;

    patientPersonalByUserId(userIdvalue.id)
        .then((hwValue) => {
            if (!hwValue[0]) {
                throw config.error.patientNotFoundError
            }
            else {
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
                return updatePatientPersonalData(req, age, BMI, userIdvalue.id)
            }
        })
        .then((result) => {
            throw config.success.update
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


const updateFamilyData = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    patientPersonalByUserId(userIdValue.id)
        .then((personalData) => {
            if (!personalData[0]) {
                throw config.error.patientNotFoundError
            }
            else {
                return updatePatientFamilyData(req, personalData[0].patientId)
            }
        })
        .then((result) => {
            throw config.success.update
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


const updateMedicalHistoryReport = async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET)
    const fileUrl = req.query.fileUrl
    var fileId = fileUrl.split("/");

    var i;
    await open(authorizationUrl);

    setTimeout(() => { oAuth2Client.setCredentials(tokens.tokens); }, 4000)
    setTimeout(() => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename)
        const __filePath = path.join(__dirname, '../Uploads/')
        fs.readdir(__filePath, (err, file) => {
            const file1 = path.join(__filePath, file[0])
            uploadFile(file1)
        })
        async function uploadFile(file1) {
            try {
                const responses = await drive.files.create({
                    requestBody: {
                        name: path.basename(file1),
                        mimeType: 'applications/pdf'
                    },
                    media: {
                        mimeType: 'applications/pdf',
                        body: fs.createReadStream(file1)
                    }
                });
                i = responses.data
                //console.log(i)
            } catch (err) {
                console.log(err)
                throw err
            }
            patientPersonalByUserId(userIdValue.id)
                .then((personalData) => {
                    if (!personalData[0]) {
                        throw config.error.patientNotFoundError
                    }
                    else {
                        return updateMedicalHistory(i, personalData[0].patientId, fileUrl)
                    }
                })
                .then((result) => {
                    return deleteFile(fileId[5])
                })
                .then((result) => {
                    throw config.success.update
                })
                .catch((error) => {
                    return res.status(error.statusCode).send(error)
                })
            fs.unlinkSync(file1)
        }
    }, 5000);
}


const patientViewAppointments = (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    const userIdValue = jwt.verify(token, process.env.JWT_SECRET);

    patientPersonalByUserId(userIdValue.id)
        .then((personalData) => {
            if (!personalData[0]) {
                throw config.error.patientNotFoundError
            }
            else {
                return patientAppointmentData(personalData[0].patientId)
            }
        })
        .then((result) => {
            return res.json({
                StatusCode: config.success.retrive.statusCode,
                Message: config.success.retrive.Message,
                data: result
            })
        })
        .catch((error) => {
            return res.status(error.statusCode).send(error)
        })
}


export {
    insertPersonalData,
    insertFamilyData,
    upload,
    uploadDocument,
    uploadMedicalHistoryReport,
    updatePersonalData,
    updateFamilyData,
    updateMedicalHistoryReport,
    patientViewAppointments,
}
