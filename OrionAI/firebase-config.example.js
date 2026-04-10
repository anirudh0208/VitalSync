/* ============================================================
   OrionAI — firebase-config.example.js
   
   INSTRUCTIONS:
   1. Copy this file to firebase-config.js
   2. Replace all placeholder values with your actual Firebase
      project credentials from the Firebase Console
   3. firebase-config.js is in .gitignore — NEVER commit it
   ============================================================ */

// Get these values from:
// Firebase Console → Project Settings → Your apps → Web app → Config

const FIREBASE_CONFIG = {
  apiKey:            'YOUR_API_KEY_HERE',
  authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId:             'YOUR_APP_ID',
  measurementId:     'YOUR_MEASUREMENT_ID',   // optional
};

// Admin emails (users who auto-get the 'admin' role on first signup)
// Add your email address here
const ADMIN_EMAILS = ['your-admin-email@example.com'];

export { FIREBASE_CONFIG, ADMIN_EMAILS };
