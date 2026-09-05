const http = require("http");

const server = http.createServer((req, res) => {
    console.log("Request made");
    res.end("Hello");
});

server.listen(3000, "localhost", () => {
    console.log("Server is listening on port 3000");
});