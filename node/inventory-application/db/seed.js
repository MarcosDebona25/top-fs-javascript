'use strict';

// Deterministic seed for Axle Supply.
//
// Re-running is safe: it adds only missing categories and parts and never
// touches existing rows, so it neither duplicates movements nor alters
// parts that already exist. Movements follow the same rules as the web
// flow (consistent stock_before/stock_after, signed deltas, unique
// request_id per movement).

const crypto = require('crypto');
const db = require('./pool');

const SEED_DATE = '2026-09-02T09:00:00Z';
const MOVEMENT_START = new Date('2026-09-03T10:00:00Z').getTime();
const MOVEMENT_STEP_MS = 37 * 60 * 1000;
const ARCHIVED_AT = '2026-09-20T10:00:00Z';

const CATEGORIES = [
  {
    name: 'Braking',
    description: 'Pads, rotors, calipers and hoses for the braking circuit.',
  },
  {
    name: 'Engine',
    description: 'Ignition, filtration and engine consumables.',
  },
  {
    name: 'Suspension',
    description: 'Dampers, mounts and linkage components.',
  },
  {
    name: 'Electrical',
    description: 'Charging, starting and lighting.',
  },
  {
    name: 'Filtration',
    description: 'Air, oil, fuel and hydraulic filters.',
  },
  {
    name: 'Cooling',
    description: 'Radiators, thermostats, pumps and hoses.',
  },
  {
    name: 'Accessories',
    description: 'Add-ons and shop supplies. Intentionally left empty.',
  },
];

