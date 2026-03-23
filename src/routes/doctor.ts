import express from 'express';
import { authenticateToken, requireRoles, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_medibed';

router.post('/unlock-patient', authenticateToken, requireRoles(['DOCTOR', 'ADMIN']), async (req: AuthRequest, res: any) => {
  console.log('Unlock attempt by User:', req.user);
  const { privacyCode } = req.body;
  
  if (!privacyCode || privacyCode.length !== 3) {
    return res.status(400).json({ error: '3-digit privacy code is required' });
  }

  const patient = await prisma.patient.findFirst({
    where: { privacyCode },
    include: {
      prescriptions: true,
      bedBookings: true
    }
  });

  if (!patient) {
    return res.status(404).json({ error: 'Invalid privacy code' });
  }

  // Create a short-lived token for session
  const sessionToken = jwt.sign(
    { doctorId: req.user?.id, patientId: patient.id },
    JWT_SECRET,
    { expiresIn: '30m' }
  );

  res.json({
    message: 'Patient unlocked for 30 minutes',
    sessionToken,
    patient
  });
});

export default router;
