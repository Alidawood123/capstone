import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import NavigatePage from './src/components/NavigatePages';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Settings } from 'react-native-fbsdk-next';

export default function App() {
  const [currentPage, setCurrentPage] = useState('signin');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_ID,
    });

    const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
    const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;

    if (facebookAppId) {
      Settings.setAppID(facebookAppId);
      if (facebookClientToken) {
        Settings.setClientToken(facebookClientToken);
      }
      Settings.initializeSDK();
    } else {
      console.warn('Facebook App ID is missing. Facebook SDK was not initialized.');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigatePage page={currentPage} setPage={setCurrentPage} />
<<<<<<< Updated upstream
=======
      <Toast />
>>>>>>> Stashed changes
    </SafeAreaProvider>
  );
}
