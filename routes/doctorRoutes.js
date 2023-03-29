import express from 'express'
const router = express.Router()
import { getCode } from '../models/fileModel.js'
import authenticateUser from '../middleware/auth.js'

import {
    insertDoctorData,
    createPatientByDoctor,
    insertMedicalDataByDoctor,
    updatePMDataByDoctor,
    viewMedicalHistory,
    insertAppointmentsByDoctor,
    viewAppointmentByDoctor,
    viewAssignedPatients,
    updateDoctorData,
    uploadReport,
    uploadMedicalReport,
    viewPatientReports,
    downloadPatientReports,
    uploadPrescription
} from '../controllers/doctorController.js'


router.route('/insert-doctor-data').post(authenticateUser, insertDoctorData)
router.route('/create-patient').post(authenticateUser, createPatientByDoctor)
router.route('/insert-medical-data').post(authenticateUser, insertMedicalDataByDoctor)
router.route('/insert-medical-report').post(authenticateUser, uploadReport, uploadMedicalReport)
router.route('/schedule-appointments').post(authenticateUser, insertAppointmentsByDoctor)
router.route('/upload-prescription').post(authenticateUser, uploadReport, uploadPrescription)


router.route('/update-medical-data').patch(authenticateUser, updatePMDataByDoctor)
router.route('/update-doctor-data').patch(authenticateUser, updateDoctorData)


router.route('/google/callback').get(getCode)
router.route('/view-medical-history').get(authenticateUser, viewMedicalHistory)
router.route('/view-appointments').get(authenticateUser, viewAppointmentByDoctor)
router.route('/view-assigned-patients').get(authenticateUser, viewAssignedPatients)
router.route('/view-patient-reports').get(authenticateUser, viewPatientReports)
router.route('/download-patient-reports').get(authenticateUser, downloadPatientReports)


export default router