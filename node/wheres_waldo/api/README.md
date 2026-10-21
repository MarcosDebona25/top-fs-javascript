# Where's Waldo — API

REST API for the game: Express 5, express-validator, Prisma 7 and PostgreSQL. Players can play as guests or
create an account; accounts get their best time per map on the leaderboards. Every time is measured and
computed by the server.

## Setup

```bash
# 1. Role and database, once (psql)
sudo -u postgres psql -c "CREATE ROLE wheres_waldo LOGIN PASSWORD 'wheres_waldo' CREATEDB"
sudo -u postgres psql -c "CREATE DATABASE wheres_waldo OWNER wheres_waldo"

# 2. Environment: copy and edit .env (generate SESSION_SECRET as the file explains)
cp .env.example .env

# 3. Tables and data
npx prisma migrate deploy
npm run seed
```

`npm run dev` starts PostgreSQL (`sudo service postgresql start`), runs the API with `node --watch` and stops
PostgreSQL on exit. For plain `http://localhost` development set `COOKIE_SECURE=false`, otherwise the browser
never stores the session cookie.

### Hitboxes are placeholders until calibrated

`prisma/data/hitboxes.json` holds one rectangle per character per map. **The values in the repository are
placeholders** (`"calibrated": false`), tiled along the top-left corner of every image; they are not the real
positions. Replace them with the output of the calibration tool, set `calibrated` to `true` and run
`npm run seed` again. `GET /api/maps` reports `calibrated: false` for any map that still has placeholders, and
the seed prints a warning.

Rectangles are fractions of the image (0 to 1): `x`/`y` is the top-left corner, so they hold at any screen size.
They never leave the server.

## Tests

```bash
npm test
```

Jest + Supertest, run serially against a separate database (`DATABASE_URL` with `_test` appended, or
`TEST_DATABASE_URL`). `scripts/test-db.js` creates it if missing, applies the migrations and seeds it; the tests
then overwrite the hitboxes with known rectangles. The app is built by `createApp({ now, config })`, so the
tests drive the clock by hand and change the game rules (penalty, minimum time, rate limits) per test.

## Rules of the game

- A game starts when the client calls `POST /api/maps/:slug/games`; the server stores `startedAt`.
- A click is `{ character, x, y }` in image fractions. It is correct when it falls inside that character's
  rectangle grown by `HIT_MARGIN` on every side. Each wrong click adds `WRONG_GUESS_PENALTY_MS`.
- When the fifth character is found the server closes the game: `durationMs` = real elapsed time + penalties.
  The client never sends a time.
- If the real elapsed time (without penalties) is under `MIN_GAME_MS` the game is `rejected`: kept, never ranked.
- Guests (no session) get their time back but nothing is recorded in the leaderboards. A guest's game is played
  with its unguessable id; a registered player's game only from their own session.
- Leaderboards use each player's best completed game per map. The global ranking orders players by how many
  maps they finished (more first), then by total time, then by who completed their set first.

## Endpoints

All bodies are JSON. Errors are `{ "error": "...", "code"?: "...", "errors"?: { "<field>": "..." } }`;
validation failures are `422` with one message per field.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` | `{ username, password, confirmPassword }` → `201 { user }` and a session cookie. `409` if the name is taken (any case) |
| POST | `/api/auth/login` | `{ username, password }` → `200 { user }`. `401` is the same for an unknown user and a wrong password |
| POST | `/api/auth/logout` | `204`, always |
| GET | `/api/auth/me` | `200 { user }`, `user` is `null` for a guest |
| GET | `/api/auth/username-available?username=` | `200 { username, available, errors? }`; `422` if the format is invalid |
| GET | `/api/maps` | `{ maps: [{ slug, name, imageWidth, imageHeight, calibrated, characters: [{ slug, name }], bestTimeMs }] }` |
| POST | `/api/maps/:slug/games` | `201 { game }` |
| GET | `/api/games/:id` | `{ game }`; includes `result` once the game is over |
| POST | `/api/games/:id/guesses` | `{ character, x, y }` → `{ correct, alreadyFound?, completed, character, found, wrongCount, penaltyMs, result? }` |
| GET | `/api/leaderboards/summary` | Landing data: `{ mapCount, global: { rows, total }, maps: [{ slug, name, rows, total }] }` (top 10 each) |
| GET | `/api/leaderboards/global?page=&pageSize=` | `{ rows, page, pageSize, total, totalPages }` |
| GET | `/api/leaderboards/maps/:slug?page=&pageSize=` | Same, plus `map: { slug, name }` |
| GET | `/api/leaderboards/stream` | Server-Sent Events; `event: leaderboard` when a ranked game completes |

Registration and login share a limit of 10 attempts per IP every 15 minutes; guesses are limited per game and
IP; starting games is limited per IP. Sessions live in the `session` table for 7 days
(`SESSION_MAX_AGE_DAYS`), in an HttpOnly, `SameSite=Lax` cookie named `waldo.sid`.
