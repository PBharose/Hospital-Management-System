import express from 'express'
const router = express.Router()

import{ insertPersonalData, insertFamilyData ,upload,uploadDocument,updatePersonalData,updateFamilyData,deleteSelfProfile,patientViewAppointments} from '../controllers/patientController.js'
import authenticateUser from '../middleware/auth.js'


router.route('/insertPersonalData').post(authenticateUser,insertPersonalData) 
router.route('/insertFamilyData').post(authenticateUser,insertFamilyData) 
router.route('/insertDocumentData').post(authenticateUser,upload,uploadDocument)

router.route('/updatePersonalData').patch(authenticateUser,updatePersonalData)
router.route('/updateFamilyData').patch(authenticateUser,updateFamilyData)

router.route('/deleteSelfProfile').delete(authenticateUser,deleteSelfProfile)

//view upcoming appointments
router.route('/patientViewAppointments').get(authenticateUser,patientViewAppointments)


export default router