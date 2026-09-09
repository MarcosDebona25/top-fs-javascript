const { getAllMessages, getMessageById, addMessage } = require("../db");
const { NotFoundError, ValidationError } = require("../errors/AppError");

function formatDate(date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMessages(req, res) {
  const messages = getAllMessages().map((message) => ({
    ...message,
    formattedDate: formatDate(message.added),
  }));
  res.render("index", { title: "Mini Messageboard", messages });
}

function getNewMessageForm(req, res) {
  res.render("form", { title: "New Message" });
}

function createNewMessage(req, res) {
  const { messageText, messageUser } = req.body;

  if (!messageText || !messageText.trim()) {
    throw new ValidationError("Message text is required");
  }
  if (!messageUser || !messageUser.trim()) {
    throw new ValidationError("Author name is required");
  }

  addMessage({ text: messageText.trim(), user: messageUser.trim() });
  res.redirect("/");
}

function getMessageDetails(req, res) {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new ValidationError("Message id must be a number");
  }

  const message = getMessageById(id);
  if (!message) {
    throw new NotFoundError(`Message with id ${id} does not exist`);
  }

  res.render("message", {
    title: "Message Details",
    message: { ...message, formattedDate: formatDate(message.added) },
  });
}

module.exports = {
  getMessages,
  getNewMessageForm,
  createNewMessage,
  getMessageDetails,
};
