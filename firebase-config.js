// Firebase Configuration
// This file initializes Firebase services for the Pumpkin Voting app

const firebaseConfig = {
  apiKey: "AIzaSyDkMLlIjlWlGPUCszEJedsAtgnfqVPSgRM",
  authDomain: "pumpkin-voting.firebaseapp.com",
  projectId: "pumpkin-voting",
  storageBucket: "pumpkin-voting.firebasestorage.app",
  messagingSenderId: "911880958959",
  appId: "1:911880958959:web:0a9af0327b427bb99abc1a"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for use in other modules (if using modules later)
// For now, these are available globally
