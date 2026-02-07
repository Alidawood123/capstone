import Toast from 'react-native-toast-message';
import auth from '@react-native-firebase/auth';

import SigninPage from '../pages/auth/Signinpage';
import SignupPage from '../pages/auth/Signuppage';
import LandingPage from '../pages/start/Landingpage';
import FitnessPage from '../pages/fitness/Fitnesspage';
import NutritionPage from '../pages/nutrition/Nutritionpage';
import TrophyPage from '../pages/trophy/Trophypage';

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
    const navigateToTrophy = () => setCurrentPage('trophy');


    // Fitness Sub-Pages 


    // Nutritions Sub-Pages 


    // Switch Pages
    switch (page) {
        case 'signup':
            return <>
                <SignupPage
                    onNavigateToSignIn={navigateToSignIn}
                    onNavigateToLanding={navigateToLanding}
                />
                <Toast />
            </>;

        case 'landing':
            return <>
                <LandingPage 
                    onNavigateToSignIn={navigateToSignIn} 
                    onNavigateToFitness={navigateToFitness}
                    onNavigateToNutrition={navigateToNutrition}
                    onNavigateToTrophy={navigateToTrophy}
                />
                <Toast />
            </>;

        case 'fitness':
            return <FitnessPage onNavigateToLanding={navigateToLanding} />;

        case 'nutrition':
            return <NutritionPage onNavigateToLanding={navigateToLanding} />;

        case 'trophy':
            return <TrophyPage onNavigateToLanding={navigateToLanding} />;

        default:
            return <>
                <SigninPage
                    onNavigateToSignUp={navigateToSignUp}
                    onNavigateToLanding={navigateToLanding}
                />
                <Toast />
            </>;    
    }
}
