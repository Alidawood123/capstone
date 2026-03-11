import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NavigatePage from './src/components/NavigatePages';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Settings } from 'react-native-fbsdk-next';
import Toast from 'react-native-toast-message';

export default function App() {
  const [currentPage, setCurrentPage] = useState('signin');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_ID,
    });
    Settings.setAppID(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID);
  }, []);

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <NavigatePage page={currentPage} setPage={setCurrentPage} />
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
