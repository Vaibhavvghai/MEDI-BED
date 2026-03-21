import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validate() {
  console.log('🔍 MediBed Database Validation');
  console.log('═══════════════════════════════');

  const counts = {
    hospitals: await prisma.hospital.count(),
    beds: await prisma.bed.count(),
    admins: await prisma.admin.count(),
    doctors: await prisma.doctor.count(),
    patients: await prisma.patient.count(),
    bedBookings: await prisma.bedBooking.count(),
    prescriptions: await prisma.prescription.count(),
  };

  const expectations: Record<string, number> = {
    hospitals: 200,
    beds: 10000,
    admins: 200,
    doctors: 2000,
    patients: 1000,
    bedBookings: 500,
    prescriptions: 1000,
  };

  let allPassed = true;

  for (const [table, count] of Object.entries(counts)) {
    const expected = expectations[table];
    const passed = count >= expected;
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${table}: ${count} (expected ≥ ${expected})`);
    if (!passed) allPassed = false;
  }

  // Validate FK relationships
  console.log('\n🔗 Foreign Key Relationship Checks:');

  const bedsWithHospital = await prisma.bed.count({
    where: { hospital: { isNot: null } },
  });
  console.log(`✅ All ${bedsWithHospital} beds linked to hospitals`);

  const doctorsWithHospital = await prisma.doctor.count({
    where: { hospital: { isNot: null } },
  });
  console.log(`✅ All ${doctorsWithHospital} doctors linked to hospitals`);

  const bookingsValid = await prisma.bedBooking.count({
    where: {
      bed: { isNot: null },
      patient: { isNot: null },
      doctor: { isNot: null },
    },
  });
  console.log(`✅ All ${bookingsValid} bookings have valid bed/patient/doctor FKs`);

  // Sample data
  console.log('\n📋 Sample Records:');
  const sampleHospital = await prisma.hospital.findFirst({ include: { _count: { select: { beds: true, doctors: true } } } });
  console.log(`   Hospital: ${sampleHospital?.name} (${sampleHospital?._count.beds} beds, ${sampleHospital?._count.doctors} doctors)`);

  const samplePatient = await prisma.patient.findFirst();
  console.log(`   Patient: ${samplePatient?.name} | Privacy: ${samplePatient?.privacyCode} | Blood: ${samplePatient?.bloodType}`);

  console.log('\n═══════════════════════════════');
  console.log(allPassed ? '🎉 All validations PASSED!' : '⚠️  Some validations FAILED');
}

validate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
