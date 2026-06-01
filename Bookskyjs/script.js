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
var popupoverlay = document.querySelector(".popup-overlay");
var popupbox = document.querySelector(".popup-box");
var addpopupbutton = document.getElementById("add-popup-button");
var cancelpopup = document.getElementById("cancel-popup"); // 👈 FIX: Added missing selector
var container = document.getElementById("container");
var addbook = document.getElementById("add-book");
var booktitleinput = document.getElementById("book-title-input");
var bookauthorinput = document.getElementById("book-author-input");
var bookdescriptioninput = document.getElementById("book-description-input");
var loginOverlay = document.getElementById('login-overlay');
var loginBtn = document.getElementById('login-btn');

// --- Functions ---

// + Icon click panna popup varum
addpopupbutton.addEventListener("click", function() {
    popupoverlay.style.display = "block";
    popupbox.style.display = "block";
    
    setTimeout(() => {
        popupbox.classList.add("show");
    }, 10);
});

// Cancel click panna popup pogum
cancelpopup.addEventListener("click", function(event) {
    event.preventDefault();
    popupbox.classList.remove("show");
    
    setTimeout(() => {
        popupbox.style.display = "none";
        popupoverlay.style.display = "none";
    }, 300); 
});

// Success Popup function
function showSuccess() {
    const popup = document.getElementById('success-popup');
    const bar = document.getElementById('progress-bar');

    popup.classList.remove('hide');
    popup.classList.add('show');

    bar.style.transition = 'none';
    bar.style.transform = 'scaleX(1)';
    setTimeout(() => {
        bar.style.transition = 'transform 2s linear';
        bar.style.transform = 'scaleX(0)';
    }, 50);

    setTimeout(() => {
        popup.classList.remove('show');
        popup.classList.add('hide');
        setTimeout(() => {
            popup.classList.remove('hide');
        }, 300);
    }, 2200);
}

// Login Button Listener
loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showSuccess();
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                showSuccess();
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

        popupbox.classList.remove("show");
        setTimeout(() => {
            popupoverlay.style.display = "none";
            popupbox.style.display = "none";
        }, 300);

        booktitleinput.value = ""; bookauthorinput.value = ""; bookdescriptioninput.value = "";
    } catch (e) { console.error(e); }
});

// Consolidated Single Auth & Real-time Fetch Logic 👈 FIX: Merged duplicates
let unsubscribe = null;

onAuthStateChanged(auth, (user) => {
    // Hide loader immediately once Firebase responds
    document.getElementById('page-loader').style.display = 'none';

    if (user) {
        loginOverlay.style.display = 'none';
        
        const q = query(collection(db, "books"), orderBy("createdAt", "desc"));
        
        // Listen to changes reactively
        unsubscribe = onSnapshot(q, (snapshot) => {
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
            
            // Re-bind click event dynamically
            document.querySelectorAll(".delete-btn").forEach(btn => {
                btn.onclick = async (e) => {
                    const id = e.target.getAttribute("data-id");
                    await deleteDoc(doc(db, "books", id));
                };
            });
        });
    } else {
        loginOverlay.style.display = 'flex';
        if (unsubscribe) {
            unsubscribe(); // Clean up subscription on logout
        }
    }
});
