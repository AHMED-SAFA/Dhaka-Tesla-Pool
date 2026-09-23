import { query } from '../../db/pool.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

export const listZones = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT id, slug, name, latitude, longitude FROM zones ORDER BY name ASC',
  );
  res.json({ zones: rows });
});
