import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase client configuration for DC VIDEOS.
// These are client-side project identifiers, not service-account credentials.
const firebaseConfig = {
  apiKey: 'AIzaSyCxUi6f7Nnea0L-asG3Hp5Jk6PrFNY9Q1E',
  authDomain: 'dc-videos-ca4e8.firebaseapp.com',
  projectId: 'dc-videos-ca4e8',
  storageBucket: 'dc-videos-ca4e8.firebasestorage.app',
  messagingSenderId: '651729829583',
  appId: '1:651729829583:web:ebe43dde20337661a041ba',
  measurementId: 'G-GZF2LZET7N',
};

export const firebaseReady = true;
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (error) {
  auth = getAuth(app);
}
export { auth };
