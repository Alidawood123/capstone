import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NavigatePage from './src/components/NavigatePages';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Settings } from 'react-native-fbsdk-next';
import { getAuth } from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

export default function App() {
  const auth = getAuth();

  const [currentPage, setCurrentPage] = useState('signin');
  const navigateToSignUp = () => {
    if(auth.currentUser) {
      auth.signOut();
    }
    setCurrentPage('signup');
  };
  const navigateToSignIn = () => {
    if(auth.currentUser) {
      auth.signOut();
    }
    setCurrentPage('signin');
  };

  const navigateToForgotPassword = () => setCurrentPage('forgotpassword');
  const navigateToFitness = () => setCurrentPage('fitness');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_ID,
    });
    Settings.setAppID(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID);
  }, []);

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <NavigatePage 
          currentPage={currentPage} 
          onNavigateToFitness={navigateToFitness} 
          onNavigateToSignIn={navigateToSignIn} 
          onNavigateToSignUp={navigateToSignUp} 
          onNavigateToForgotPassword={navigateToForgotPassword} />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
