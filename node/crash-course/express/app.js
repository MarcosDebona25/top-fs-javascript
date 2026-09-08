const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

console.log(__dirname);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "crude_node", "views", "index.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "crude_node", "views", "about.html"));
});

// redirects
app.get("/about-us", (req, res) => {
  res.redirect("/about");
});

// el orden de app.use importa ya que se ejecuta en orden de arriba hacia abajo, por eso el 404 va al final
// 404 page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "..", "crude_node", "views", "404.html"));
});