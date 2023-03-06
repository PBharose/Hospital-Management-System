import express from 'express'
const router = express.Router()

import {registerUser, loginUser, updateUser, allUsers,editFamilyData, editPersonalData, editUserData, deletePatient, insertMedicalDataByAdmin,viewPatientDocumentByAdmin} from '../controllers/userController.js'
import authenticateUser from '../middleware/auth.js'

router.route('/registerUser').post(registerUser)
router.route('/loginUser').post(loginUser)
router.route('/updateUser').patch(authenticateUser, updateUser)

router.route('/admin/allUsers').get(authenticateUser,allUsers)

router.route('/admin/deletePatient/:id').delete(authenticateUser, deletePatient)

router.route('/admin/editUser/:id').patch(authenticateUser,editUserData)
router.route('/admin/editPersonalData/:id').patch(authenticateUser,editPersonalData)
router.route('/admin/editFamilyData/:id').patch(authenticateUser,editFamilyData)

router.route('/admin/insertMedicalDataByAdmin/:patientUserId/:doctorUserId').post(authenticateUser,insertMedicalDataByAdmin)

router.route('/admin/viewPatientDocumentByAdmin/:id').get(authenticateUser,viewPatientDocumentByAdmin)

export default router