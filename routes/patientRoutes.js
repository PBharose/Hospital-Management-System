import express from 'express'
const router = express.Router()
import authenticateUser from '../middleware/auth.js'

import {
    insertPersonalData,
    insertFamilyData,
    upload,
    uploadDocument,
    updatePersonalData,
    updateFamilyData,
    patientViewAppointments,
    uploadMedicalHistoryReport,
    updateMedicalHistoryReport
} from '../controllers/patientController.js'


router.route('/insert-personal-data').post(authenticateUser, insertPersonalData)
router.route('/insert-family-data').post(authenticateUser, insertFamilyData)
router.route('/insert-document-data').post(authenticateUser, upload, uploadDocument)
router.route('/insert-medical-history-report').post(authenticateUser, upload, uploadMedicalHistoryReport)


router.route('/update-personal-data').patch(authenticateUser, updatePersonalData)
router.route('/update-family-data').patch(authenticateUser, updateFamilyData)
router.route('/update-medical-history-report').patch(authenticateUser, upload, updateMedicalHistoryReport)


router.route('/view-patient-appointments').get(authenticateUser, patientViewAppointments)

export default router