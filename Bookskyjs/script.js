// 1. Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDIjWcelz9BZksia5hgHewuR_WitbW_v4U",
    authDomain: "booksky-app-9e0e3.firebaseapp.com",
    projectId: "booksky-app-9e0e3",
    storageBucket: "booksky-app-9e0e3.firebasestorage.app",
    messagingSenderId: "142805916775",
    appId: "1:142805916775:web:4ef1b4c9e2c1306d9f48c2"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. UI Elements
var popupoverlay = document.querySelector(".popup-overlay")
var popupbox = document.querySelector(".popup-box")
var addpopupbutton = document.getElementById("add-popup-button")
var container = document.getElementById("container")
var addbook = document.getElementById("add-book")
var booktitleinput = document.getElementById("book-title-input")
var bookauthorinput = document.getElementById("book-author-input")
var bookdescriptioninput = document.getElementById("book-description-input")
var loginOverlay = document.getElementById('login-overlay');
var loginBtn = document.getElementById('login-btn');

// --- Functions ---

// Popup Show/Hide logic
addpopupbutton.addEventListener("click", () => {
    popupoverlay.style.display = "block";
    popupbox.style.display = "block";
});

document.getElementById("cancel-popup").addEventListener("click", (e) => {
    e.preventDefault();
    popupoverlay.style.display = "none";
    popupbox.style.display = "none";
});

// Login/Signup Logic
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if(!email || !password) return alert("Email/Password fill pannunga thala!");

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Account Created & Logged In!");
            } catch (err) { alert(err.message); }
        } else { alert(error.message); }
    }
});

// Save Book Logic
addbook.addEventListener("click", async (event) => {
    event.preventDefault();
    if(booktitleinput.value == "") return alert("Title please!");

    try {
        await addDoc(collection(db, "books"), {
            title: booktitleinput.value,
            author: bookauthorinput.value,
            description: bookdescriptioninput.value,
            uid: auth.currentUser.uid,
            createdAt: serverTimestamp()
        });

        popupoverlay.style.display = "none";
        popupbox.style.display = "none";
        booktitleinput.value = ""; bookauthorinput.value = ""; bookdescriptioninput.value = "";
    } catch (e) { console.error(e); }
});

// Auth & Real-time Fetch Logic
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginOverlay.style.display = 'none';
        const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
        
        onSnapshot(q, (snapshot) => {
            container.innerHTML = ""; 
            snapshot.docs.forEach((docSnap) => {
                const book = docSnap.data();
                if(book.uid === user.uid) {
                    var div = document.createElement("div");
                    div.setAttribute("class", "book-container");
                    div.innerHTML = `
                        <h2>${book.title}</h2>
                        <h5>${book.author}</h5>
                        <p>${book.description}</p>
                        <button class="delete-btn" data-id="${docSnap.id}">Delete</button>
                    `;
                    container.append(div);
                }
            });
            
            // Delete listener for each button
            document.querySelectorAll(".delete-btn").forEach(btn => {
                btn.onclick = async (e) => {
                    const id = e.target.getAttribute("data-id");
                    await deleteDoc(doc(db, "books", id));
                };
            });
        });
    } else {
        loginOverlay.style.display = 'flex';
    }
});
