import express from 'express';
import { authenticateToken, requireRoles, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = express.Router();

router.get('/hospital/:hospitalId', async (req: express.Request, res: express.Response) => {
  const { hospitalId } = req.params;
  const beds = await prisma.bed.findMany({
    where: { hospitalId: parseInt(hospitalId as string) }
  });
  res.json({ beds });
});

router.post('/book', authenticateToken, requireRoles(['PATIENT', 'ADMIN', 'DOCTOR']), async (req: AuthRequest, res: any) => {
  const { bedId, admissionDate, doctorId } = req.body;
  const patientId = req.user?.id;

  try {
    const bed = await prisma.bed.findUnique({ where: { id: parseInt(bedId) } });
    if (!bed || bed.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Bed is not available' });
    }

    const booking = await prisma.bedBooking.create({
      data: {
        bedId: parseInt(bedId),
        patientId: patientId as number,
        doctorId: doctorId || 1, // Fallback
        admissionDate: new Date(admissionDate || Date.now()),
        status: 'ACTIVE'
      }
    });

    const updatedBed = await prisma.bed.update({
      where: { id: parseInt(bedId) },
      data: { status: 'OCCUPIED' }
    });

    const io = req.app.get('io');
    io.to(`hospital_${bed.hospitalId}`).emit('bed:status-changed', {
      bedId: updatedBed.id,
      status: updatedBed.status
    });

    res.json({ message: 'Bed booked', booking, updatedBed });
  } catch (error) {
    res.status(500).json({ error: 'Failed to book bed' });
  }
});

export default router;
