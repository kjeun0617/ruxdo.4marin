// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAYSF6wz-1iqJgxk_uPSPlQDju62SGcJz4",
  authDomain: "marin-app-c741d.firebaseapp.com",
  projectId: "marin-app-c741d",
  storageBucket: "marin-app-c741d.appspot.com",     // 수정: .appspot.com
  messagingSenderId: "848257930028",
  appId: "1:848257930028:web:adc6daf466f378073f5289",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export { app, db };
