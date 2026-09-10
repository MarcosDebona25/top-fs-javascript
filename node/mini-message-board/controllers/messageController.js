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

const USERNAME_MAX = 32;
const MESSAGE_MAX = 512;
const USERNAME_RE = /^[\p{L}\p{N} ]+$/u;

function getNewMessageForm(req, res) {
  res.render("form", { title: "New Message", errors: [], old: {} });
}

function createNewMessage(req, res) {
  const rawUser = req.body.messageUser || "";
  const rawText = req.body.messageText || "";
  const user = rawUser.trim();
  const text = rawText.trim();
  const errors = [];

  if (!user) {
    errors.push("Author name is required.");
  } else if (user.length > USERNAME_MAX) {
    errors.push(`Author name must be ${USERNAME_MAX} characters or fewer.`);
  } else if (!USERNAME_RE.test(user)) {
    errors.push("Author name must contain only letters, numbers, and spaces.");
  }

  if (!text) {
    errors.push("Message text is required.");
  } else if (text.length > MESSAGE_MAX) {
    errors.push(`Message must be ${MESSAGE_MAX} characters or fewer.`);
  }

  if (errors.length > 0) {
    return res.status(400).render("form", {
      title: "New Message",
      errors,
      old: { user: rawUser, text: rawText },
    });
  }

  addMessage({ text, user });
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