const ITEMS = [
  // Braking
  {
    category: 'Braking', sku: 'BRK-1001', name: 'Ceramic Brake Pad Set',
    brand: 'Brembo', part_number: 'P 85 036',
    description: 'Low-dust ceramic pads for front axle, set of four.',
    unit_price: '89.90',
    movements: [
      { type: 'receipt', quantity: 24, reason: 'Supplier delivery S-1042' },
      { type: 'dispatch', quantity: 6, reason: 'Workshop order SO-2281' },
    ],
  },
  {
    category: 'Braking', sku: 'BRK-1002', name: 'Ventilated Brake Rotor',
    brand: 'Brembo', part_number: '09.A471.11',
    description: 'Front ventilated rotor, 280 mm, high-carbon iron.',
    unit_price: '112.50',
    movements: [
      { type: 'receipt', quantity: 16, reason: 'Supplier delivery S-1042' },
      { type: 'dispatch', quantity: 4, reason: 'Workshop order SO-2281' },
    ],
  },
  {
    category: 'Braking', sku: 'BRK-1003', name: 'Brake Caliper Repair Kit',
    brand: 'Brembo', part_number: 'N 1025',
    description: 'Slide pins, boots and seals for fixed calipers.',
    unit_price: '34.75',
    movements: [
      { type: 'receipt', quantity: 10, reason: 'Supplier delivery S-1043' },
      { type: 'dispatch', quantity: 10, reason: 'Workshop orders SO-2282 to SO-2291' },
    ],
  },
  {
    category: 'Braking', sku: 'BRK-1004', name: 'Stainless Brake Hose',
    brand: 'Goodridge', part_number: 'G-DRL-002',
    description: 'Braided stainless hose, front left, 320 mm.',
    unit_price: '46.20',
    movements: [
      { type: 'receipt', quantity: 12, reason: 'Supplier delivery S-1044' },
      { type: 'dispatch', quantity: 3, reason: 'Workshop order SO-2283' },
      { type: 'adjustment', quantity: 10, reason: 'Shelf count correction' },
    ],
  },
  // Engine
  {
    category: 'Engine', sku: 'ENG-2001', name: 'Iridium Spark Plug',
    brand: 'NGK', part_number: 'LZKAR7AP-11',
    description: 'Long-life iridium spark plug, gap 1.1 mm.',
    unit_price: '14.20',
    movements: [
      { type: 'receipt', quantity: 100, reason: 'Supplier delivery S-1045' },
      { type: 'dispatch', quantity: 37, reason: 'Workshop orders SO-2290 to SO-2304' },
    ],
  },
  {
    category: 'Engine', sku: 'ENG-2002', name: 'Ignition Coil',
    brand: 'Bosch', part_number: '0 221 504 015',
    description: 'Direct ignition coil, plug-top, 12 V.',
    unit_price: '28.90',
    movements: [
      { type: 'receipt', quantity: 40, reason: 'Supplier delivery S-1045' },
      { type: 'dispatch', quantity: 12, reason: 'Workshop order SO-2291' },
      { type: 'adjustment', quantity: 26, reason: 'Shelf count correction' },
    ],
  },
  {
    category: 'Engine', sku: 'ENG-2003', name: 'Engine Air Filter',
    brand: 'Mann-Filter', part_number: 'C 25 012/2',
    description: 'Panel air filter, OE fitment.',
    unit_price: '19.80',
    movements: [
      { type: 'receipt', quantity: 50, reason: 'Supplier delivery S-1046' },
      { type: 'dispatch', quantity: 21, reason: 'Workshop orders SO-2295 to SO-2301' },
    ],
  },
  {
    category: 'Engine', sku: 'ENG-2004', name: 'Oil Filter',
    brand: 'Mann-Filter', part_number: 'HU 712/6x',
    description: 'Spin-on oil filter with anti-drain valve.',
    unit_price: '9.40',
    movements: [
      { type: 'receipt', quantity: 80, reason: 'Supplier delivery S-1046' },
      { type: 'dispatch', quantity: 44, reason: 'Workshop orders SO-2296 to SO-2310' },
    ],
  },
  // Suspension
  {
    category: 'Suspension', sku: 'SUS-3001', name: 'Shock Absorber (Front)',
    brand: 'KYB', part_number: '343411',
    description: 'Gas-pressure damper, front axle, pair pricing per unit.',
    unit_price: '64.60',
    movements: [
      { type: 'receipt', quantity: 20, reason: 'Supplier delivery S-1047' },
      { type: 'dispatch', quantity: 5, reason: 'Workshop order SO-2302' },
    ],
  },
  {
    category: 'Suspension', sku: 'SUS-3002', name: 'Strut Mount',
    brand: 'Monroe', part_number: 'R4067',
    description: 'Upper strut mount with bearing, front.',
    unit_price: '22.30',
    movements: [
      { type: 'receipt', quantity: 30, reason: 'Supplier delivery S-1047' },
      { type: 'dispatch', quantity: 9, reason: 'Workshop order SO-2303' },
    ],
  },
  {
    category: 'Suspension', sku: 'SUS-3003', name: 'Control Arm Bushing',
    brand: 'Moog', part_number: 'K500006',
    description: 'Press-in bushing set for lower control arm.',
    unit_price: '12.90',
    movements: [
      { type: 'receipt', quantity: 45, reason: 'Supplier delivery S-1048' },
      { type: 'dispatch', quantity: 18, reason: 'Workshop orders SO-2305 to SO-2309' },
      { type: 'adjustment', quantity: 24, reason: 'Shelf count correction' },
    ],
  },
  {
    category: 'Suspension', sku: 'SUS-3004', name: 'Stabilizer Bar Link',
    brand: 'Lemförder', part_number: '38344 01',
    description: 'Stabilizer link, front, with ball joint.',
    unit_price: '16.75',
    movements: [
      { type: 'receipt', quantity: 15, reason: 'Supplier delivery S-1048' },
      { type: 'dispatch', quantity: 12, reason: 'Workshop orders SO-2306 to SO-2308' },
    ],
  },
  // Electrical
  {
    category: 'Electrical', sku: 'ELE-4001', name: 'Battery 12V 60Ah',
    brand: 'Bosch', part_number: 'S4 005',
    description: 'Lead-acid battery, 60 Ah, 540 A cold-cranking amps.',
    unit_price: '119.00',
    movements: [
      { type: 'receipt', quantity: 18, reason: 'Supplier delivery S-1049' },
      { type: 'dispatch', quantity: 4, reason: 'Workshop order SO-2311' },
    ],
  },
  {
    category: 'Electrical', sku: 'ELE-4002', name: 'Alternator',
    brand: 'Bosch', part_number: 'AL 1730N',
    description: 'Remanufactured alternator, 90 A, 12 V.',
    unit_price: '189.50',
    movements: [
      { type: 'receipt', quantity: 10, reason: 'Supplier delivery S-1049' },
      { type: 'dispatch', quantity: 2, reason: 'Workshop order SO-2312' },
    ],
  },
  {
    category: 'Electrical', sku: 'ELE-4003', name: 'Starter Motor',
    brand: 'Bosch', part_number: 'SR 088X',
    description: 'Direct-drive starter, 1.4 kW.',
    unit_price: '154.75',
    movements: [
      { type: 'receipt', quantity: 8, reason: 'Supplier delivery S-1050' },
      { type: 'dispatch', quantity: 1, reason: 'Workshop order SO-2313' },
      { type: 'adjustment', quantity: 6, reason: 'Shelf count correction' },
    ],
  },
  {
    category: 'Electrical', sku: 'ELE-4004', name: 'Headlight Bulb H7',
    brand: 'Osram', part_number: '64400',
    description: 'Halogen headlight bulb, 12 V 55 W, twin pack.',
    unit_price: '8.95',
    movements: [
      { type: 'receipt', quantity: 120, reason: 'Supplier delivery S-1050' },
      { type: 'dispatch', quantity: 58, reason: 'Workshop orders SO-2314 to SO-2322' },
    ],
  },
  // Filtration
  {
    category: 'Filtration', sku: 'FIL-5001', name: 'Cabin Air Filter',
    brand: 'Mann-Filter', part_number: 'CU 25 012',
    description: 'Cabin filter with activated carbon layer.',
    unit_price: '17.60',
    movements: [
      { type: 'receipt', quantity: 36, reason: 'Supplier delivery S-1051' },
      { type: 'dispatch', quantity: 14, reason: 'Workshop orders SO-2323 to SO-2326' },
    ],
  },
  {
    category: 'Filtration', sku: 'FIL-5002', name: 'Fuel Filter',
    brand: 'Bosch', part_number: '0 450 905 001',
    description: 'Diesel fuel filter, 2-micron separation.',
    unit_price: '21.40',
    movements: [
      { type: 'receipt', quantity: 28, reason: 'Supplier delivery S-1051' },
      { type: 'dispatch', quantity: 11, reason: 'Workshop order SO-2327' },
    ],
  },
  {
    category: 'Filtration', sku: 'FIL-5003', name: 'Heavy-Duty Oil Filter',
    brand: 'Mann-Filter', part_number: 'HU 912/3x',
    description: 'Spin-on oil filter for commercial vehicles.',
    unit_price: '14.10',
    movements: [
      { type: 'receipt', quantity: 24, reason: 'Supplier delivery S-1052' },
      { type: 'dispatch', quantity: 8, reason: 'Workshop order SO-2328' },
    ],
  },
  {
    category: 'Filtration', sku: 'FIL-5004', name: 'Hydraulic Filter',
    brand: 'Parker', part_number: '1LE-050',
    description: 'Return-line hydraulic filter element. Discontinued line, archived after the last units left the shelf.',
    unit_price: '32.80',
    archived: true,
    movements: [
      { type: 'receipt', quantity: 12, reason: 'Supplier delivery S-1052' },
      { type: 'dispatch', quantity: 12, reason: 'Final orders SO-2330 to SO-2333' },
    ],
  },
  // Cooling
  {
    category: 'Cooling', sku: 'COL-6001', name: 'Radiator',
    brand: 'Behr', part_number: 'HCH 006 180',
    description: 'Aluminum radiator, front mount, with transmission cooler.',
    unit_price: '145.90',
    movements: [
      { type: 'receipt', quantity: 14, reason: 'Supplier delivery S-1053' },
      { type: 'dispatch', quantity: 3, reason: 'Workshop order SO-2334' },
    ],
  },
  {
    category: 'Cooling', sku: 'COL-6002', name: 'Thermostat',
    brand: 'Wahler', part_number: '3326.31',
    description: 'Thermostat with sensor, 87 °C opening.',
    unit_price: '18.25',
    movements: [
      { type: 'receipt', quantity: 26, reason: 'Supplier delivery S-1053' },
      { type: 'dispatch', quantity: 10, reason: 'Workshop order SO-2335' },
    ],
  },
  {
    category: 'Cooling', sku: 'COL-6003', name: 'Water Pump',
    brand: 'INA', part_number: '530 0472 10',
    description: 'Mechanical water pump with gasket.',
    unit_price: '42.30',
    movements: [
      { type: 'receipt', quantity: 22, reason: 'Supplier delivery S-1054' },
      { type: 'dispatch', quantity: 7, reason: 'Workshop order SO-2336' },
      { type: 'adjustment', quantity: 14, reason: 'Shelf count correction' },
    ],
  },
  {
    category: 'Cooling', sku: 'COL-6004', name: 'Coolant Hose (Upper)',
    brand: 'Continental', part_number: 'CT 1044K1',
    description: 'Molded silicone hose, upper radiator, 450 mm.',
    unit_price: '13.60',
    movements: [
      { type: 'receipt', quantity: 32, reason: 'Supplier delivery S-1054' },
      { type: 'dispatch', quantity: 13, reason: 'Workshop orders SO-2337 to SO-2340' },
    ],
  },
];

