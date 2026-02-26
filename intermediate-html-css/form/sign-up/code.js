const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const logInAnchor = document.getElementById("log-in-anchor");
const form = document.getElementById("signup-form");


function validatePasswords() {
    if (confirmPasswordInput.value === "") {
        confirmPasswordInput.setCustomValidity("");
        return;
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity("Passwords don't match");
    } else {
        confirmPasswordInput.setCustomValidity("");
    }
}

function handleSubmit(e) {
    e.preventDefault();
    form.reset();

}

confirmPasswordInput.addEventListener("input", validatePasswords);
passwordInput.addEventListener("input", validatePasswords);
form.addEventListener("submit", handleSubmit);
logInAnchor.addEventListener("click", () => alert("Functionality in coming!"));