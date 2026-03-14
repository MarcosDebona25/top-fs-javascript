import { starting } from "./start.js";
import { home, menu, contact } from "./modules.js";
import "./style.css";

const [h1, p] = starting();
const brand = document.getElementById("brand");
brand.appendChild(h1);
brand.appendChild(p);

const content = document.getElementById("content");

function renderSection(sectionFn) {
    content.innerHTML = "";
    content.appendChild(sectionFn());
}

renderSection(home);

const sections = [home, menu, contact];
const buttons = document.querySelectorAll("nav button");

buttons[0].classList.add("active");

buttons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderSection(sections[i]);
    });
});