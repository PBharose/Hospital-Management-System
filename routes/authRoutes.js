import express from 'express'
const router = express.Router()

import {register, login, updateUser, allUsers, deletePatient} from '../controllers/authController.js'
import authenticateUser from '../middleware/auth.js'
router.route('/register').post(register)
router.route('/login').post(login)
router.route('/updateUser').patch(authenticateUser, updateUser)

router.route('/admin/all-users').get(authenticateUser,allUsers)
router.route('/admin/all-users/:id').delete(authenticateUser, deletePatient )

//router.route('/admin/edit-user/:id').patch(authenticateUser,editUser)
//router.route('/admin/edit-personal-data/:id').patch(authenticateUser,editPersonalData)
//router.route('/admin/edit-family-data/:id').patch(authenticateUser,editFamilyData)


export default router