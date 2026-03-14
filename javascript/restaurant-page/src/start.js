function starting() {
    const h1 = document.createElement("h1");
    h1.textContent = "Luigi's Parrilla";

    const p = document.createElement("p");
    p.textContent = "La tradición del asado argentino desde 1985. Cortes premium, brasas vivas y el sabor inigualable de nuestra tierra.";

    return [h1, p];
}

export { starting };