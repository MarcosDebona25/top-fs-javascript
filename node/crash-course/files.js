const fs = require('fs');

// reading files
fs.readFile("./docs/hola.txt", (err, data) => {
    if (err) {
        console.log(err);
    }
    console.log(data);
    console.log(data.toString());
});

// Se puede ver que JS no es bloqueante, por eso, se ejecuta primero esta linea en vez de esperar la lectura del archivo
console.log("last line of code");

// writing files
fs.writeFile("./docs/adios.txt", "Hola, si esto funciona solo me queda por decir 'Chau'", () => {
    console.log("Archivo escrito correctamente");
});

// directories
if (!fs.existsSync("./assets")) {
    fs.mkdir("./assets", (err) => {
        if (err) {
            console.log(err);
        }
        console.log("Carpeta creada correctamente");
    });
} else console.log("La carpeta ya existe, no se pudo crear");

// deleting files
if (fs.existsSync("./docs/deleteme.txt")) {
    fs.unlink("./docs/deleteme.txt", (err) => {
        if (err) {
            console.log(err);
        }
        console.log("Archivo eliminado correctamente");
    });
} else console.log("El archivo no existe, no se pudo eliminar");
