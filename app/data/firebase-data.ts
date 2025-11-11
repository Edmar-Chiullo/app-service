import { getDatabase, connectDatabaseEmulator } from "firebase/database";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6Llf91WoUx7GdAE4htf2EdIec73CYSOM",
  authDomain: "service-app-4f7ca.firebaseapp.com",
  databaseURL: "https://service-app-4f7ca-default-rtdb.firebaseio.com",
  projectId: "service-app-4f7ca",
  storageBucket: "service-app-4f7ca.firebasestorage.app",
  messagingSenderId: "10598241055",
  appId: "1:10598241055:web:7f1d509f0607e4d085562a",
  measurementId: "G-CERPHCMK16"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
export const db = getDatabase(app);

// Configure Realtime Database local emulator if needed
if (typeof window !== "undefined" && location.hostname === "localhost") {
connectDatabaseEmulator(db, "localhost", 9000);
}

if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
connectDatabaseEmulator(db, "localhost", 9000);
}