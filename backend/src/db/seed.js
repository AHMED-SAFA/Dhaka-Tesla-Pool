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

async function seed() {
  for (const z of ZONES) {
    await pool.query(
      `INSERT INTO zones (slug, name, latitude, longitude)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
      [z.slug, z.name, z.latitude, z.longitude],
    );
  }
  console.log(`seeded ${ZONES.length} Dhaka zones`);
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