// Deterministic UUID (v4-shaped) derived from the part SKU and the
// movement index, so every seed run generates the same request ids.
function requestIdFor(sku, index) {
  const hex = crypto
    .createHash('md5')
    .update(`${sku}:${index}`)
    .digest('hex')
    .slice(0, 32);
  const variant = (parseInt(hex[16], 16) & 0x3) | 0x8;
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${variant.toString(16)}${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join('-');
}

function movementTimestamp(index) {
  return new Date(MOVEMENT_START + index * MOVEMENT_STEP_MS).toISOString();
}

async function findCategoryByName(client, name) {
  const { rows } = await client.query(
    'SELECT id FROM categories WHERE lower(name) = lower($1)',
    [name]
  );
  return rows[0] || null;
}

async function findItemBySku(client, sku) {
  const { rows } = await client.query(
    'SELECT id FROM items WHERE sku = $1',
    [sku]
  );
  return rows[0] || null;
}

async function main() {
  const client = await db.connect();
  const summary = { categories: 0, items: 0, movements: 0, skippedItems: 0 };

  try {
    await client.query('BEGIN');

    for (let i = 0; i < CATEGORIES.length; i += 1) {
      const definition = CATEGORIES[i];
      const existing = await findCategoryByName(client, definition.name);
      if (existing) continue;

      const created = new Date(
        new Date(SEED_DATE).getTime() - 24 * 60 * 60 * 1000 + i * 60 * 1000
      ).toISOString();
      await client.query(
        `INSERT INTO categories (name, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4)`,
        [definition.name, definition.description, created, created]
      );
      summary.categories += 1;
    }

    let movementIndex = 0;
    for (const definition of ITEMS) {
      const existing = await findItemBySku(client, definition.sku);
      if (existing) {
        summary.skippedItems += 1;
        continue;
      }

      const category = await findCategoryByName(client, definition.category);
      if (!category) {
        throw new Error(`Seed category missing: ${definition.category}`);
      }

      // Compute the resulting stock from the seeded movements, the same
      // way the transactional service does.
      let stock = 0;
      const prepared = definition.movements.map((movement) => {
        const delta =
          movement.type === 'dispatch' ? -movement.quantity : movement.quantity;
        const record = {
          ...movement,
          delta,
          stockBefore: stock,
          stockAfter: stock + delta,
          requestId: requestIdFor(definition.sku, movementIndex),
          createdAt: movementTimestamp(movementIndex),
        };
        movementIndex += 1;
        stock += delta;
        return record;
      });

      const created = new Date(
        new Date(SEED_DATE).getTime() +
          Math.floor(movementIndex / 10) * 60 * 1000
      ).toISOString();

      const { rows } = await client.query(
        `INSERT INTO items
           (category_id, sku, name, brand, part_number, description,
            unit_price, stock_quantity, archived_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          category.id,
          definition.sku,
          definition.name,
          definition.brand,
          definition.part_number || null,
          definition.description || '',
          definition.unit_price,
          stock,
          definition.archived ? ARCHIVED_AT : null,
          created,
          definition.archived ? ARCHIVED_AT : created,
        ]
      );
      const itemId = rows[0].id;
      summary.items += 1;

      for (const movement of prepared) {
        await client.query(
          `INSERT INTO stock_movements
             (item_id, type, delta, stock_before, stock_after, reason,
              request_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (request_id) DO NOTHING`,
          [
            itemId,
            movement.type,
            movement.delta,
            movement.stockBefore,
            movement.stockAfter,
            movement.reason,
            movement.requestId,
            movement.createdAt,
          ]
        );
        summary.movements += 1;
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log('Seed complete:');
  console.log(`  categories created:  ${summary.categories}`);
  console.log(`  parts created:       ${summary.items}`);
  console.log(`  movements recorded:  ${summary.movements}`);
  console.log(`  parts already present (left untouched): ${summary.skippedItems}`);
}

if (require.main === module) {
  main()
    .then(() => db.pool.end())
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { main, CATEGORIES, ITEMS };
