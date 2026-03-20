const form = document.getElementById("my-form");
const email = document.getElementById("email");
const zipcode = document.getElementById("zipcode");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const submitBtn = document.getElementById("submit-btn");

function validateEmail() {
    if (email.validity.valueMissing) {
        email.setCustomValidity("Email is required.");
    } else if (email.validity.typeMismatch) {
        email.setCustomValidity("Invalid email.");
    } else email.setCustomValidity("");
    showError(email);
}

function validateZipcode() {
    const zipRegex = /^\d{4}$/;
    if (zipcode.validity.valueMissing) {
        zipcode.setCustomValidity("Zipcode is required");
    } else if (!zipRegex.test(zipcode.value)) {
        zipcode.setCustomValidity("Zipcode must have exactly 4 digits.");
    } else zipcode.setCustomValidity("");
    showError(zipcode);
}

function validatePassword() {
    if (password.validity.valueMissing) {
        password.setCustomValidity("Password is required.");
    } else if (password.value.length < 6) {
        password.setCustomValidity("Password must have at least 6 characters.");
    } else password.setCustomValidity("");
    showError(password);
    validateConfirmPassword();
}

function validateConfirmPassword() {
    if (confirmPassword.value !== password.value) {
        confirmPassword.setCustomValidity("Passwords don't match.");
    } else confirmPassword.setCustomValidity("");
    showError(confirmPassword);
}

function showError(inputElement) {
    const errorSpan = inputElement.nextElementSibling;
    errorSpan.textContent = inputElement.validationMessage;
}

function checkFormValidity() {
    submitBtn.disabled = !form.checkValidity();
}

email.addEventListener("input", validateEmail);
zipcode.addEventListener("input", validateZipcode);
password.addEventListener("input", validatePassword);
confirmPassword.addEventListener("input", validateConfirmPassword);

const inputs = [email, zipcode, password, confirmPassword];
inputs.forEach(input => {
    input.addEventListener("input", checkFormValidity);
});