// Caso 1

// console.log(global);

// global.setTimeout(() => {
//     console.log('This will run after 2 seconds');
// }, 2000);

// Caso 2

// setTimeout(() => {
//     console.log('In the timeout');
//     clearInterval(int);
// }, 5000);

// const int = setInterval(() => {
//     console.log("In the interval");
// }, 1000);

// Caso 3

console.log(__dirname);
console.log(__filename);

const os = require('os');
console.log(os.platform(), os.homedir());