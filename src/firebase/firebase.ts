
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBnyD_a_bzitERJw0pajOUWOrKWlRBtuao",
  authDomain: "smart-campus-e8dfd.firebaseapp.com",
  projectId: "smart-campus-e8dfd",
  storageBucket: "smart-campus-e8dfd.firebasestorage.app",
  messagingSenderId: "872757355137",
  appId: "1:872757355137:web:01ce765469cc2c83d7e380",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;