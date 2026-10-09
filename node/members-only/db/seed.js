'use strict';

// Loads demo users and messages (idempotent: re-running adds nothing twice).
// Every seeded account uses the password below; do not run against production.
require('dotenv').config();

const bcrypt = require('bcryptjs');
const pool = require('./pool');

const PASSWORD = 'Seed1234';

const USERS = [
  { firstName: 'Ada', lastName: 'Admin', email: 'admin@seed.test', isMember: true, isAdmin: true },
  { firstName: 'Marta', lastName: 'Miembro', email: 'member@seed.test', isMember: true, isAdmin: false },
  { firstName: 'Nico', lastName: 'Nuevo', email: 'user@seed.test', isMember: false, isAdmin: false },
];

// hoursAgo spreads the timestamps so the feed order and dates look real.
const MESSAGES = [
  { author: 'admin@seed.test', hoursAgo: 72, title: 'Bienvenidos al club', text: 'Este es un espacio donde todos pueden leer, pero solo los miembros saben quién escribe. Pórtense bien.' },
  { author: 'member@seed.test', hoursAgo: 60, title: 'Primera regla del club', text: 'No se habla de quién escribió qué fuera del club. Los autores son un secreto compartido.' },
  { author: 'user@seed.test', hoursAgo: 48, title: '¿Cómo me hago miembro?', text: 'Acabo de registrarme y solo veo los textos. ¿Alguien me pasa el código para unirme?' },
  { author: 'member@seed.test', hoursAgo: 30, title: 'Receta de mate perfecto', text: 'Agua a 75 °C, yerba bien acomodada y paciencia. Nunca hierva el agua.' },
  { author: 'admin@seed.test', hoursAgo: 24, title: 'Recordatorio de moderación', text: 'Los mensajes ofensivos se eliminan sin aviso. Si ves alguno, avisá a un admin.' },
  { author: 'user@seed.test', hoursAgo: 6, title: 'Gracias por la bienvenida', text: 'Muy lindo club. Espero poder ver pronto quién está detrás de cada mensaje.' },
  { author: 'member@seed.test', hoursAgo: 1, title: 'Idea para el club', text: '¿Y si organizamos una lectura colectiva el viernes? Propongan libros en los comentarios.' },
];

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  const ids = new Map();
  let newUsers = 0;
  let newMessages = 0;

  for (const u of USERS) {
    const { rows } = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, is_member, is_admin)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [u.firstName, u.lastName, u.email, hash, u.isMember, u.isAdmin]
    );
    if (rows.length) newUsers += 1;
    const found = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    ids.set(u.email, found.rows[0].id);
  }

  for (const m of MESSAGES) {
    const userId = ids.get(m.author);
    const { rowCount } = await pool.query(
      `INSERT INTO messages (title, text, user_id, created_at)
       SELECT $1::text, $2::text, $3::int, now() - make_interval(hours => $4::int)
       WHERE NOT EXISTS (SELECT 1 FROM messages WHERE title = $1::text AND user_id = $3::int)`,
      [m.title, m.text, userId, m.hoursAgo]
    );
    newMessages += rowCount;
  }

  console.log(`Seed done: ${newUsers} users, ${newMessages} messages added.`);
  console.log(`Accounts (password "${PASSWORD}"): ${USERS.map((u) => u.email).join(', ')}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
