import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_medibed';

router.post('/login/doctor', async (req, res) => {
  const { email } = req.body;
  const doctor = await prisma.doctor.findUnique({ where: { email } });
  
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  
  const token = jwt.sign(
    { id: doctor.id, role: 'DOCTOR', hospitalId: doctor.hospitalId },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  res.json({ token, doctor });
});

router.post('/login/admin', async (req, res) => {
  const { email, password } = req.body; // Add basic password check if this wasn't purely a stub
  const admin = await prisma.admin.findUnique({ where: { email } });
  
  if (!admin || admin.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { id: admin.id, role: 'ADMIN', hospitalId: admin.hospitalId },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  res.json({ token, admin });
});

router.post('/login/patient', async (req, res) => {
  const { email } = req.body;
  const patient = await prisma.patient.findUnique({ where: { email } });
  
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  
  const token = jwt.sign(
    { id: patient.id, role: 'PATIENT' },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  res.json({ token, patient });
});
router.post('/signup/doctor', async (req, res) => {
  const { name, email, specialty, schedule, phone, hospitalId } = req.body;
  try {
    const doctor = await prisma.doctor.create({
      data: { name, email, specialty, schedule, phone, hospitalId: parseInt(hospitalId) }
    });
    const token = jwt.sign({ id: doctor.id, role: 'DOCTOR', hospitalId: doctor.hospitalId }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, doctor });
  } catch (error) {
    res.status(400).json({ error: 'Failed to signup as doctor' });
  }
});

router.post('/signup/admin', async (req, res) => {
  const { name, email, password, hospitalId } = req.body;
  try {
    const admin = await prisma.admin.create({
      data: { name, email, passwordHash: password, role: 'ADMIN', hospitalId: parseInt(hospitalId) }
    });
    const token = jwt.sign({ id: admin.id, role: 'ADMIN', hospitalId: admin.hospitalId }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, admin });
  } catch (error) {
    res.status(400).json({ error: 'Failed to signup as admin' });
  }
});

router.post('/signup/patient', async (req, res) => {
  const { name, email, phone, privacyCode, bloodType, dateOfBirth } = req.body;
  try {
    const patient = await prisma.patient.create({
      data: { name, email, phone, privacyCode, bloodType, dateOfBirth: new Date(dateOfBirth), role: 'PATIENT' }
    });
    const token = jwt.sign({ id: patient.id, role: 'PATIENT' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, patient });
  } catch (error) {
    res.status(400).json({ error: 'Failed to signup as patient' });
  }
});

export default router;
