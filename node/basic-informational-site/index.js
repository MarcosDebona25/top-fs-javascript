const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "text/html");
    let fileName;

    switch (req.url) {
        case "/":
            fileName = "index.html";
            res.statusCode = 200;
            break;
        case "/about":
            fileName = "about.html";
            res.statusCode = 200;
            break;
        case "/contact-me":
            fileName = "contact-me.html";
            res.statusCode = 200;
            break;
        default:
            fileName = "404.html";
            res.statusCode = 404;
            break;
    }

    fs.readFile(path.join(__dirname, fileName), (error, content) => {
        if (error) {
            res.statusCode = 500;
            res.end("Error loading the page");
            return;
        }
        res.end(content);
    });
});

server.listen(3000, "localhost", () => {
    console.log("Server is listening on port 3000");
    console.log("Server is running on http://localhost:3000");
})