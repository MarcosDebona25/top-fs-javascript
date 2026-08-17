import parrilladaImg from "./assets/parrillada.jpeg";

function home() {
    const section = document.createElement("section");
    section.classList.add("home");

    const heroContainer = document.createElement("div");
    heroContainer.classList.add("hero-container");

    const textCol = document.createElement("div");
    textCol.classList.add("hero-text");

    const welcome = document.createElement("h2");
    welcome.textContent = "El verdadero sabor del asado argentino";

    const subtext = document.createElement("p");
    subtext.textContent = "Seleccionamos los mejores cortes de novillo de pastura y los asamos pacientemente a las brasas de leña de quebracho, honrando la costumbre gastronómica de Santa Fe.";

    const highlightsTitle = document.createElement("h3");
    highlightsTitle.textContent = "Especialidades de la Casa";

    const highlights = document.createElement("ul");
    highlights.classList.add("hero-tags");
    const items = [
        "Asado de Tira",
        "Bife de Chorizo",
        "Mollejas al Limón",
        "Vacío al Asador",
        "Provoleta Especial",
        "Entraña Fina"
    ];
    items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        highlights.appendChild(li);
    });

    textCol.appendChild(welcome);
    textCol.appendChild(subtext);
    textCol.appendChild(highlightsTitle);
    textCol.appendChild(highlights);

    const imageCol = document.createElement("div");
    imageCol.classList.add("hero-image-wrapper");

    const img = document.createElement("img");
    img.src = parrilladaImg;
    img.alt = "Parrillada tradicional argentina servida con cortes seleccionados";
    img.classList.add("hero-img");

    imageCol.appendChild(img);

    heroContainer.appendChild(textCol);
    heroContainer.appendChild(imageCol);
    section.appendChild(heroContainer);

    return section;
}

function menu() {
    const section = document.createElement("section");
    section.classList.add("menu");

    const title = document.createElement("h2");
    title.textContent = "Nuestra Carta Criolla";
    section.appendChild(title);

    const menuCategories = [
        {
            category: "Entradas y Achuras",
            items: [
                { name: "Provoleta a la Parrilla", price: "$4.800", desc: "Queso provolone fundido con orégano fresco, ají molido y aceite de oliva virgen extra" },
                { name: "Mollejas al Limón", price: "$6.900", desc: "Doradas y crocantes por fuera, tiernas por dentro, terminadas con jugo de limón natural" },
                { name: "Chorizo y Morcilla Criolla", price: "$3.900", desc: "Dúo artesanal de puro cerdo y morcilla especiada con cebolla de verdeo" },
                { name: "Chinchulines Crocantes", price: "$5.200", desc: "Trenza de chinchulín dorada a las brasas viva con sal gruesa y limón" },
                { name: "Empanada Criolla de Carne", price: "$1.800", desc: "Carne cortada a cuchillo, horneada en masa casera tradicional" }
            ]
        },
        {
            category: "Cortes a las Brasas",
            items: [
                { name: "Asado de Tira", price: "$9.500", desc: "Tiras anchas de costillar de novillo asadas a fuego moderado de quebracho" },
                { name: "Bife de Chorizo (400g)", price: "$10.800", desc: "Corte noble, jugoso, tierno y con el borde de grasa crocante ideal" },
                { name: "Ojo de Bife Premium", price: "$11.200", desc: "Centro de bife ancho con un marmoleado óptimo para máxima terneza" },
                { name: "Vacío Asado", price: "$8.900", desc: "Corte tierno con membrana crocante, servido con chimichurri casero" },
                { name: "Entraña Fina", price: "$9.800", desc: "Corte magro y de intenso sabor, cocinado a punto exacto" },
                { name: "Matambre a la Pizza", price: "$8.600", desc: "Matambre tiernizado cubierto con salsa de tomate de la casa, mozzarella gratinada y orégano" }
            ]
        },
        {
            category: "Guarniciones y Ensaladas",
            items: [
                { name: "Papas Fritas a la Provenzal", price: "$3.500", desc: "Papas bastón cortadas a mano, salteadas con ajo picado, perejil y oliva" },
                { name: "Ensalada Mixta Tradicional", price: "$2.800", desc: "Hojas frescas de lechuga criolla, rodajas de tomate y cebolla morada" },
                { name: "Ensalada de Rúcula y Parmesano", price: "$3.600", desc: "Rúcula fresca de estación, láminas de queso parmesano y reducción de aceto" },
                { name: "Puré de Papas Casero", price: "$3.000", desc: "Cremoso puré de papas con manteca de campo y nuez moscada" }
            ]
        },
        {
            category: "Postres Clásicos",
            items: [
                { name: "Flan Casero Mixto", price: "$3.200", desc: "El clásico flan con dulce de leche colonial y crema batida fresca" },
                { name: "Panqueque con Dulce de Leche", price: "$3.500", desc: "Tibio, relleno abundante y caramelizado con azúcar crocante" },
                { name: "Don Pedro Tradicional", price: "$4.200", desc: "Helado de crema americana con nueces tostadas y licor de whisky" }
            ]
        }
    ];

    menuCategories.forEach(cat => {
        const catContainer = document.createElement("div");
        catContainer.classList.add("menu-category");

        const catTitle = document.createElement("h3");
        catTitle.classList.add("category-title");
        catTitle.textContent = cat.category;
        catContainer.appendChild(catTitle);

        const list = document.createElement("div");
        list.classList.add("dishes-grid");

        cat.items.forEach(dish => {
            const card = document.createElement("div");
            card.classList.add("dish-card");

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

            card.appendChild(namePrice);
            card.appendChild(descEl);
            list.appendChild(card);
        });

        catContainer.appendChild(list);
        section.appendChild(catContainer);
    });

    return section;
}

