import express from 'express'
const router = express.Router()

import{registerUser,loginUser,updateUser,allUsers,editUserData,editPersonalData,editFamilyData,deletePatient,insertMedicalDataByAdmin,viewPatientDoctor,viewPatientDocumentByAdmin} from "../controllers/userController.js"
import authenticateUser from '../middleware/auth.js'


//USER ROUTES
router.route('/register-user').post(registerUser)
router.route('/login-user').post(loginUser)
router.route('/update-user').patch(authenticateUser,updateUser)


//ADMIN ROUTES
router.route('/admin/all-users').get(authenticateUser,allUsers)
router.route('/admin/edit-personal-data').patch(authenticateUser,editPersonalData)
router.route('/admin/edit-family-data').patch(authenticateUser,editFamilyData)
router.route('/admin/edit-user-data').patch(authenticateUser,editUserData)
router.route('/admin/delete-patient').delete(authenticateUser,deletePatient)

router.route('/admin/insert-medical-data').post(authenticateUser,insertMedicalDataByAdmin)
router.route('/admin/view-patient-doctor').get(authenticateUser,viewPatientDoctor)

router.route('/admin/view-patient-documents').get(authenticateUser,viewPatientDocumentByAdmin)

export default router