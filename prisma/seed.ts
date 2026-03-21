import { PrismaClient, WardType, BedStatus, BookingStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// ─── Constants ───────────────────────────────────────────────────────────────

const HOSPITAL_CHAINS = ['Apollo', 'AIIMS', 'Fortis', 'Max', 'Medanta'];

const CITIES: { city: string; state: string }[] = [
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Chandigarh', state: 'Punjab' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Guwahati', state: 'Assam' },
];

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology',
  'Dermatology', 'Gastroenterology', 'Pulmonology', 'Nephrology', 'Urology',
  'Endocrinology', 'Rheumatology', 'Ophthalmology', 'ENT', 'Psychiatry',
  'General Surgery', 'Plastic Surgery', 'Anesthesiology', 'Radiology', 'Pathology',
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const WARD_TYPES: WardType[] = ['ICU', 'GENERAL', 'PRIVATE', 'SEMI_PRIVATE', 'EMERGENCY'];

const SCHEDULES = [
  'Mon-Fri 9AM-5PM', 'Mon-Fri 10AM-6PM', 'Mon-Sat 8AM-2PM',
  'Tue-Sat 2PM-10PM', 'Mon-Wed-Fri 9AM-3PM', 'Mon-Fri 6AM-2PM',
  'Shift A: 6AM-2PM', 'Shift B: 2PM-10PM', 'Shift C: 10PM-6AM',
  'Mon-Fri 8AM-4PM', 'Tue-Thu-Sat 9AM-5PM', 'Wed-Sun 10AM-6PM',
];

const MEDICATIONS = [
  'Amoxicillin 500mg', 'Metformin 850mg', 'Amlodipine 5mg', 'Atorvastatin 20mg',
  'Omeprazole 20mg', 'Paracetamol 650mg', 'Ibuprofen 400mg', 'Cetirizine 10mg',
  'Azithromycin 250mg', 'Pantoprazole 40mg', 'Metoprolol 50mg', 'Losartan 50mg',
  'Ciprofloxacin 500mg', 'Doxycycline 100mg', 'Prednisone 10mg', 'Gabapentin 300mg',
  'Clopidogrel 75mg', 'Levothyroxine 50mcg', 'Montelukast 10mg', 'Ranitidine 150mg',
];

