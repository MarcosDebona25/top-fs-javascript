const usersStorage = (() => {
  const storage = [
    { id: 1, username: "john_doe" },
    { id: 2, username: "jane_smith" },
  ];

  const getUsers = () => storage.map((user) => ({ ...user }));

  const getUser = (id) => storage.find((user) => user.id === id);

  const addUser = (username) => {
    const cleanName = String(username || "").trim();
    if (!cleanName) {
      throw new Error("Username is required");
    }
    const id = storage.length > 0 ? storage[storage.length - 1].id + 1 : 1;
    storage.push({ id, username: cleanName });
  };

  return { getUsers, getUser, addUser };
})();

module.exports = usersStorage;
