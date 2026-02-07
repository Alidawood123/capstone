import { useState } from 'react';
import SigninPage from './components/Signinpage';
import SignupPage from './components/Signuppage';
import LandingPage from './components/Landingpage';
import FitnessPage from './components/Fitnesspage';
import NutritionPage from './components/Nutritionpage';

import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Settings } from 'react-native-fbsdk-next';
import Toast from 'react-native-toast-message';

export default function App() {

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_ID,
  });

  Settings.setAppID(process.env.EXPO_PUBLIC_FACEBOOK_APP_ID);

  const [currentPage, setCurrentPage] = useState('signin');

  const navigateToSignUp = () => {
    setCurrentPage('signup');
  };

  const navigateToSignIn = () => {
    auth().signOut();
    setCurrentPage('signin');
  };


  // Pages
  const navigateToLanding = () => {
    setCurrentPage('landing');
  };

  const navigateToFitness = () => {
    setCurrentPage('fitness');
  };

  const navigateToNutrition = () => {
    setCurrentPage('nutrition');
  };


  if (currentPage === 'signup') {
    return <>
      <SignupPage
        onNavigateToSignIn={navigateToSignIn}
        onNavigateToLanding={navigateToLanding}
      />
      <Toast />
    </>;
  }

  if (currentPage === 'landing') {
    return <>
      <LandingPage 
        onNavigateToSignIn={navigateToSignIn} 
        onNavigateToFitness={navigateToFitness}
        onNavigateToNutrition={navigateToNutrition}
      />
      <Toast />
    </>;
  }


  if (currentPage === 'fitness') {
    return <>
      <FitnessPage onNavigateToLanding={navigateToLanding} />
      <Toast />
    
    </>
  }

  if (currentPage === 'nutrition') {
    return <>
      <NutritionPage onNavigateToLanding={navigateToLanding} />
      <Toast />
    
    </>  
  }


  return <>
    <SigninPage
      onNavigateToSignUp={navigateToSignUp}
      onNavigateToLanding={navigateToLanding}
    />
    <Toast />
  </>;
}
