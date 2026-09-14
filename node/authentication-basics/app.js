require("dotenv").config();

const path = require("node:path");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const bcrypt = require("bcryptjs");

const pool = require("./db/pool");
const configurePassport = require("./config/passport");

const PgSession = require("connect-pg-simple")(session);

configurePassport(passport);

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PgSession({ pool }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(flash());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.errorMessages = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.flash("error", "Username and password are required.");
      return res.redirect("/sign-up");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);
    res.redirect("/");
  } catch (error) {
    if (error.code === "23505") {
      req.flash("error", "That username is already taken.");
      return res.redirect("/sign-up");
    }
    next(error);
  }
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
    failureFlash: true,
  })
);

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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`app listening on port ${port}!`));
