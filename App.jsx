import { useState, useEffect } from 'react';
import SigninPage from './components/Signinpage';
import SignupPage from './components/Signuppage';
import LandingPage from './components/Landingpage';

import { initializeApp } from 'firebase/app';

import { getAuth } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Settings } from 'react-native-fbsdk-next';

import Toast from 'react-native-toast-message';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export default function App() {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_ID,
  });
  Settings.setAppID(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID);

  const [currentPage, setCurrentPage] = useState('signin'); // 'signin', 'signup', or 'landing'

  const navigateToSignUp = () => {
    setCurrentPage('signup');
  };

  const navigateToSignIn = () => {
    if(auth.currentUser) {
      auth.signOut();
      console.log('User signed out');
      // Toast.show({
      //   type: 'success',
      //   text1: 'Signed out successfully'
      // });
    }
    setCurrentPage('signin');
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
  };

  // useEffect(() => {
  //   const unsubscribe = auth.onAuthStateChanged(user => {
  //     if (user) {
  //       setCurrentPage('landing');
  //     } else {
  //       setCurrentPage('signin');
  //     }
  //   });

  //   return () => unsubscribe();
  // }, [currentPage]);

  if (currentPage === 'signup') {
    return <>
      <SignupPage onNavigateToSignIn={navigateToSignIn} onNavigateToLanding={navigateToLanding} />;
      <Toast />
    </>
  }

  if (currentPage === 'landing') {
    return <>
      <LandingPage onNavigateToSignIn={navigateToSignIn} />;
      <Toast />
    </>
  }

  return <>
  <SigninPage onNavigateToSignUp={navigateToSignUp} onNavigateToLanding={navigateToLanding} />
  <Toast />
  </>;
}
