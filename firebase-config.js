// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDThXKhHrcYOuKUurdv3wnyotTuyOJ20E8",
  authDomain: "gautomate-5ea3a.firebaseapp.com",
  databaseURL: "https://gautomate-5ea3a-default-rtdb.firebaseio.com",
  projectId: "gautomate-5ea3a",
  storageBucket: "gautomate-5ea3a.appspot.com",
  messagingSenderId: "290552333096",
  appId: "1:290552333096:web:71be5193ce1c809e93061d",
  measurementId: "G-D90FEWHCVT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export auth instance
export const auth = firebase.auth();