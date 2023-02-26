import authenticateUser from '../middleware/auth.js'
import express from 'express'
const router = express.Router()

import { personalData, familyData, documents, updatePersonalData, updateFamilyData, deleteProfile } from '../controllers/patientControllers.js'

//Insert data
router.route('/personal-data').post(authenticateUser,personalData)
router.route('/family-Data').post(authenticateUser,familyData)

//update data
router.route('/update-personal-data').patch(authenticateUser,updatePersonalData)
router.route('/update-family-data').patch(authenticateUser,updateFamilyData)

//delete profile
router.route('/delete-profile').delete(authenticateUser, deleteProfile)
export default router