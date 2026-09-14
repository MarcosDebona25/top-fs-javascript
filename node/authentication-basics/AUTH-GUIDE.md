# Authentication Reference Guide

Passport.js + bcrypt + express-session, explained from first principles, using this repo as the working example.

**What this app does:** a server-rendered Express app where users sign up, log in, stay logged in across requests *and server restarts*, and log out. Passwords are hashed with bcrypt, sessions live in PostgreSQL, and login is handled by Passport's local strategy.

**How to use this guide:** read it top to bottom once. After that, use the [Index](#index) to jump straight to whatever you need to review. Every section explains the *why*, not just the *how*.

Tested with: Node 24, Express 5.2, passport 0.7, passport-local 1.0, express-session 1.19, bcryptjs 3, connect-pg-simple 7, pg 8.

---

## Index

1. [The 30-second version](#the-30-second-version)
2. [Fundamentals](#fundamentals)
   - [HTTP is stateless](#http-is-stateless)
   - [Authentication vs authorization](#authentication-vs-authorization)
   - [Cookies and sessions](#cookies-and-sessions)
3. [Password storage with bcrypt](#password-storage-with-bcrypt)
   - [Hashing is not encryption](#hashing-is-not-encryption)
   - [Salts and rainbow tables](#salts-and-rainbow-tables)
   - [The cost factor](#the-cost-factor)
   - [Why bcrypt.compare and not hash and compare](#why-bcryptcompare-and-not-hash-and-compare)
   - [bcryptjs vs bcrypt vs argon2](#bcryptjs-vs-bcrypt-vs-argon2)
4. [Passport architecture](#passport-architecture)
   - [What Passport is and is not](#what-passport-is-and-is-not)
   - [Strategies](#strategies)
   - [The verify callback and done()](#the-verify-callback-and-done)
   - [serializeUser and deserializeUser](#serializeuser-and-deserializeuser)
   - [passport.session() vs passport.initialize()](#passportsession-vs-passportinitialize)
5. [express-session configuration](#express-session-configuration)
   - [The secret signs, it does not encrypt](#the-secret-signs-it-does-not-encrypt)
   - [Every option explained](#every-option-explained)
   - [Why not MemoryStore in production](#why-not-memorystore-in-production)
   - [Cookie flags](#cookie-flags)
6. [The app flow, step by step](#the-app-flow-step-by-step)
   - [Project structure](#project-structure)
   - [Middleware order matters](#middleware-order-matters)
   - [Sign-up flow](#sign-up-flow)
   - [Log-in flow](#log-in-flow)
   - [Log-out flow (and why it must be POST)](#log-out-flow-and-why-it-must-be-post)
   - [Every request after login](#every-request-after-login)
7. [Command cheatsheet](#command-cheatsheet)
8. [What changed from the original version and why](#what-changed-from-the-original-version-and-why)
9. [Security checklist: what is deliberately left out](#security-checklist-what-is-deliberately-left-out)
10. [Troubleshooting](#troubleshooting)
11. [References](#references)

---

## The 30-second version

1. **Sign up** — `bcrypt.hash(password, 10)` produces a salted hash; the app stores `username` + hash in the `users` table. The plaintext password is never stored anywhere.
2. **Log in** — `passport.authenticate("local", ...)` runs *your* verify callback: look the user up, `bcrypt.compare(plain, storedHash)`, and call `done(null, user)` on success.
3. **Session created** — Passport stores only `user.id` into the session; express-session persists the session as a row in PostgreSQL and sends the browser a signed `connect.sid` cookie.
4. **Every later request** — the browser sends the cookie automatically; express-session loads the session row, Passport's `deserializeUser(id)` fetches the full user, and `req.user` is available in every handler and template (`currentUser`).
5. **Log out** — a `POST` route calls `req.logout()`, destroys the session row in PostgreSQL, and clears the cookie. The credentials that once proved identity are gone.

Mental model to keep: **the browser never holds anything of value except an opaque ID; the server holds the truth.**

---

## Fundamentals

### HTTP is stateless

Every HTTP request is independent. The protocol has no built-in "who is this?" — a TCP connection being open says nothing about identity, and after a response, the server forgets the request ever happened. This is deliberate: statelessness is what lets web servers scale (any server can answer any request).

The consequence: the server must be able to *re-identify the user on every single request*. Something must travel with each request that says "it's me again". That something is a cookie.

### Authentication vs authorization

- **Authentication (authN):** *who are you?* Proving identity (username + password here).
- **Authorization (authZ):** *what are you allowed to do?* Checking permissions (admin routes, "edit your own posts").

This app implements authN only. Authorization would come later (roles, ownership checks). They are separate concerns: `req.user` existing = authenticated; what that user may do = authorization.

### Cookies and sessions

A cookie is a small key/value pair the server asks the browser to store and send back automatically with every matching request. There are two ways to use it to keep a user logged in:

| Design | Cookie holds | Server holds | Tradeoff |
|---|---|---|---|
| Client-side token | The user data itself (signed or encrypted) | Nothing | Survives server restarts trivially, scales statelessly — but bulky, and you **cannot revoke it** before expiry |
| **Server-side session (this app)** | Just an opaque session ID | The session data | Revocable at will (logout *destroys* it), small cookie, data never leaves the server — but requires a session store (PostgreSQL here) |

Why sessions are the standard choice for server-rendered apps like this one:

1. **Revocation is real.** "Log out" actually invalidates the session server-side. A client-side token can't be un-issued; you can only wait for it to expire or maintain a blacklist (which is... a server-side store again).
2. **Size.** The cookie only carries ~30 random bytes. User data, preferences, flash messages all live server-side.
3. **Secrecy by construction.** Nothing about the user is exposed to the browser — no encryption needed, because nothing sensitive travels.

The cost: the server needs somewhere durable and fast to keep sessions. That's exactly what `connect-pg-simple` provides (see [express-session configuration](#express-session-configuration)).

---

## Password storage with bcrypt

### Hashing is not encryption

| | Encryption | Hashing |
|---|---|---|
| Direction | Two-way (decrypt with a key) | One-way (no inverse exists) |
| Question it answers | "What was the original, given the key?" | "Does this input produce this hash?" |
| Passwords | Wrong tool — if you can recover it, so can an attacker who finds the key | Right tool |

A hash function maps any input to a fixed-size output with no feasible way back. That is why sites can't email you your forgotten password — they don't have it. Password *reset* flows exist precisely because hashes are irreversible.

### Salts and rainbow tables

If you hashed passwords with a plain function (like SHA-256), attackers could precompute enormous tables mapping common passwords to their hashes ("rainbow tables") and reverse every leaked hash at once. Hash the top 10 million passwords once, then look up every victim for free.

bcrypt defeats this with a **salt**: random data, generated fresh for every password, mixed into the hash computation. Same password, two different hashes — here is the actual output from this project:

```
$2b$10$DLV5yqDahPvP5bAtpwJuL.lOrP10MhdzfQYv6laCE29jtG/xwMCAe
$2b$10$RtQUUgRVDPtmgkuegqppuuTbMFn8SaKgkbrytQLwuMq6oRSDYKDX6
```

Both are the hash of the *same* password. Precomputation is now useless — every user would need their own table.

The hash string encodes everything, so there's nothing extra to store:

```
$2b $10 $RtQUUgRVDPtmgkuegqppuu TbMFn8SaKgkbrytQLwuMq6oRSDYKDX6
 ↑    ↑   └── 22-char salt ──┘ └──────── 31-char checksum ─────┘
 │    └── cost factor (2^10 iterations)
 └── bcrypt algorithm version
```

The salt lives *inside* the stored hash. This detail explains `compare()` below.

### The cost factor

bcrypt is slow **on purpose**. It runs its internal key setup `2^cost` times. Cost 10 = 1024 iterations; every +1 **doubles** the work. Measured on this machine with bcryptjs:

| Cost | Time per hash | Use case |
|---|---|---|
| 8 | ~29 ms | too fast — only for tests |
| **10** | ~118 ms | **this app; OWASP's minimum recommendation** |
| 12 | ~452 ms | production on fast hardware |
| 14 | ~1791 ms | high-security, patient users |

Why slowness is the feature: a legitimate user logs in once — 100 ms is invisible. An attacker with a stolen `users` table trying 100 million guesses pays 100 ms *per guess* on their own hardware. The cost factor turns a cheap bulk attack into an expensive one.

Why not crank it to 20? Because you'd DoS yourself: every login would take minutes of CPU. 10 is the standard floor; tune upward as hardware gets faster.

### Why bcrypt.compare and not hash and compare

Beginner instinct: `if (bcrypt.hash(input) === storedHash)`. This can **never work** — look at the two hashes above. The salt is random per hash, so even the correct password produces a different string each time. You cannot recompute the stored hash.

`compare()` is the only correct operation: it *parses the salt out of the stored hash*, re-hashes the candidate password with that exact salt, and checks the result. That's why its signature is `compare(candidatePlaintext, storedHash)` — it needs the full stored string, not just a digest.

```js
const match = await bcrypt.compare(password, user.password); // candidate, stored hash
```

### bcryptjs vs bcrypt vs argon2

| Library | Implementation | Speed | Notes |
|---|---|---|---|
| **bcryptjs** (this app) | Pure JavaScript | ~2x slower than native | Zero build tooling — works everywhere; identical API to `bcrypt` |
| `bcrypt` | Native C++ bindings | Fast | Requires compilation on install; occasional native-module friction |
| `argon2` | Native, modern algorithm | Fast, memory-*hard* | OWASP's current first recommendation; designed to resist GPUs/ASICs |

bcryptjs is fine for learning and small apps, and the API is identical, so swapping to `bcrypt` or `argon2` later is a one-line change per call site. What matters is the *pattern* (hash + salt + cost + compare), not the library.

---

## Passport architecture

### What Passport is and is not

Passport is a small authentication **middleware framework** with a huge ecosystem (500+ "strategies"). It is *not*:

- a user database — your `users` table is yours
- a session manager — that's express-session's job
- the owner of your password logic — you write that

You always provide three things: where users live, how to verify credentials, and what goes into the session. Passport handles the plumbing between them and the request/response cycle.

### Strategies

A strategy is a plugin that knows **how to receive credentials** from a request:

| Strategy | Extracts credentials from |
|---|---|
| `passport-local` | `req.body.username` / `req.body.password` (a plain HTML form POST) |
| Google / GitHub OAuth | The OAuth redirect dance, profile data from the provider |
| JWT | The `Authorization: Bearer ...` header |

This is why the HTML form's `name="username"` and `name="password"` attributes matter: passport-local reads *those exact fields* by default (configurable via `usernameField`/`passwordField`).

### The verify callback and done()

The verify callback is the part only you can write — Passport can't know your schema. Its contract with Passport is the `done` function, and the three outcomes are semantically different:

| Call | Meaning | What happens |
|---|---|---|
| `done(null, user)` | Credentials valid | Passport logs the user in: `serializeUser` → session → redirect |
| `done(null, false, { message })` | **Credentials wrong — a normal outcome, not an error** | `failureRedirect` + the message goes to `failureFlash` |
| `done(err)` | Infrastructure broke (DB down) | Forwarded to your error middleware → 500 |

The middle row is the one people get wrong. "Wrong password" is *expected behavior* — returning a 500 for it is a bug (and tells attackers your app is brittle). Only genuine failures go to `done(err)`.

Our implementation in `config/passport.js`:

```js
new LocalStrategy(async (username, password, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = rows[0];

    if (!user) return done(null, false, { message: "Incorrect username" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return done(null, false, { message: "Incorrect password" });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
})
```

Note the parameterized query (`$1`) — never interpolate user input into SQL.

### serializeUser and deserializeUser

```js
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  done(null, rows[0]);
});
```

- **serializeUser** — what goes *into* the session when login succeeds. Just `user.id`.
- **deserializeUser** — how to rebuild `req.user` from what's in the session, on every subsequent request.

Why store only the id instead of the whole user object?

1. **Bloat** — the whole object would be written to the session store on every change.
2. **Staleness** — if the user changes their username or role, a serialized snapshot keeps serving the old data until they log in again. With just the id, every request re-reads the *current* row.
3. **Minimal exposure** — the session store shouldn't hold more than necessary.

The cost is one `SELECT` per request (the deserialize). That's the standard tradeoff; if it ever becomes a problem, you cache — but you don't pre-optimize.

### passport.session() vs passport.initialize()

You will see both lines in older tutorials:

```js
app.use(passport.initialize());
app.use(passport.session());
```

With **passport 0.5.1+ (this project uses 0.7)**, `initialize()` is no longer required. Verified in passport's own source: the `authenticate` middleware — which `passport.session()` runs internally — attaches `req.login`, `req.logout`, `req.isAuthenticated` to the request itself. `initialize()` remains purely as a compatibility layer for third-party strategies that depend on passport 0.4.x or earlier.

Modern minimal setup:

```js
app.use(session({ ... }));      // must come first — passport needs req.session
app.use(passport.session());    // restores req.user from the session
```

Including `initialize()` anyway is harmless — but now you know why it's there when you see it.

---

## express-session configuration

```js
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PgSession({ pool }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === "production",
    },
  })
);
```

### The secret signs, it does not encrypt

The most common misconception in session auth. The cookie the browser receives looks like:

```
connect.sid=s%3AL5xX86nPLwLJjJKqzJUWq9uXI2SKbrYr.HMAC-SHA256-signature
```

That is: `s:` (signed marker), the session ID, and an **HMAC-SHA256 signature** of that ID made with your `SESSION_SECRET`. The secret's only job is **tamper detection**: if anyone changes one character of the session ID, the signature no longer matches and express-session discards the cookie and starts a fresh session.

What the secret does **not** do:

- it does not encrypt anything (nothing needs encrypting — the ID is just random bytes)
- knowing the secret does not log you in (the forged ID must still exist as a row in the `session` table)

Why it must still be long, random, and in `.env`: a brute-forceable secret like `"cats"` lets an attacker forge *validly signed* cookies — including ones pointing at a session ID they obtained. Generate one with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### Every option explained

| Option | Value here | Why |
|---|---|---|
| `secret` | from `.env` | Signs the session ID (see above). Committed secrets can't be rotated and are guessable. |
| `resave` | `false` | Don't rewrite the session to the store if nothing changed. Avoids DB write storms and race conditions between parallel requests. |
| `saveUninitialized` | `false` | Don't create a session (row + cookie) for anonymous visitors. Without this, every bot hitting `/` inserts a garbage row. |
| `store` | `PgSession({ pool })` | Sessions in PostgreSQL instead of in-memory (next section). |
| `cookie.maxAge` | 24 h | Session lifetime. The store's `expire` column is set to match; activity extends it (sliding expiration via `touch()`). |
| `cookie.httpOnly` | `true` | JavaScript cannot read the cookie (`document.cookie` is blind to it) → an XSS bug cannot steal the session. |
| `cookie.sameSite` | `"lax"` | The browser won't send the cookie on cross-site POSTs → kills most CSRF (see [log-out flow](#log-out-flow-and-why-it-must-be-post)). |
| `cookie.secure` | prod only | Send the cookie over HTTPS only. `false` locally so plain HTTP works in dev. |

### Why not MemoryStore in production

express-session's default store is in-memory. Its own README warns: it **leaks memory under most conditions, does not scale past a single process, and is meant for debugging/developing only**. Concretely:

- every login grows RAM that is only freed at expiry
- restart the server → **everyone is logged out** (sessions evaporate)
- run two instances behind a load balancer → you're logged in on one and anonymous on the other

`connect-pg-simple` replaces it with a `session` table (DDL in `db/schema.sql`): `sid`, `sess` (JSON), `expire`. Sessions survive restarts and are shared by any number of app instances — the restart test in the [cheatsheet](#command-cheatsheet) proves it. Expired rows are pruned automatically at a configurable interval (`pruneSessionInterval`).

### Cookie flags

| Flag | Blocks |
|---|---|
| `httpOnly` | XSS stealing the session cookie via `document.cookie` |
| `secure` | The cookie crossing plain HTTP (network sniffing) |
| `sameSite=lax` | Cross-site POST requests carrying the cookie (most CSRF) |

Flags are defense in depth: they don't fix XSS or CSRF root causes, they remove the session cookie from the blast radius.

---

## The app flow, step by step

### Project structure

```
authentication-basics/
├── app.js               # wiring: middleware order, routes, error handler
├── config/
│   └── passport.js      # LocalStrategy + serialize/deserialize
├── db/
│   ├── pool.js          # shared pg Pool from DATABASE_URL
│   └── schema.sql       # users + session tables (idempotent)
├── views/
│   ├── index.ejs        # login form / welcome + logout (POST)
│   └── sign-up-form.ejs # signup form + error messages
├── .env                 # real secrets (gitignored)
├── .env.example         # template to copy
└── package.json
```

### Middleware order matters

```js
require("dotenv").config();        // 0. FIRST — db/pool.js reads DATABASE_URL when required
...
app.use(express.urlencoded(...)); // 1. parse POST bodies (before anything needs req.body)
app.use(session({ ... }));        // 2. creates req.session (before flash and passport)
app.use(flash());                 // 3. flash messages live IN the session
app.use(passport.session());      // 4. restores req.user from the session
app.use((req, res, next) => {     // 5. AFTER passport, so req.user is already set
  res.locals.currentUser = req.user;
  res.locals.errorMessages = req.flash("error");
  next();
});
```

Middleware runs in registration order for every request. Two rules worth memorizing:

- `require("dotenv").config()` must run **before** any module that reads `process.env` at load time (`db/pool.js` does).
- anything that reads `req.user` must sit **after** `passport.session()`.

### Sign-up flow

```js
app.post("/sign-up", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash("error", "Username and password are required.");
      return res.redirect("/sign-up");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashedPassword]);
    res.redirect("/");
  } catch (error) {
    if (error.code === "23505") {                    // Postgres unique_violation
      req.flash("error", "That username is already taken.");
      return res.redirect("/sign-up");
    }
    next(error);
  }
});
```

- `bcrypt.hash(password, 10)` — generate random salt, hash with cost 10, return the combined string (salt lives inside it — [see why](#salts-and-rainbow-tables)).
- `23505` is PostgreSQL's error code for unique-constraint violation — the `username UNIQUE` in the schema. Caught specifically because it's a *user* problem (show a message), not a *server* problem (500).
- Express 5 bonus: rejected promises in `async` handlers are forwarded to the error middleware automatically — but the `try/catch` stays, because only it can intercept `23505` to show the friendly message.

### Log-in flow

```js
app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash: true,
  })
);
```

There is no visible handler body — the `authenticate` middleware *is* the route logic. On failure it redirects and never reaches a handler. The full sequence:

```
Browser                     Express                        PostgreSQL
   |                          |                               |
   | POST /log-in             |                               |
   | (form-encoded body)      |                               |
   |------------------------->| urlencoded parses req.body    |
   |                          | passport.authenticate("local")|
   |                          | LocalStrategy runs YOUR code: |
   |                          |  SELECT * FROM users -------->|
   |                          |<--------- user row -----------|
   |                          |  bcrypt.compare()             |
   |                          |  done(null, user)             |
   |                          |  serializeUser -> user.id     |
   |                          |  session saved ---------------> session row
   |<-------------------------| 302 + Set-Cookie: connect.sid |
   |                          |  (signed with SESSION_SECRET) |
```

- `failureFlash: true` takes the `{ message }` from `done(null, false, { message })` and stores it in the flash under the `"error"` category.
- Our locals middleware (`req.flash("error")`) picks it up on the *next* request and the view prints it. That redirect → flash → display pattern is why failed logins show "Incorrect password" on the form page.
- Flash survives the redirect because it lives **inside the session**, not in the request.

### Log-out flow (and why it must be POST)

```js
app.post("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});
```

Three steps, three reasons:

1. **`req.logout(cb)`** — passport 0.6+ *requires* the callback (older tutorials' bare `req.logout(); res.redirect();` throws). It removes the user from the session.
2. **`req.session.destroy()`** — deletes the row from the `session` table. Without this, logout only empties the session and the row sits in PostgreSQL until expiry. One login per visit would litter the table.
3. **`res.clearCookie("connect.sid")`** — `destroy()` doesn't touch the browser; the cookie must be explicitly removed or the browser keeps sending a dead ID.

Why POST and not a `GET /log-out` link:

- **HTTP semantics:** GET must be safe (no state changes). A GET that logs you out violates that.
- **CSRF:** with GET, any page you visit can log you out via `<img src="https://yoursite/log-out">`. Prefetching browsers and link-preview bots trigger GETs on their own — users get mysteriously logged out.
- Paired with `sameSite: "lax"` (cookie not sent on cross-site POSTs), the form-POST logout is the modern minimum.

### Every request after login

```
Browser                     Express                        PostgreSQL
   |                          |                               |
   | GET / (cookie sent       |                               |
   | automatically)           |                               |
   |------------------------->| express-session: verify HMAC  |
   |                          | SELECT session BY sid ------->|
   |                          |<------- session row (user.id)-|
   |                          | deserializeUser(id):          |
   |                          |  SELECT * FROM users -------->|
   |                          |<------- user row -------------|
   |                          | req.user = row                |
   |                          | locals: currentUser = req.user|
   |<-------------------------| rendered "Welcome back"       |
```

One session lookup + one user lookup per request. That is the entire price of "stay logged in".

---

## Command cheatsheet

### Install and set up (once)

```bash
npm install express ejs express-session connect-pg-simple connect-flash \
            passport passport-local pg bcryptjs dotenv

cp .env.example .env
# then edit .env: DATABASE_URL + SESSION_SECRET, generated with:
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

# create tables (idempotent — safe to re-run)
psql "postgresql://user:password@localhost:5432/dbname" -f db/schema.sql
```

### Run

```bash
npm run dev     # node --watch app.js — auto-restarts on changes (Node 18.11+)
npm start       # plain node app.js
```

### Exercise the whole flow with curl

```bash
cd /tmp && rm -f cookies.txt

# home page (anonymous)
curl -s http://localhost:3000/ | grep -o "<h1>[^<]*</h1>"

# sign up
curl -si -X POST http://localhost:3000/sign-up \
     -d "username=alice&password=secret123" | grep -E "^HTTP|^Location"

# failed login -> flash error appears on the NEXT request
curl -si -X POST http://localhost:3000/log-in \
     -d "username=alice&password=WRONG" -c cookies.txt | grep -E "^HTTP|^Location"
curl -s http://localhost:3000/ -b cookies.txt | grep -o "<p>[^<]*</p>"   # "Incorrect password"

# successful login (cookie jar gets connect.sid)
rm -f cookies.txt
curl -si -X POST http://localhost:3000/log-in \
     -d "username=alice&password=secret123" -c cookies.txt | grep -E "^HTTP|^Location"

# authenticated home
curl -s http://localhost:3000/ -b cookies.txt | grep -o "Welcome back[^<]*"

# restart the server, then re-run the line above: STILL logged in
# (this is the proof that sessions live in PostgreSQL, not RAM)

# log out (POST) -> old cookie becomes anonymous
curl -si -X POST http://localhost:3000/log-out -b cookies.txt | grep -E "^HTTP|^Location"
curl -s http://localhost:3000/ -b cookies.txt | grep -o "<h1>[^<]*</h1>"
```

### Inspect the database

```bash
psql "postgresql://user:password@localhost:5432/dbname" \
  -c "SELECT id, username FROM users;" \
  -c "SELECT sid, expire FROM session;" \
  -c "SELECT username, password FROM users WHERE username = 'alice';"  # see the bcrypt hash
```

---

## What changed from the original version and why

| Area | Before | After | Why |
|---|---|---|---|
| DB credentials | Hardcoded `new Pool({ host, user, password... })` | `.env` `DATABASE_URL`, loaded by `dotenv` | Secrets in source control are leaked secrets (git history keeps them forever) |
| Session secret | `"cats"` | Random 64-hex-char `SESSION_SECRET` in `.env` | Guessable secret = forgeable signed cookies |
| Session store | Default in-memory | `connect-pg-simple` table in PostgreSQL | MemoryStore leaks, dies on restart, single-process only |
| Logout | `GET /log-out` link | `POST /log-out` form | GET must never change state; GET logout is CSRF-able and prefetchable |
| Login failures | `failureMessage: true`, but nothing displayed it | `connect-flash` + `failureFlash: true` + views printing errors | Users need feedback; silent failure looks broken |
| Session cleanup | Logout only emptied the session | `req.session.destroy()` + `clearCookie` | Orphan rows accumulated in the store otherwise |
| Errors | `console.error` only | Central error-handling middleware | Uniform 500s; Express 5 also auto-forwards async rejections |
| Debug noise | `console.log(req.user)` on every request | Removed | Performance noise, leaks user data to logs |
| Reproducibility | Table existed only on the dev machine | `db/schema.sql` committed | Anyone (including future you) can rebuild from zero |
| Scripts | none | `npm run dev` (`node --watch`), `npm start` | Node's built-in watcher; no nodemon needed |
| File layout | Everything in `app.js` | `db/pool.js`, `config/passport.js`, slim `app.js` | Each concern testable and reusable; app.js reads as wiring |

---

## Security checklist: what is deliberately left out

This app is a learning tool. It is *not* production-ready — these are the gaps, why they matter, and the standard tool for each:

| Missing | Why it matters | Typical tool |
|---|---|---|
| CSRF tokens | `sameSite: "lax"` blocks cross-site POSTs, but top-level navigations still carry the cookie; token-based defense is complete | `csrf-csrf` |
| Rate limiting | bcrypt's slowness does nothing against an attacker making 10,000 *online* guesses/minute at your login route | `express-rate-limit` on `/log-in` and `/sign-up` |
| HTTPS enforcement | `secure: true` only helps if you actually serve HTTPS; plaintext HTTP exposes cookies and credentials | TLS terminator + `express-enforces-secure` |
| Security headers | CSP, nosniff, frame-deny — cheap hardening against XSS escalation and clickjacking | `helmet` |
| Session fixation defense | The session ID issued *before* login survives login; regenerating it on auth closes the window | `req.session.regenerate()` inside login |
| Password policy | Nothing stops `password` as a password; breached-password checks catch the worst ones | `zxcvbn` scoring, HaveIBeenPwned API |
| Email verification | Anyone can claim any username; no account recovery path exists | token-in-email flow |

None of these are needed to *understand* authentication — which is why they're out of scope here, but they're the reading list for "now make it real".

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `relation "users" does not exist` | Schema not applied to your database | `psql "$DATABASE_URL" -f db/schema.sql` |
| `Login sessions require session support...` | `express-session` missing or mounted after passport | Session middleware must come before `passport.session()` |
| Login always fails, no error message | Form inputs missing `name="username"` / `name="password"` (passport-local reads those exact fields), or `express.urlencoded` not mounted | Check the form and middleware order |
| `req.logout is not a function` | passport 0.6+ changed the API | Always `req.logout((err) => { ... })` with callback |
| Sessions lost on server restart | Store left at default MemoryStore | Configure `connect-pg-simple` (this repo already does) |
| `error: no pg_hba.conf entry` / `ECONNREFUSED 5432` | Postgres not running or `DATABASE_URL` wrong | Check the service and the connection string |
| `EADDRINUSE :3000` | Another instance still running | `pkill -f "node app.js"` |
| Signup does nothing but no error | Unique-violation path not handled | Catch `error.code === "23505"` and flash (this repo does) |

---

## References

- [express-session — GitHub README](https://github.com/expressjs/session) (options, MemoryStore warning)
- [Passport — official docs](https://www.passportjs.org/docs/) (configure, strategies, concepts)
- [passport-local — GitHub](https://github.com/jaredhanson/passport-local) (usernameField/passwordField options)
- [bcryptjs — npm](https://www.npmjs.com/package/bcryptjs) (hash/compare API)
- [OWASP — Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) (cost factors, argon2 recommendation)
- [OWASP — Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) (cookie flags, fixation, timeouts)
- [The Odin Project — Authentication Basics](https://www.theodinproject.com/lessons/nodejs-authentication-basics) (the lesson this project came from)