const DOSAGE_INSTRUCTIONS = [
  'Take 1 tablet twice daily after meals',
  'Take 1 tablet once daily in the morning',
  'Take 1 tablet three times daily before meals',
  'Take 2 tablets at bedtime',
  'Take 1 tablet every 8 hours',
  'Take 1 tablet once daily with food',
  'Apply topically twice daily',
  'Take 1 capsule once daily on empty stomach',
  'Dissolve in water and take before meals',
  'Take as needed, max 4 tablets per day',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePrivacyCode(): string {
  return String(randomInt(100, 999));
}

function generateIndianPhone(): string {
  const prefixes = ['98', '97', '96', '95', '94', '93', '91', '90', '88', '87', '86', '85'];
  return `+91${pickRandom(prefixes)}${String(randomInt(10000000, 99999999))}`;
}

// ─── Seeding Functions ───────────────────────────────────────────────────────

async function seedHospitals(): Promise<number[]> {
  console.log('🏥 Seeding 200 hospitals...');
  const hospitals: any[] = [];

  for (let i = 0; i < 200; i++) {
    const chain = HOSPITAL_CHAINS[i % HOSPITAL_CHAINS.length];
    const location = CITIES[i % CITIES.length];
    const branchNum = Math.floor(i / CITIES.length) + 1;
    const totalBeds = randomInt(50, 100);

    hospitals.push({
      name: `${chain} Hospital - ${location.city} Branch ${branchNum}`,
      city: location.city,
      state: location.state,
      address: `${randomInt(1, 500)}, ${faker.location.street()}, ${location.city} - ${randomInt(100000, 999999)}`,
      phone: generateIndianPhone(),
      totalBeds,
    });
  }

  await prisma.hospital.createMany({ data: hospitals });
  const ids = (await prisma.hospital.findMany({ select: { id: true } })).map(h => h.id);
  console.log(`   ✅ Created ${ids.length} hospitals`);
  return ids;
}

async function seedBeds(hospitalIds: number[]): Promise<number[]> {
  console.log('🛏️  Seeding beds (50-100 per hospital)...');
  const BATCH_SIZE = 500;
  let totalBeds = 0;

  for (let batchStart = 0; batchStart < hospitalIds.length; batchStart += 10) {
    const batchHospitals = hospitalIds.slice(batchStart, batchStart + 10);
    const bedsBatch: any[] = [];

    for (const hospitalId of batchHospitals) {
      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId }, select: { totalBeds: true } });
      const bedCount = hospital?.totalBeds || randomInt(50, 100);

      for (let b = 0; b < bedCount; b++) {
        const wardType = WARD_TYPES[b % WARD_TYPES.length];
        bedsBatch.push({
          bedNumber: `${wardType.substring(0, 3)}-${String(b + 1).padStart(3, '0')}`,
          wardType,
          status: pickRandom(['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'RESERVED', 'OCCUPIED'] as BedStatus[]),
          floor: Math.floor(b / 20) + 1,
          hospitalId,
        });
      }
    }

    // Insert in sub-batches
    for (let i = 0; i < bedsBatch.length; i += BATCH_SIZE) {
      await prisma.bed.createMany({ data: bedsBatch.slice(i, i + BATCH_SIZE) });
    }
    totalBeds += bedsBatch.length;
    process.stdout.write(`   🔄 ${totalBeds} beds created...\r`);
  }

  const ids = (await prisma.bed.findMany({ select: { id: true } })).map(b => b.id);
  console.log(`\n   ✅ Created ${ids.length} beds`);
  return ids;
}

async function seedAdmins(hospitalIds: number[]): Promise<void> {
  console.log('👤 Seeding admins (1 per hospital)...');
  const admins: any[] = [];

  for (let i = 0; i < hospitalIds.length; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    admins.push({
      name: `${firstName} ${lastName}`,
      email: `admin.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@medibed.in`,
      passwordHash: faker.string.alphanumeric(64),
      role: 'ADMIN' as const,
      hospitalId: hospitalIds[i],
    });
  }

  await prisma.admin.createMany({ data: admins });
  console.log(`   ✅ Created ${admins.length} admins`);
}

async function seedDoctors(hospitalIds: number[]): Promise<number[]> {
  console.log('👨‍⚕️ Seeding 2000 doctors...');
  const BATCH_SIZE = 500;
  const doctors: any[] = [];

  for (let i = 0; i < 2000; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    doctors.push({
      name: `Dr. ${firstName} ${lastName}`,
      email: `dr.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@medibed.in`,
      specialty: pickRandom(SPECIALTIES),
      schedule: pickRandom(SCHEDULES),
      phone: generateIndianPhone(),
      hospitalId: pickRandom(hospitalIds),
    });
  }

  for (let i = 0; i < doctors.length; i += BATCH_SIZE) {
    await prisma.doctor.createMany({ data: doctors.slice(i, i + BATCH_SIZE) });
    process.stdout.write(`   🔄 ${Math.min(i + BATCH_SIZE, doctors.length)} doctors created...\r`);
  }

  const ids = (await prisma.doctor.findMany({ select: { id: true } })).map(d => d.id);
  console.log(`\n   ✅ Created ${ids.length} doctors`);
  return ids;
}

async function seedPatients(): Promise<number[]> {
  console.log('🧑‍🤝‍🧑 Seeding 1000 patients...');
  const BATCH_SIZE = 500;
  const patients: any[] = [];
  const usedCodes = new Set<string>();

  for (let i = 0; i < 1000; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    // Ensure unique privacy codes
    let code: string;
    do {
      code = generatePrivacyCode();
    } while (usedCodes.has(code));
    usedCodes.add(code);

    patients.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: generateIndianPhone(),
      privacyCode: code,
      bloodType: pickRandom(BLOOD_TYPES),
      dateOfBirth: faker.date.birthdate({ min: 1, max: 90, mode: 'age' }),
      role: 'PATIENT' as const,
    });
  }

  for (let i = 0; i < patients.length; i += BATCH_SIZE) {
    await prisma.patient.createMany({ data: patients.slice(i, i + BATCH_SIZE) });
  }

  const ids = (await prisma.patient.findMany({ select: { id: true } })).map(p => p.id);
  console.log(`   ✅ Created ${ids.length} patients`);
  return ids;
}

