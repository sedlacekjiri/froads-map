// ======================================================
//  FIREBASE INITIALIZATION (v8.10.0)
// ======================================================
//  This file initializes Firebase services used across
//  the entire application and exposes them globally.
//
//  ✅ Uses your project config
//  ✅ Works with firebase-app / auth / firestore / storage
// ======================================================

// Ensure Firebase SDKs are loaded from index.html:
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
// <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-storage.js"></script>

// ------------------------------------------------------
//  CONFIGURATION
// ------------------------------------------------------


const firebaseConfig = {
  apiKey: "AIzaSyDDMNnJgtm-gK9OrVev7qmBRpaA8CAoDiM",
  authDomain: "froad-7d561.firebaseapp.com",
  projectId: "froad-7d561",
  storageBucket: "froad-7d561.firebasestorage.app",
  messagingSenderId: "1086299585443",
  appId: "1:1086299585443:web:10bcb67effd6a89c24f816"
};

// ------------------------------------------------------
//  INITIALIZATION
// ------------------------------------------------------
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase initialized");
} else {
  firebase.app(); // if already initialized
}

// ------------------------------------------------------
//  SERVICE REFERENCES
// ------------------------------------------------------
const auth = firebase.auth();
const db = firebase.firestore();

// Explicitly define custom storage bucket (same as original)
const storage = firebase.storage(firebase.app(), "gs://froad-7d561.firebasestorage.app");

// ------------------------------------------------------
//  GLOBAL EXPORTS (accessible from any script)
// ------------------------------------------------------
window.firebaseApp = firebase;
window.auth = auth;
window.db = db;
window.storage = storage;

// ------------------------------------------------------
//  DEBUG LOG
// ------------------------------------------------------
console.log("🔥 Firebase connected:", {
  app: firebase.app().name,
  projectId: firebaseConfig.projectId
});

// ======================================================
//  END OF FILE
// ======================================================
