import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SigninPage from './components/Signinpage';
import SignupPage from './components/Signuppage';
import LandingPage from './components/Landingpage';
import NutritionPage from './components/NutritionPage';
import FitnessPage from './components/FitnessPage';
import TrophyPage from './components/TrophyPage';
import SettingsPage from './components/SettingsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('signin');

  const navigateToSignUp = () => {
    setCurrentPage('signup');
  };

  const navigateToSignIn = () => {
    setCurrentPage('signin');
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
  };

  const navigateToNutrition = () => {
    setCurrentPage('nutrition');
  };

  const navigateToFitness = () => {
    setCurrentPage('fitness');
  };

  const navigateToTrophy = () => {
    setCurrentPage('trophy');
  };

  const navigateToSettings = () => {
    setCurrentPage('settings');
  };

  const renderPage = () => {
    if (currentPage === 'signup') {
      return <SignupPage onNavigateToSignIn={navigateToSignIn} onNavigateToLanding={navigateToLanding} />;
    }
    if (currentPage === 'nutrition') {
      return <NutritionPage onNavigateToLanding={navigateToLanding} />;
    }
    if (currentPage === 'fitness') {
      return <FitnessPage onNavigateToLanding={navigateToLanding} />;
    }
    if (currentPage === 'trophy') {
      return <TrophyPage onNavigateToLanding={navigateToLanding} />;
    }
    if (currentPage === 'settings') {
      return <SettingsPage onNavigateToLanding={navigateToLanding} />;
    }
    if (currentPage === 'landing') {
      return (
        <LandingPage
          onNavigateToSignIn={navigateToSignIn}
          onNavigateToNutrition={navigateToNutrition}
          onNavigateToFitness={navigateToFitness}
          onNavigateToTrophy={navigateToTrophy}
          onNavigateToSettings={navigateToSettings}
        />
      );
    }
    return <SigninPage onNavigateToSignUp={navigateToSignUp} onNavigateToLanding={navigateToLanding} />;
  };

  return (
    <SafeAreaProvider>
      {renderPage()}
    </SafeAreaProvider>
  );
}
