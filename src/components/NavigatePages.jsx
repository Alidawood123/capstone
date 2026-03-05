import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';

import SigninPage from '../pages/Signinpage';
import SignupPage from '../pages/Signuppage';
import LandingPage from '../pages/LandingPage';
import FitnessPage from '../pages/FitnessPage';
import NutritionPage from '../pages/NutritionPage';
import TrophyPage from '../pages/TrophyPage';
import SettingsPage from '../pages/SettingsPage';

export default function NavigatePage({ page, setPage }) {
    
    // Main Pages
    const navigateToSignUp = () => setPage('signup');
    
    const navigateToSignIn = () => {
        auth().signOut();
        setPage('signin');
    };

    const navigateToLanding = () => setPage('landing');
    const navigateToFitness = () => setPage('fitness');
    const navigateToNutrition = () => setPage('nutrition');
    const navigateToTrophy = () => setPage('trophy');
    const navigateToSettings = () => setPage('settings');

    // Switch Pages
    switch (page) {
        case 'signup':
            return <>
                <SignupPage
                    onNavigateToSignIn={navigateToSignIn}
                    onNavigateToLanding={navigateToLanding}
                />
            </>;

        case 'landing':
            return <>
                <LandingPage
                    onNavigateToSignIn={navigateToSignIn}
                    onNavigateToNutrition={navigateToNutrition}
                    onNavigateToFitness={navigateToFitness}
                    onNavigateToTrophy={navigateToTrophy}
                    onNavigateToSettings={navigateToSettings}
                />
            </>;

        case 'fitness':
            return <FitnessPage onNavigateToLanding={navigateToLanding} />;

        case 'nutrition':
            return <NutritionPage onNavigateToLanding={navigateToLanding} />;

        case 'trophy':
            return <TrophyPage onNavigateToLanding={navigateToLanding} />;

        case 'settings':
            return <SettingsPage onNavigateToLanding={navigateToLanding} />;

        default:
            return <>
                <SigninPage
                    onNavigateToSignUp={navigateToSignUp}
                    onNavigateToLanding={navigateToLanding}
                />
            </>;    
    }
}
