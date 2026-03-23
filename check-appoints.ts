import prisma from './src/prisma';

async function main() {
  const doctors = await (prisma as any).doctor.findMany({
    where: { name: 'Rishabh Singh' },
    select: { id: true, name: true, specialty: true }
  });
  console.log('Doctors named Rishabh Singh:', JSON.stringify(doctors, null, 2));

  const appointments = await (prisma as any).appointment.findMany({
    include: { doctor: true }
  });
  console.log('All Appointments:', JSON.stringify(appointments, null, 2));
}

main();
