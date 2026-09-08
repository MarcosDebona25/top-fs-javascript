const express = require("express");
const morgan = require("morgan");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// sirve archivos estaticos (css, imagenes...) desde /public
app.use(express.static(path.join(__dirname, "public")));

// res.locals es lo que res.render mezcla con las variables que le pases
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

const siteData = {
  navLinks: [
    { href: "/", label: "Inicio" },
    { href: "/about", label: "Acerca de" },
    { href: "/contact", label: "Contacto" },
  ],
  socials: [
    { href: "https://github.com/MarcosDebona25", label: "GitHub" },
    { href: "https://www.theodinproject.com", label: "The Odin Project" },
  ],
};

const blogs = [
  {
    title: "Partials en EJS",
    snippet: "Trozos de HTML reutilizables: head, nav y footer en un solo lugar.",
    author: "MarkINC",
    date: "2026-09-01",
  },
  {
    title: "Middlewares en Express",
    snippet: "Funciones que se ejecutan en orden, entre la peticion y la respuesta.",
    author: "MarkINC",
    date: "2026-09-05",
  },
  {
    title: "rutas y 404",
    snippet: "El ultimo middleware con app.use() captura todo lo que no matcheo.",
    author: "MarkINC",
    date: "2026-09-08",
  },
];

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log("http://localhost:" + port);
});

// app.use((req, res, next) => {
//   console.log("Request received at " + new Date().toLocaleString());
//   console.log("New request: " + req.method + " " + req.path);
//   console.log("Query params: ", req.query);
//   console.log("Request body: ", req.body);
//   next();
// });

app.use(morgan("dev")); // log requests to the console

app.get("/", (req, res) => {
  res.render("index", { title: "Home", ...siteData, blogs });
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About", ...siteData });
});

app.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact", ...siteData });
});

// redirects
app.get("/about-us", (req, res) => {
  res.redirect("/about");
});

// el orden importa porque el comportamiento es secuencial, si no encuentra la ruta que se le pasa, entonces ejecuta el siguiente middleware, llegando por ultimo a este middleware
app.use((req, res) => {
  res.status(404).render("404", { title: "404", ...siteData });
});