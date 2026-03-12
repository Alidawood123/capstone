import { getAuth } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';

import SigninPage from '../pages/Signinpage';
import SignupPage from '../pages/Signuppage';
import FitnessPage from '../pages/FitnessPage';

export default function NavigatePage({ currentPage, onNavigateToSignUp, onNavigateToSignIn, onNavigateToFitness }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsLoggedIn(!!user);
        });

        return () => unsubscribe();
    }, [auth]);

    if(!isLoggedIn)
    {
        // Switch Pages
        switch (currentPage) {
            case 'signup':
                return <>
                    <SignupPage
                        onNavigateToSignIn={onNavigateToSignIn}
                        onNavigateToFitness={onNavigateToFitness}
                    />
                </>;

            case 'fitness':
                return <FitnessPage onNavigateToSignIn={onNavigateToSignIn} />;

            default:
                return <>
                    <SigninPage
                        onNavigateToSignUp={onNavigateToSignUp}
                        onNavigateToFitness={onNavigateToFitness}
                    />
                </>;    
        }
    }
    else
    {
        return <FitnessPage onNavigateToSignIn={onNavigateToSignIn} />;
    }
}
