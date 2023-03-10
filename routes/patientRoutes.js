import express from 'express'
const router = express.Router()

import{ insertPersonalData, insertFamilyData ,upload,uploadDocument,updatePersonalData,updateFamilyData,deleteSelfProfile,patientViewAppointments} from '../controllers/patientController.js'
import authenticateUser from '../middleware/auth.js'


router.route('/insert-personal-data').post(authenticateUser,insertPersonalData) 
router.route('/insert-family-data').post(authenticateUser,insertFamilyData) 
router.route('/insert-document-data').post(authenticateUser,upload,uploadDocument)

router.route('/update-personal-data').patch(authenticateUser,updatePersonalData)
router.route('/update-family-data').patch(authenticateUser,updateFamilyData)

router.route('/delete-self-profile').delete(authenticateUser,deleteSelfProfile)

//view upcoming appointments
router.route('/view-patient-appointments').get(authenticateUser,patientViewAppointments)


export default router