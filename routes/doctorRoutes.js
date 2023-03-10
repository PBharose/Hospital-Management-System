import express from 'express'
const router = express.Router()

import authenticateUser from '../middleware/auth.js'
import {insertDoctorData,createPatientByDoctor,insertMedicalDataByDoctor,updatePMDataByDoctor,viewMedicalHistory,ScheduleAppointmentsByDoctor,viewAppointmentByDoctor,availablePatientsForAppointment, viewAssignedPatients, updateDoctorData, uploadReport, uploadMedicalReport ,viewPatientReports} from '../controllers/doctorController.js'

router.route('/insertDoctorData').post(authenticateUser,insertDoctorData)
router.route('/createPatientByDoctor').post(authenticateUser,createPatientByDoctor)
router.route('/insertMedicalDataByDoctor').post(authenticateUser,insertMedicalDataByDoctor)

router.route('/updatePMDataByDoctor').patch(authenticateUser,updatePMDataByDoctor)
router.route('/viewMedicalHistory').get(authenticateUser,viewMedicalHistory)

router.route('/scheduleAppointmentsByDoctor').patch(authenticateUser,ScheduleAppointmentsByDoctor)
router.route('/viewAppointments').get(authenticateUser,viewAppointmentByDoctor)

router.route('/availablePatientsForAppointment').get(authenticateUser,availablePatientsForAppointment)

router.route('/viewAssignedPatients').get(authenticateUser,viewAssignedPatients)

router.route('/updateDoctorData').patch(authenticateUser,updateDoctorData)

router.route('/insertMedicalReport').post(authenticateUser,uploadReport,uploadMedicalReport)

router.route('/viewPatientReports').get(authenticateUser,viewPatientReports)

export default router