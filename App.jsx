import React, { useState } from 'react';
import SigninPage from './components/Signinpage';
import SignupPage from './components/Signuppage';
import LandingPage from './components/Landingpage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('signin'); // 'signin', 'signup', or 'landing'

  const navigateToSignUp = () => {
    setCurrentPage('signup');
  };

  const navigateToSignIn = () => {
    setCurrentPage('signin');
  };

  const navigateToLanding = () => {
    setCurrentPage('landing');
  };

  if (currentPage === 'signup') {
    return <SignupPage onNavigateToSignIn={navigateToSignIn} onNavigateToLanding={navigateToLanding} />;
  }

  if (currentPage === 'landing') {
    return <LandingPage onNavigateToSignIn={navigateToSignIn} />;
  }

  return <SigninPage onNavigateToSignUp={navigateToSignUp} onNavigateToLanding={navigateToLanding} />;
}
