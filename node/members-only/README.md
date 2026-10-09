# Members Only

Clubhouse where anyone can read posts, but only members see author and date;
admins can also delete posts. Express 5 + EJS + Passport (local) + bcrypt + PostgreSQL.

## Setup

```bash
npm install
cp .env.example .env            # set SESSION_SECRET and the two passcodes
# local cluster (no sudo): see .env.example for the URLs (port 5434)
/usr/lib/postgresql/16/bin/initdb -D .local/postgres -U postgres --auth=trust
# add `port = 5434` to .local/postgres/postgresql.conf, then:
/usr/lib/postgresql/16/bin/pg_ctl -D .local/postgres -l .local/postgres/server.log -w start
createdb -h 127.0.0.1 -p 5434 -U postgres members_only
createdb -h 127.0.0.1 -p 5434 -U postgres members_only_test
pg_ctl -D .local/postgres -m fast stop   # (optional) dev manages the cluster itself
npm run db:init                 # needs the cluster running; applies db/schema.sql
npm run dev                     # starts PostgreSQL + app; Ctrl+C stops both
```

## Roles

| Role | How | Sees |
|---|---|---|
| Guest | — | titles + text only |
| User | sign up + log in | same as guest, can post |
| Member | `/join-club` + `MEMBER_PASSCODE` | author + date |
| Admin | `/become-admin` + `ADMIN_PASSCODE` | everything + delete |

## Validation

Rules live once in `shared/rules.js`; the browser (`public/js/validate.js`,
live inline feedback) and the server (`validators/index.js`) both use them.
Password: 8+ chars, 1 uppercase, 1 number.

## Tests

```bash
npm run test:unit   # rules + middleware, no DB
npm test            # unit + integration (supertest, members_only_test)
npx playwright install chromium   # once
npm run test:e2e    # real browser against the test DB
```
