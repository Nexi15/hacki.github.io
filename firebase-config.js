// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyARd3zgC_7SnLZG4c1rmx1E7TOK4sqy2zQ",
  authDomain: "lostmc-db.firebaseapp.com",
  databaseURL: "https://lostmc-db-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lostmc-db",
  storageBucket: "lostmc-db.firebasestorage.app",
  messagingSenderId: "400562944733",
  appId: "1:400562944733:web:f33720ac90878966557934",
  measurementId: "G-MLMBYZXXFF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
