function appendToDisplay(input) {
    const display = document.getElementById('display');
    if (display) {
        display.value += input;
    }
}

function clearDisplay() {
    const display = document.getElementById('display');
    if (display) {
        display.value = "";
    }
}

function deleteLast() {
    const display = document.getElementById('display');
    if (display) {
        display.value = display.value.slice(0, -1);
    }
}

function calculate() {
    const display = document.getElementById('display');
    if (display && display.value !== "") {
        try {
            display.value = eval(display.value);
        } catch (error) {
            display.value = "Error";
        }
    }
}
