// Setup script to create admin emails config in Firestore
// Run this with: node setup-admin-emails.js

const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

// Firebase configuration
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
const db = firebase.firestore();

// Admin emails to set up
// EDIT THIS ARRAY WITH YOUR ADMIN EMAILS
const adminEmails = [
  'david@elijahrising.org',
];

async function setupAdminEmails() {
  console.log('Setting up admin emails in Firestore...');
  console.log('Admin emails:', adminEmails);

  try {
    await db.collection('config').doc('adminEmails').set({
      emails: adminEmails,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Success! Admin emails configured.');
    console.log('\nNext steps:');
    console.log('1. Register at https://pumpkin-voting.web.app with one of these emails');
    console.log('2. You will automatically be granted admin privileges');
    console.log('3. Access admin dashboard at https://pumpkin-voting.web.app/admin.html');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up admin emails:', error);
    process.exit(1);
  }
}

// Run the setup
setupAdminEmails();
