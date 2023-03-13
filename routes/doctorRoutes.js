import express from 'express'
const router = express.Router()

import authenticateUser from '../middleware/auth.js'
import {getAuthURL,getAccessToken,insertDoctorData,createPatientByDoctor,insertMedicalDataByDoctor,updatePMDataByDoctor,viewMedicalHistory,ScheduleAppointmentsByDoctor,viewAppointmentByDoctor,availablePatientsForAppointment, viewAssignedPatients, updateDoctorData, uploadReport, uploadMedicalReport ,viewPatientReports} from '../controllers/doctorController.js'

router.route('/insert-doctor-data').post(authenticateUser,insertDoctorData)
router.route('/create-patient').post(authenticateUser,createPatientByDoctor)
router.route('/insert-medical-data').post(authenticateUser,insertMedicalDataByDoctor)

router.route('/update-medical-data').patch(authenticateUser,updatePMDataByDoctor)
router.route('/view-medical-history').get(authenticateUser,viewMedicalHistory)

router.route('/schedule-appointments').patch(authenticateUser,ScheduleAppointmentsByDoctor)
router.route('/view-appointments').get(authenticateUser,viewAppointmentByDoctor)

router.route('/available-patients-for-appointment').get(authenticateUser,availablePatientsForAppointment)

router.route('/view-assigned-patients').get(authenticateUser,viewAssignedPatients)

router.route('/update-doctor-data').patch(authenticateUser,updateDoctorData)

router.route('/insert-medical-report').post(authenticateUser,uploadReport,uploadMedicalReport)

router.route('/view-patient-reports').get(authenticateUser,viewPatientReports)

router.route('/getAuthURL').get(getAuthURL)
router.route('/google/callback').get(getAccessToken)

export default router