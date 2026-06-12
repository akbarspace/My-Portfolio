function calculateBMI() {
    let heightinput = document.getElementById("height").value;
    let weightinput = document.getElementById("weight").value;

    let weight = parseFloat(weightinput);
    let heightcm = parseFloat(heightinput);

    let height = heightcm / 100;

    let BMI = weight / (height * height);

    let healthStatus = document.getElementById("BMIlevel");

    if (heightinput <= 0 || weightinput <= 0) {
        document.getElementById("result").innerHTML = "Plese Enter Your Height and Weight..!";
        return;
    }
    else {
        document.getElementById("result").innerHTML = `Your BMI is:${BMI.toFixed(2)}`;
    }


    if (BMI < 18.5) {
        healthStatus.innerHTML = "You are Under weight Eat more";
    }

    else if (BMI >= 18.5 && BMI <= 24.9) {
        healthStatus.innerHTML = "You are Healthyyy..💪"
    }

    else {
        healthStatus.innerHTML = "You are Over Weight..";
    }
}



let weightBox = document.getElementById("weight");
let heightBox = document.getElementById("height");

weightBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        calculateBMI();
    }
});

heightBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        calculateBMI();
    }
});
