const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredKeys = [firebaseConfig.apiKey, firebaseConfig.projectId];
export const firebaseEnabled = requiredKeys.every(Boolean);

if (!firebaseEnabled) {
  console.warn("Firebase is not fully configured. Add VITE_FIREBASE_* values in Frontend/.env");
}

export { firebaseConfig };
