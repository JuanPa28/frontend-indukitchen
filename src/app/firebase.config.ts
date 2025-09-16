// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: "AIzaSyBxOjJQMbtQGn2Dl2bhKqSe3Z7hHAWacPQ",
  authDomain: "indukitchen-2025.firebaseapp.com",
  projectId: "indukitchen-2025",
  storageBucket: "indukitchen-2025.firebasestorage.app",
  messagingSenderId: "447343833159",
  appId: "1:447343833159:web:bdb3d4a019ee4e7ff1c162",
  measurementId: "G-YQ7GS7W7JC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
