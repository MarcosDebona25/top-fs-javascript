const now = Date.now();
const HOUR = 3_600_000;
const DAY = 86_400_000;

const messages = [
  {
    id: 0,
    text: "Hi there!",
    user: "Amando",
    added: new Date(now - 4 * DAY - 2 * HOUR),
  },
  {
    id: 1,
    text: "Hello World!",
    user: "Charles",
    added: new Date(now - 4 * DAY),
  },
  {
    id: 2,
    text: "First day learning Express, this is fun!",
    user: "Marcos",
    added: new Date(now - 3 * DAY - 5 * HOUR),
  },
  {
    id: 3,
    text: "Anyone else struggling to understand middleware? I keep reading the docs and the order of execution still confuses me. Like, does next() always pass control to the very next middleware in the stack, or can it skip some?",
    user: "Sophia",
    added: new Date(now - 3 * DAY),
  },
  {
    id: 4,
    text: "Just deployed my first Node app to Render. Feels unreal 🚀",
    user: "Lucas",
    added: new Date(now - 2 * DAY - 8 * HOUR),
  },
  {
    id: 5,
    text: "Middleware is basically a pipeline — each function gets req, res, and next. Call next() to move forward, or send a response to stop the chain. Once it clicks, it clicks.",
    user: "Marcos",
    added: new Date(now - 2 * DAY - 3 * HOUR),
  },
  {
    id: 6,
    text: "EJS or Pug? Discuss.",
    user: "Nina",
    added: new Date(now - 2 * DAY),
  },
  {
    id: 7,
    text: "EJS all the way. It's just HTML with JS sprinkled in. Pug's indentation-based syntax looks clean but trips me up every time.",
    user: "Charles",
    added: new Date(now - DAY - 10 * HOUR),
  },
  {
    id: 8,
    text: "Does anyone have a good resource for learning about REST API design? I want to go beyond just CRUD.",
    user: "Amando",
    added: new Date(now - DAY - 4 * HOUR),
  },
  {
    id: 9,
    text: "Thanks @Marcos, that pipeline analogy actually helped a ton!",
    user: "Sophia",
    added: new Date(now - DAY),
  },
  {
    id: 10,
    text: "Pro tip: use morgan for request logging in dev. One line of setup and suddenly you can see exactly what's hitting your server.",
    user: "Lucas",
    added: new Date(now - 12 * HOUR),
  },
  {
    id: 11,
    text: "Building a mini blog engine as my next project. Wish me luck 🤞",
    user: "Nina",
    added: new Date(now - 6 * HOUR),
  },
  {
    id: 12,
    text: "Hot take: you don't need a framework to learn backend. Start with just the http module, build something ugly, then appreciate what Express gives you.",
    user: "Marcos",
    added: new Date(now - 2 * HOUR),
  },
  {
    id: 13,
    text: "Good luck @Nina! Share it here when it's done.",
    user: "Amando",
    added: new Date(now - HOUR),
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