function contact() {
    const section = document.createElement("section");
    section.classList.add("contact");

    const title = document.createElement("h2");
    title.textContent = "Contacto y Reservas";
    section.appendChild(title);

    const contactContainer = document.createElement("div");
    contactContainer.classList.add("contact-container");

    // Columna de información
    const infoCol = document.createElement("div");
    infoCol.classList.add("contact-info");

    const infoHeading = document.createElement("h3");
    infoHeading.textContent = "Información del Restaurante";
    infoCol.appendChild(infoHeading);

    const infoList = [
        { label: "Dirección", value: "Av. General Paz 1234, Santa Fe, Argentina" },
        { label: "Teléfono", value: "+54 342 456-7890" },
        { label: "WhatsApp Reservas", value: "+54 9 342 512-3456" },
        { label: "Correo Electrónico", value: "reservas@luigisparrilla.com.ar" },
        { label: "Almuerzo", value: "Martes a Domingo: 11:30 a 15:30 hs" },
        { label: "Cena", value: "Martes a Sábado: 20:00 a 00:30 hs" },
        { label: "Día de Descanso", value: "Lunes todo el día" }
    ];

    const dl = document.createElement("dl");
    infoList.forEach(item => {
        const dt = document.createElement("dt");
        dt.textContent = item.label;
        const dd = document.createElement("dd");
        dd.textContent = item.value;
        dl.appendChild(dt);
        dl.appendChild(dd);
    });
    infoCol.appendChild(dl);

    // Columna de formulario de reserva
    const formCol = document.createElement("div");
    formCol.classList.add("reservation-box");

    const formHeading = document.createElement("h3");
    formHeading.textContent = "Solicitar Mesa";
    formCol.appendChild(formHeading);

    const form = document.createElement("form");
    form.classList.add("reservation-form");
    form.onsubmit = (e) => e.preventDefault();

    const nameGroup = document.createElement("div");
    nameGroup.classList.add("form-group");
    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Nombre y Apellido";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Ej: Carlos Gómez";
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);

    const dateGroup = document.createElement("div");
    dateGroup.classList.add("form-group");
    const dateLabel = document.createElement("label");
    dateLabel.textContent = "Fecha y Turno";
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateGroup.appendChild(dateLabel);
    dateGroup.appendChild(dateInput);

    const guestsGroup = document.createElement("div");
    guestsGroup.classList.add("form-group");
    const guestsLabel = document.createElement("label");
    guestsLabel.textContent = "Cantidad de Comensales";
    const guestsSelect = document.createElement("select");
    ["1 Persona", "2 Personas", "3 Personas", "4 Personas", "5 o más Personas"].forEach((optText, index) => {
        const option = document.createElement("option");
        option.value = String(index + 1);
        option.textContent = optText;
        if (index === 1) option.selected = true;
        guestsSelect.appendChild(option);
    });
    guestsGroup.appendChild(guestsLabel);
    guestsGroup.appendChild(guestsSelect);

    const tooltipWrapper = document.createElement("div");
    tooltipWrapper.classList.add("tooltip-container");

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.disabled = true;
    submitBtn.classList.add("btn-reservation-disabled");
    submitBtn.textContent = "Solicitar Reserva";
    submitBtn.title = "Reservas online momentáneamente suspendidas por alta demanda. Por favor comuníquese por teléfono.";

    const tooltipText = document.createElement("span");
    tooltipText.classList.add("tooltip-text");
    tooltipText.textContent = "Reservas online momentáneamente suspendidas por alta demanda. Por favor comuníquese por teléfono.";

    tooltipWrapper.appendChild(submitBtn);
    tooltipWrapper.appendChild(tooltipText);

    form.appendChild(nameGroup);
    form.appendChild(dateGroup);
    form.appendChild(guestsGroup);
    form.appendChild(tooltipWrapper);

    formCol.appendChild(form);

    contactContainer.appendChild(infoCol);
    contactContainer.appendChild(formCol);
    section.appendChild(contactContainer);

    return section;
}

export { home, menu, contact };