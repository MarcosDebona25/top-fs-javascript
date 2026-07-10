module.exports = {
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  testEnvironment: "node",
  moduleFileExtensions: ["js"],
  setupFiles: ["./jest.setup.js"],
};
