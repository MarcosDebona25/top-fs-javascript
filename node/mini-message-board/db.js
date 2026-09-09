const messages = [
  {
    id: 0,
    text: "Hi there!",
    user: "Amando",
    added: new Date(),
  },
  {
    id: 1,
    text: "Hello World!",
    user: "Charles",
    added: new Date(),
  },
  {
    id: 2,
    text: "First day learning Express, this is fun!",
    user: "Marcos",
    added: new Date(),
  },
  {
    id: 3,
    text: "Anyone else struggling to understand middleware?",
    user: "Sophia",
    added: new Date(),
  },
];

function getAllMessages() {
  return messages;
}

function getMessageById(id) {
  return messages.find((message) => message.id === id);
}

function addMessage({ text, user }) {
  const newMessage = {
    id: messages.length > 0 ? messages[messages.length - 1].id + 1 : 0,
    text,
    user,
    added: new Date(),
  };
  messages.push(newMessage);
  return newMessage;
}

module.exports = { getAllMessages, getMessageById, addMessage };
