const hrs = document.getElementById("hrs");
const mins = document.getElementById("mins");
const sec = document.getElementById("sec");

function updateClock() {
    const now = new Date();
    
    hrs.innerHTML = (now.getHours() < 10 ? "0" : "") + now.getHours();
    mins.innerHTML = (now.getMinutes() < 10 ? "0" : "") + now.getMinutes();
    sec.innerHTML = (now.getSeconds() < 10 ? "0" : "") + now.getSeconds();
}

setInterval(updateClock, 1000);
updateClock();