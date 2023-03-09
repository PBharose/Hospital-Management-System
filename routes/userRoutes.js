import express from 'express'
const router = express.Router()

import{registerUser,loginUser,updateUser,allUsers,editUserData,editPersonalData,editFamilyData,deletePatient,insertMedicalDataByAdmin,viewPatientDoctor,viewPatientDocumentByAdmin} from "../controllers/userController.js"
import authenticateUser from '../middleware/auth.js'


//USER ROUTES
router.route('/registerUser').post(registerUser)
router.route('/loginUser').post(loginUser)
router.route('/updateUser').patch(authenticateUser,updateUser)


//ADMIN ROUTES
router.route('/admin/allUsers').get(authenticateUser,allUsers)
router.route('/admin/editPersonalData').patch(authenticateUser,editPersonalData)
router.route('/admin/editFamilyData').patch(authenticateUser,editFamilyData)
router.route('/admin/editUserData').patch(authenticateUser,editUserData)
router.route('/admin/deletePatient').delete(authenticateUser,deletePatient)

router.route('/admin/insertMedicalDataByAdmin').post(authenticateUser,insertMedicalDataByAdmin)
router.route('/admin/viewPatientDoctor').get(authenticateUser,viewPatientDoctor)

router.route('/admin/viewPatientDocumentByAdmin').get(authenticateUser,viewPatientDocumentByAdmin)

export default router