import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import doctorRoutes from './routes/doctor';
import bedRoutes from './routes/bed';
import appointmentRoutes from './routes/appointment';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// Set io globally so routers can access it
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/appointments', appointmentRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  
  socket.on('join-hospital', (hospitalId: string) => {
    socket.join(`hospital_${hospitalId}`);
    console.log(`Socket ${socket.id} joined hospital_${hospitalId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
