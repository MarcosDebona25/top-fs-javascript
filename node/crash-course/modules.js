// Caso 1: recibe el archivo completo
// const x = require("./people");
// console.log(x);

// Caso 2: recibe solamente el arreglo people
// const x = require("./people");
// console.log(x);

// Caso 3: destructuración del objeto importado
const { people, ages } = require("./people");
console.log(people);
console.log(ages);