async function seedBedBookings(
  bedIds: number[],
  patientIds: number[],
  doctorIds: number[]
): Promise<void> {
  console.log('📋 Seeding ~500 bed bookings...');
  const bookings: any[] = [];
  const usedBeds = new Set<number>();

  for (let i = 0; i < 500; i++) {
    let bedId: number;
    do {
      bedId = pickRandom(bedIds);
    } while (usedBeds.has(bedId));
    usedBeds.add(bedId);

    const admissionDate = faker.date.recent({ days: 30 });
    const isActive = Math.random() > 0.4;

    bookings.push({
      admissionDate,
      dischargeDate: isActive ? null : faker.date.soon({ days: 14, refDate: admissionDate }),
      status: isActive ? 'ACTIVE' : ('DISCHARGED' as BookingStatus),
      bedId,
      patientId: pickRandom(patientIds),
      doctorId: pickRandom(doctorIds),
    });
  }

  const BATCH_SIZE = 250;
  for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
    await prisma.bedBooking.createMany({ data: bookings.slice(i, i + BATCH_SIZE) });
  }

  console.log(`   ✅ Created ${bookings.length} bed bookings`);
}

async function seedPrescriptions(
  patientIds: number[],
  doctorIds: number[]
): Promise<void> {
  console.log('💊 Seeding ~1000 prescriptions...');
  const prescriptions: any[] = [];

  for (let i = 0; i < 1000; i++) {
    prescriptions.push({
      medication: pickRandom(MEDICATIONS),
      dosage: pickRandom(MEDICATIONS).split(' ').pop() || '500mg',
      instructions: pickRandom(DOSAGE_INSTRUCTIONS),
      date: faker.date.recent({ days: 60 }),
      patientId: pickRandom(patientIds),
      doctorId: pickRandom(doctorIds),
    });
  }

  const BATCH_SIZE = 500;
  for (let i = 0; i < prescriptions.length; i += BATCH_SIZE) {
    await prisma.prescription.createMany({ data: prescriptions.slice(i, i + BATCH_SIZE) });
  }

  console.log(`   ✅ Created ${prescriptions.length} prescriptions`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 MediBed Database Seeding Started');
  console.log('════════════════════════════════════════');

  const startTime = Date.now();

  // Phase 1: Hospitals & Infrastructure
  const hospitalIds = await seedHospitals();
  const bedIds = await seedBeds(hospitalIds);
  await seedAdmins(hospitalIds);

  // Phase 2: People
  const doctorIds = await seedDoctors(hospitalIds);
  const patientIds = await seedPatients();

  // Phase 3: Transactional Data
  await seedBedBookings(bedIds, patientIds, doctorIds);
  await seedPrescriptions(patientIds, doctorIds);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('════════════════════════════════════════');
  console.log(`✨ Seeding complete in ${elapsed}s`);

  // Print summary
  const counts = await Promise.all([
    prisma.hospital.count(),
    prisma.bed.count(),
    prisma.admin.count(),
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.bedBooking.count(),
    prisma.prescription.count(),
  ]);

  console.log('\n📊 Database Summary:');
  console.log(`   Hospitals:     ${counts[0]}`);
  console.log(`   Beds:          ${counts[1]}`);
  console.log(`   Admins:        ${counts[2]}`);
  console.log(`   Doctors:       ${counts[3]}`);
  console.log(`   Patients:      ${counts[4]}`);
  console.log(`   Bed Bookings:  ${counts[5]}`);
  console.log(`   Prescriptions: ${counts[6]}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
