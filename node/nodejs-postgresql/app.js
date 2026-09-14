require("dotenv").config();
const express = require('express');
const app = express();
const path = require("node:path");
const usersRouter = require("./routes/usersRouter");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/", usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
    if (error) {
        console.error('Error starting server:', error);
        return;
    }
    console.log(`Server is running on port ${PORT}`);
});