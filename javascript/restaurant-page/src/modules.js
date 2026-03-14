function home() {
    const section = document.createElement("section");
    section.classList.add("home");

    const welcome = document.createElement("h2");
    welcome.textContent = "Bienvenidos a la mejor parrilla de Santa Fe";

    const subtext = document.createElement("p");
    subtext.textContent = "Desde 1985 traemos a tu mesa los mejores cortes a las brasas, con la tradición y el sabor de siempre.";

    const highlights = document.createElement("ul");
    const items = ["Asado al palo", "Ojo de bife jugoso", "Choripanes", "Entraña", "Vacío a la parrilla", "Milanesas napolitanas"];
    items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        highlights.appendChild(li);
    });

    section.appendChild(welcome);
    section.appendChild(subtext);
    section.appendChild(highlights);
    return section;
}

function menu() {
    const section = document.createElement("section");
    section.classList.add("menu");

    const title = document.createElement("h2");
    title.textContent = "Nuestra Carta";
    section.appendChild(title);

    const dishes = [
        { name: "Asado", price: "$8.500", desc: "Costillas de novillo a las brasas" },
        { name: "Ojo de Bife", price: "$9.200", desc: "Corte premium 300g, punto a pedido" },
        { name: "Vacío", price: "$7.800", desc: "Tierno y jugoso con chimichurri" },
        { name: "Entraña", price: "$8.000", desc: "Corte fino, especialidad de la casa" },
        { name: "Milanesa Napolitana", price: "$6.500", desc: "Con jamón, mozzarella y salsa" },
        { name: "Choripán", price: "$3.200", desc: "Chorizo en pan de campo" },
    ];

    const list = document.createElement("ul");
    dishes.forEach(dish => {
        const li = document.createElement("li");
        li.classList.add("dish");

        const namePrice = document.createElement("div");
        namePrice.classList.add("dish-header");
        const nameEl = document.createElement("span");
        nameEl.classList.add("dish-name");
        nameEl.textContent = dish.name;
        const priceEl = document.createElement("span");
        priceEl.classList.add("dish-price");
        priceEl.textContent = dish.price;
        namePrice.appendChild(nameEl);
        namePrice.appendChild(priceEl);

        const descEl = document.createElement("p");
        descEl.classList.add("dish-desc");
        descEl.textContent = dish.desc;

        li.appendChild(namePrice);
        li.appendChild(descEl);
        list.appendChild(li);
    });

    section.appendChild(list);
    return section;
}

function contact() {
    const section = document.createElement("section");
    section.classList.add("contact");

    const title = document.createElement("h2");
    title.textContent = "Contacto y Reservas";

    const info = [
        { label: "Dirección", value: "Av. General Paz 1234, Santa Fe" },
        { label: "Teléfono", value: "+54 11 4567-8901" },
        { label: "Email", value: "reservas@luigisparrilla.com.ar" },
        { label: "Horario", value: "Lun–Vie: 11:00–15:00 | 20:00–23:45" },
    ];

    const dl = document.createElement("dl");
    info.forEach(item => {
        const dt = document.createElement("dt");
        dt.textContent = item.label;
        const dd = document.createElement("dd");
        dd.textContent = item.value;
        dl.appendChild(dt);
        dl.appendChild(dd);
    });

    section.appendChild(title);
    section.appendChild(dl);
    return section;
}

export { home, menu, contact };