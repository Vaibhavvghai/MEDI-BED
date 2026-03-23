import express from 'express';
import { authenticateToken, requireRoles, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = express.Router();

// Get all doctors grouped by specialty
router.get('/doctors-by-specialty', authenticateToken, async (req, res) => {
  try {
    const doctors = await (prisma as any).doctor.findMany({
      select: {
        id: true,
        name: true,
        specialty: true,
        hospital: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const grouped = doctors.reduce((acc: any, doc: any) => {
      const spec = doc.specialty || 'General';
      if (!acc[spec]) acc[spec] = [];
      acc[spec].push(doc);
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Patient: Book an appointment
router.post('/book', authenticateToken, requireRoles(['PATIENT']), async (req: AuthRequest, res: any) => {
  const { doctorId, specialty, date, reason } = req.body;
  const patientId = req.user?.id;

  if (!patientId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const appointment = await (prisma as any).appointment.create({
      data: {
        patientId,
        doctorId: typeof doctorId === 'string' ? parseInt(doctorId) : doctorId,
        specialty,
        date: new Date(date as string),
        reason,
        status: 'PENDING'
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit(`new-appointment-doctor-${doctorId}`, appointment);
    }
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to book appointment' });
  }
});

// Doctor: Get my appointments
router.get('/doctor-appointments', authenticateToken, requireRoles(['DOCTOR', 'ADMIN']), async (req: AuthRequest, res: any) => {
  const doctorId = typeof req.user?.id === 'string' ? parseInt(req.user.id) : req.user?.id;
  if (!doctorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const appointments = await (prisma as any).appointment.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: { name: true, email: true, phone: true, bloodType: true }
        },
        prescriptions: true,
        messages: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { date: 'asc' }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Patient/Doctor: Get chat history
router.get('/:id/messages', authenticateToken, async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  try {
    const messages = await (prisma as any).message.findMany({
      where: { appointmentId: parseInt(id as string) },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Patient/Doctor: Send message
router.post('/:id/messages', authenticateToken, async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { content } = req.body;
  const senderId = req.user?.id;
  const senderRole = req.user?.role;

  if (!senderId || !senderRole) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const appointment = await (prisma as any).appointment.findUnique({
      where: { id: parseInt(id as string) },
      include: { patient: true, doctor: true }
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    const message = await (prisma as any).message.create({
      data: {
        content,
        senderId,
        senderRole,
        appointmentId: parseInt(id as string)
      }
    });

    const io = req.app.get('io');
    if (io) {
      // Emit to the specific appointment channel
      io.emit(`new-message-appointment-${id}`, message);
    }

    res.json(message);
  } catch (error) {
    res.status(400).json({ error: 'Failed to send message' });
  }
});

// Doctor: Accept/Reject/Complete appointment
router.patch('/:id/status', authenticateToken, requireRoles(['DOCTOR', 'ADMIN']), async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const appointment = await (prisma as any).appointment.update({
      where: { id: parseInt(id as string) },
      data: { status }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit(`appointment-status-patient-${appointment.patientId}`, appointment);
    }
    res.json(appointment);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update appointment status' });
  }
});

// Doctor: Write Prescription
router.post('/:id/prescription', authenticateToken, requireRoles(['DOCTOR']), async (req: AuthRequest, res: any) => {
  const { id } = req.params;
  const { medication, dosage, instructions } = req.body;
  const doctorId = req.user?.id;

  if (!doctorId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const appointment = await (prisma as any).appointment.findUnique({
      where: { id: parseInt(id as string) },
      select: { patientId: true }
    });

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    const prescription = await (prisma as any).prescription.create({
      data: {
        medication,
        dosage,
        instructions,
        date: new Date(),
        doctorId,
        patientId: appointment.patientId,
        appointmentId: parseInt(id as string)
      }
    });

    res.json(prescription);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create prescription' });
  }
});

// Patient: Get my appointments & prescriptions
router.get('/patient-appointments', authenticateToken, requireRoles(['PATIENT']), async (req: AuthRequest, res: any) => {
  const patientId = req.user?.id;
  if (!patientId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const appointments = await (prisma as any).appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: { name: true, specialty: true, hospital: { select: { name: true } } }
        },
        messages: { orderBy: { createdAt: 'asc' } },
        prescriptions: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your appointments' });
  }
});

export default router;
