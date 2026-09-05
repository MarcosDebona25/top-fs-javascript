const http = require("http");
const fs = require("fs");
const _ = require("lodash");

const server = http.createServer((req, res) => {
    // console.log("Request made");
    // console.log(req.url, req.method);

    const greet = _.once(() => {
        console.log("Hello!"); // se ejecuta una vez por cada request 
    });

    // lodash
    const num = _.random(0, 20);
    console.log(num);

    greet();
    greet();

    // set header content type

    // res.setHeader("Content-Type", "text/plain");
    // res.write("Hello, this is a simple HTTP server!");
    // res.end();

    // res.setHeader("Content-Type", "text/html");
    // res.write("<p> Hello, this is a simple HTTP server!</p>");
    // res.end();


    // Caso usando views/index.html
    // res.setHeader("Content-Type", "text/html");
    // // Send an html file
    // fs.readFile("./views/index.html", (err, data) => {
    //     if (err) {
    //         console.log(err);
    //         res.statusCode = 500;
    //         res.end("Error reading the file");
    //     } else {
    //         res.statusCode = 200;
    //         res.end(data);
    //     }
    // });

    // Caso usando routes
    res.setHeader("Content-Type", "text/html");
    let path = "./views/";
    switch (req.url) {
        case "/":
            path += "index.html";
            res.statusCode = 200;
            break;
        case "/about":
            path += "about.html";
            res.statusCode = 200;
            break;
        case "/about-me":
            res.statusCode = 301;
            res.setHeader("Location", "/about"); // Redirect from /about-me to /about
            res.end();
            break;
        default:
            path += "404.html";
            res.statusCode = 404;
            break;
    }

    fs.readFile(path, (err, data) => {
        if (err) {
            console.log(err);
            res.statusCode = 500;
            res.end("Error reading the file");
        } else {
            res.statusCode = 200;
            res.end(data);
        }
    });
});

server.listen(3000, "localhost", () => {
    console.log("Server is listening on port 3000");
});