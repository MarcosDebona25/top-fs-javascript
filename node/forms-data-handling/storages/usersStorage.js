// This class lets us simulate interacting with a database.
class UsersStorage {
  constructor() {
    this.storage = {};
    this.id = 0;
  }

  addUser({ firstName, lastName, email, age, bio }) {
    const id = this.id;
    this.storage[id] = { id, firstName, lastName, email, age, bio };
    this.id++;
  }

  getUsers() {
    return Object.values(this.storage);
  }

  getUser(id) {
    return this.storage[id];
  }

  updateUser(id, { firstName, lastName, email, age, bio }) {
    this.storage[id] = { id, firstName, lastName, email, age, bio };
  }

  deleteUser(id) {
    delete this.storage[id];
  }
}
// Rather than exporting the class, we can export an instance of the class by instantiating it.
// This ensures only one instance of this class can exist, also known as the "singleton" pattern.
const usersStorage = new UsersStorage();

// Seed with sample users so the list and search are usable right away.
[
  { firstName: "Ann", lastName: "Lee", email: "ann.lee@example.com", age: 28, bio: "Frontend dev who loves accessible UI." },
  { firstName: "Marco", lastName: "Polo", email: "marco.polo@example.com", age: 35, bio: "Backend dev exploring Node and Express." },
  { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", age: 36, bio: "Pioneer spirit, writes clean algorithms." },
  { firstName: "Grace", lastName: "Hopper", email: "grace.hopper@example.com", age: 45, bio: "Compiler enthusiast and mentor." },
  { firstName: "Linus", lastName: "Torvalds", email: "linus@example.com", age: 55, bio: "" },
  { firstName: "Sofia", lastName: "Vera", email: "sofia.vera@example.com", age: 24, bio: "Design-minded fullstack dev." },
  { firstName: "Ken", lastName: "Thompson", email: "ken.t@example.com", age: 80, bio: "Unix veteran, keeps things simple." },
].forEach((user) => usersStorage.addUser(user));

module.exports = usersStorage;
