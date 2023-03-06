import authenticateUser from '../middleware/auth.js'
import express from 'express'
const router = express.Router()
import { insertPersonalData, insertFamilyData, updatePersonalData, updateFamilyData, deleteSelfProfile, upload, uploadDocument, patientViewAppointments } from '../controllers/patientController.js'
//Insert data
router.route('/insertPersonalData').post(authenticateUser,insertPersonalData)
router.route('/insertFamilyData').post(authenticateUser,insertFamilyData)

//update data
router.route('/updatePersonalData').patch(authenticateUser,updatePersonalData)
router.route('/updateFamilyData').patch(authenticateUser,updateFamilyData)

//delete profile
router.route('/deleteSelfProfile').delete(authenticateUser, deleteSelfProfile)

//upload documents
router.route('/insertDocumentData').post(authenticateUser,upload,uploadDocument)

//view upcoming appointments
router.route('/patientViewAppointments').get(authenticateUser,patientViewAppointments)


export default router