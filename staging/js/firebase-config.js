// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDFkit8svOP5PVoMBwqCGmI0qLQK7BOZKU",
    authDomain: "revel-ec770.firebaseapp.com",
    databaseURL: "https://revel-ec770-default-rtdb.firebaseio.com",
    projectId: "revel-ec770",
    storageBucket: "revel-ec770.firebasestorage.app",
    messagingSenderId: "206922392146",
    appId: "1:206922392146:web:4b531dfd4c06107575758b"
};

let app, database;

try {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
} catch (e) {
    console.warn("Firebase not properly configured yet. Using mock demo mode.");
    database = null; // We will handle null fallback in the respective JS files
}

export { database, ref, onValue, set, get };
