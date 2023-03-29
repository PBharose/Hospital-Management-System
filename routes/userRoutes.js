import express from 'express'
const router = express.Router()
import authenticateUser from '../middleware/auth.js'

import {
    registerUser,
    loginUser,
    updateUser,
    allUsers,
    editUserData,
    editPersonalData,
    editFamilyData,
    deletePatient,
    insertMedicalDataByAdmin,
    viewPatientDoctor,
    viewPatientDocumentByAdmin,
    viewMedicalInfoByAdmin,
    viewUnApprovedAppointments,
    editAppointments,
    insertAppointmentsByAdmin,
    recoverPatient,
    approveAppointment
} from "../controllers/userController.js"


//USER ROUTES
router.route('/register-user').post(registerUser)
router.route('/login-user').post(loginUser)
router.route('/update-user').patch(authenticateUser, updateUser)


//ADMIN ROUTES
router.route('/admin/insert-medical-data').post(authenticateUser, insertMedicalDataByAdmin)
router.route('/admin/insert-appointments').post(authenticateUser, insertAppointmentsByAdmin)


router.route('/admin/edit-user-data').patch(authenticateUser, editUserData)
router.route('/admin/edit-personal-data').patch(authenticateUser, editPersonalData)
router.route('/admin/edit-family-data').patch(authenticateUser, editFamilyData)
router.route('/admin/edit-appointments').patch(authenticateUser, editAppointments)
router.route('/admin/delete-patient').patch(authenticateUser, deletePatient)
router.route('/admin/recover-patient').patch(authenticateUser, recoverPatient)
router.route('/admin/approve-appointment').patch(authenticateUser, approveAppointment)


router.route('/admin/all-users').get(authenticateUser, allUsers)
router.route('/admin/view-patient-doctor').get(authenticateUser, viewPatientDoctor)
router.route('/admin/view-patient-documents').get(authenticateUser, viewPatientDocumentByAdmin)
router.route('/admin/all-medical-info').get(authenticateUser, viewMedicalInfoByAdmin)
router.route('/admin/view-unApproved-appointments').get(authenticateUser, viewUnApprovedAppointments)




export default router