import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

const ZONES = [
  { slug: 'banani', name: 'Banani', latitude: 23.7937, longitude: 90.4066 },
  { slug: 'gulshan-1', name: 'Gulshan 1', latitude: 23.7806, longitude: 90.4167 },
  { slug: 'mohakhali', name: 'Mohakhali', latitude: 23.7778, longitude: 90.4056 },
  { slug: 'dhanmondi', name: 'Dhanmondi', latitude: 23.7465, longitude: 90.3760 },
  { slug: 'mirpur', name: 'Mirpur', latitude: 23.8223, longitude: 90.3654 },
  { slug: 'uttara', name: 'Uttara', latitude: 23.8759, longitude: 90.3795 },
  { slug: 'farmgate', name: 'Farmgate', latitude: 23.7581, longitude: 90.3906 },
  { slug: 'bashundhara', name: 'Bashundhara', latitude: 23.8151, longitude: 90.4250 },
];

const CAST = [
  {
    email: 'jashim@tesla.dhaka',
    fullName: 'Jashim',
    phone: '+8801711000001',
    role: 'driver',
    teslaName: 'Bullet',
    capacity: 3,
  },
  {
    email: 'nusrat@tesla.dhaka',
    fullName: 'Nusrat',
    phone: '+8801711000002',
    role: 'passenger',
  },
  {
    email: 'rafiq@tesla.dhaka',
    fullName: 'Rafiq',
    phone: '+8801711000003',
    role: 'passenger',
  },
  {
    email: 'shirin@tesla.dhaka',
    fullName: 'Shirin',
    phone: '+8801711000004',
    role: 'passenger',
  },
];

async function seed() {
  // 1. Seed Zones
  for (const z of ZONES) {
    await pool.query(
      `INSERT INTO zones (slug, name, latitude, longitude)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
      [z.slug, z.name, z.latitude, z.longitude],
    );
  }
  console.log(`Seeded ${ZONES.length} Dhaka zones`);

  // 2. Seed Story Cast (Jashim + Bullet, Nusrat, Rafiq, Shirin)
  const defaultPasswordHash = await bcrypt.hash('Password123', 10);

  for (const member of CAST) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, email_verified_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone,
         email_verified_at = NOW()
       RETURNING id`,
      [member.email, defaultPasswordHash, member.fullName, member.phone, member.role],
    );

    const userId = rows[0].id;

    // Seed wallet (1000 BDT = 100,000 paisa)
    await pool.query(
      `INSERT INTO wallets (user_id, balance_paisa)
       VALUES ($1, 100000)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );

    // If driver, seed Tesla "Bullet" with 3 seats
    if (member.role === 'driver') {
      await pool.query(
        `INSERT INTO teslas (driver_id, name, capacity, ops_status)
         VALUES ($1, $2, $3, 'online')
         ON CONFLICT (driver_id) DO UPDATE SET
           name = EXCLUDED.name,
           capacity = EXCLUDED.capacity,
           ops_status = 'online'`,
        [userId, member.teslaName || 'Bullet', member.capacity || 3],
      );
      console.log(`Seeded driver ${member.fullName} with Tesla "${member.teslaName}" (capacity: ${member.capacity})`);
    } else {
      console.log(`Seeded passenger ${member.fullName} (${member.email})`);
    }
  }

  console.log('Seed completed successfully!');
}

seed()
  .then(async () => {
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
