import { useState } from 'react';

import NavigatePage from './src/components/NavigatePages';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Settings } from 'react-native-fbsdk-next';

export default function App() {
  const [currentPage, setCurrentPage] = useState('signin');

  // Initialize Firebase
  GoogleSignin.configure({webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_ID});
  Settings.setAppID(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID);

  return <NavigatePage page={currentPage} setPage={setCurrentPage} />
}
