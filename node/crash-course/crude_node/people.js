// Caso 1: retorna el archivo completo

// const people = ['Alice', 'Bob', 'Charlie'];
// console.log(people);

// Caso 2 y 3: retorna solo lo exportado
const people = ['Alice', 'Bob', 'Charlie'];
const ages = [25, 30, 35];

console.log(`Arreglo de personas: ${people}`);
console.log(`Arreglo de edades: ${ages}`);
// module.exports = people;
module.exports = {
    people: people,
    ages: ages
}