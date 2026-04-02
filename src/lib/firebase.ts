import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDxcnKQeiVYH4xIvPgFc_vMpdp_G3TkVO0",
  authDomain: "medical-screening-app-96e7c.firebaseapp.com",
  projectId: "medical-screening-app-96e7c",
  storageBucket: "medical-screening-app-96e7c.firebasestorage.app",
  messagingSenderId: "355537742810",
  appId: "1:355537742810:web:4bb50bd5a22dad71c2eee3"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Secondary app instance — used by admin to create users without logging themselves out
const secondaryApp = initializeApp(firebaseConfig, "secondary");
const secondaryAuth = getAuth(secondaryApp);

export { app, auth, db, storage, secondaryAuth };

