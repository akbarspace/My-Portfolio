var popupoverlay = document.querySelector(".popup-overlay")
var popupbox = document.querySelector(".popup-box")
var addpopupbutton = document.getElementById("add-popup-button")

addpopupbutton.addEventListener("click", function () {
    popupoverlay.style.display = "block"
    popupbox.style.display = "block"
})

var cancelpopup = document.getElementById("cancel-popup")
cancelpopup.addEventListener("click", function (event) {
    event.preventDefault()
    popupoverlay.style.display = "none"
    popupbox.style.display = "none"
})

var container = document.getElementById("container")
var addbook = document.getElementById("add-book")
var booktitleinput = document.getElementById("book-title-input")
var bookauthorinput = document.getElementById("book-author-input")
var bookdescriptioninput = document.getElementById("book-description-input")

addbook.addEventListener("click", function (event) {
    event.preventDefault()
    
    // Basic Validation (Optional but good)
    if(booktitleinput.value == "") {
        alert("Please enter a book title")
        return
    }

    var div = document.createElement("div")
    div.setAttribute("class", "book-container")
    div.innerHTML = `
        <h2>${booktitleinput.value}</h2>
        <h5>${bookauthorinput.value}</h5>
        <p>${bookdescriptioninput.value}</p>
        <button onclick="deletebook(event)">Delete</button>
    `
    container.append(div)
    
    // Reset and Close
    popupoverlay.style.display = "none"
    popupbox.style.display = "none"
    booktitleinput.value = ""
    bookauthorinput.value = ""
    bookdescriptioninput.value = ""
})

function deletebook(event) {
    event.target.parentElement.remove()
}