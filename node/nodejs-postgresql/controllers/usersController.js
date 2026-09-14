// const usersStorage = require("../db/usersStorage");
const db = require("../db/queries");

const usersListGet = async (req, res) => {
  // const users = usersStorage.getUsers();
  const { search } = req.query;
  const users = await db.getAllUsernames(search);
  console.log("Usernames:", users.map((user) => user.username).join(", "));
  res.render("index", { title: "User list", users, search: search || "" });
};

const usersCreateGet = (req, res) => {
  res.render("form", { title: "Create user" });
};

const usersCreatePost = async (req, res) => {
  const { username } = req.body;
  try {
    // usersStorage.addUser(username);
    await db.insertUsername(username);
    res.redirect("/");
  } catch (error) {
    res.status(400).render("form", {
      title: "Create user",
      error: error.message,
      username: username || "",
    });
  }
};

const usersDeleteGet = async (req, res) => {
  await db.deleteAllUsernames();
  res.redirect("/");
};

module.exports = { usersListGet, usersCreateGet, usersCreatePost, usersDeleteGet };