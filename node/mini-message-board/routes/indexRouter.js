const { Router } = require("express");
const messageController = require("../controllers/messageController");

const indexRouter = Router();

indexRouter.get("/", messageController.getMessages);
indexRouter.get("/new", messageController.getNewMessageForm);
indexRouter.post("/new", messageController.createNewMessage);
indexRouter.get("/message/:id", messageController.getMessageDetails);

module.exports = indexRouter;
