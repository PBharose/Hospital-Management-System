import express from 'express'
const router = express.Router()

import {registerUser, loginUser, updateUser, allUsers,editFamilyData, editPersonalData, editUserData, deletePatient, insertMedicalDataByAdmin,viewPatientDocumentByAdmin} from '../controllers/userController.js'
import authenticateUser from '../middleware/auth.js'

router.route('/registerUser').post(registerUser)
router.route('/loginUser').post(loginUser)
router.route('/updateUser').patch(authenticateUser, updateUser)

router.route('/admin/allUsers').get(authenticateUser,allUsers)

router.route('/admin/deletePatient').delete(authenticateUser, deletePatient)

router.route('/admin/editUser').patch(authenticateUser,editUserData)
router.route('/admin/editPersonalData').patch(authenticateUser,editPersonalData)
router.route('/admin/editFamilyData').patch(authenticateUser,editFamilyData)

router.route('/admin/insertMedicalDataByAdmin').post(authenticateUser,insertMedicalDataByAdmin)

router.route('/admin/viewPatientDocumentByAdmin').get(authenticateUser,viewPatientDocumentByAdmin)

export default router