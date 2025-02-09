/* import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Kullanıcı Kaydı
async function registerUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore'a kullanıcıyı UID ile kaydet
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      createdAt: new Date()
    });

    console.log("Kullanıcı kaydedildi:", user.uid);
    return user;
  } catch (error) {
    console.error("Kayıt hatası:", error);
  }
}

// Kullanıcı Girişi
async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Giriş başarılı:", user.uid);

    // Kullanıcı bilgilerini Firestore'dan çek
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      console.log("Kullanıcı bilgileri:", userDoc.data());
    }

    return user;
  } catch (error) {
    console.error("Giriş hatası:", error);
  }
}

// Çıkış Yap
async function logoutUser() {
  try {
    await signOut(auth);
    console.log("Çıkış yapıldı");
  } catch (error) {
    console.error("Çıkış hatası:", error);
  }
}

export { registerUser, loginUser, logoutUser };
 */