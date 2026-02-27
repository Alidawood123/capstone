import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { getAuth, createUserWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, FacebookAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

import Toast from 'react-native-toast-message';

// SignupPage Component - A modern sign-up screen with email/password authentication
// Features: name, email validation, password visibility toggle, confirm password, loading state, social login buttons
export default function SignupPage({ onNavigateToSignIn, onNavigateToLanding }) {
    const auth = getAuth();

    // State for form inputs
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI state for enhanced user experience
    const [showPassword, setShowPassword] = useState(false); // Controls whether password is visible
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Controls whether confirm password is visible
    const [isLoading, setIsLoading] = useState(false); // Shows loading indicator while signing up
    const [nameFocused, setNameFocused] = useState(false); // Tracks if name input is focused for styling
    const [emailFocused, setEmailFocused] = useState(false); // Tracks if email input is focused for styling
    const [passwordFocused, setPasswordFocused] = useState(false); // Tracks if password input is focused for styling
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false); // Tracks if confirm password input is focused for styling

    // Handler for sign-up button press
    // Simulates an API call with a 2-second delay, then navigates to landing page
    const handleSignUp = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            console.log('Sign up with:', name, email, password);

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed in
                    const user = userCredential.user;
                    console.log('User account created & signed in!', user);

                    user.getIdToken().then((idToken) => {
                        fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/create-profile', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${idToken}`,
                            },
                            body: JSON.stringify({
                                fullName: name,
                                email: email
                            }),
                        })
                    })

                    Toast.show({
                        type: 'success',
                        text1: 'Account created successfully!',
                    });
                })
                .catch((error) => {
                    // Sign out in case of error in the backend profile creation
                    if(auth.currentUser) {
                        auth.signOut();
                    }

                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error('Error during sign up:', errorCode, errorMessage);
                    Toast.show({
                        type: 'error',
                        text1: 'Sign up failed',
                        text2: errorMessage,
                    });
                });

            // Navigate to landing page after successful sign-up
            if (onNavigateToLanding) {
                onNavigateToLanding();
            }
        }, 2000);
    };

    const handleGoogleSignUp = async () => {
        try {
            // Check if your device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            // Prompt the sign in pop-up
            const signInResult = await GoogleSignin.signIn();

            // Get the sign-in token of the pop-up
            let idToken = signInResult.data?.idToken;

            // Maybe the token was in an older format
            if(!idToken)
            {
                idToken = signInResult.idToken;
            }

            // If not then throw an error
            if(!idToken) {
                throw new Error('No ID token returned from Google Sign-In');
            }

            const googleCredential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, googleCredential);
            console.log('Signed in with Google credential!');

            const user = auth.currentUser;
            if (user) {
                user.getIdToken().then((idToken) => {
                    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/create-profile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                            fullName: user.displayName || '',
                            email: user.email
                        }),
                    })
                })
            }


            if (onNavigateToLanding) {
                onNavigateToLanding();
            }
        } catch (error) {
            // Sign out in case of error in the backend profile creation
            if(auth.currentUser) {
                auth.signOut();
            }

            console.error('Error during Google sign-in:', error);
            Toast.show({
                type: 'error',
                text1: 'Google sign-in failed',
                text2: error.message,
            });
        }
    }

    const handleFacebookSignUp = async () => {
        try{
            // Attempt login with permissions
            const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
            if (result.isCancelled) {
                throw new Error('User cancelled the login process');
            }

            // Once signed in, get the users AccessToken
            const data = await AccessToken.getCurrentAccessToken();

            if (!data) {
                throw new Error('Something went wrong obtaining access token');
            }

            // Create a Firebase credential with the AccessToken
            const facebookCredential = FacebookAuthProvider.credential(data.accessToken);

            // Sign-in the user with the credential
            await signInWithCredential(auth, facebookCredential);
            console.log('Signed in with Facebook credential!');

            const user = auth.currentUser;
            if (user) {
                user.getIdToken().then((idToken) => {
                    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/create-profile', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`,
                        },
                        body: JSON.stringify({
                            fullName: user.displayName || '',
                            email: user.email
                        }),
                    })
                })
            }

            if (onNavigateToLanding) {
                onNavigateToLanding();
            }
        }
        catch(error){
            // Sign out in case of error in the backend profile creation
            if(auth.currentUser) {
                auth.signOut();
            }

            console.error('Error during Facebook login:', error);
            Toast.show({
                type: 'error',
                text1: 'Facebook login failed',
                text2: error.message,
            });
            return;
        }
    }

    // Validates email format - checks for @ and . characters
    const isValidEmail = email.includes('@') && email.includes('.');
    // Checks if passwords match
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    // Enables sign-up button only if all fields are valid
    const isFormValid = name.length >= 2 && isValidEmail && password.length >= 6 && passwordsMatch;

    return (
        <View style={styles.root}>
            {/* 50/50 color split: red left, blue right */}
            <View style={styles.colorSplit}>
                <View style={styles.colorLeft} />
                <View style={styles.colorRight} />
            </View>
            {/* Content overlay */}
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.innerContainer}>
                        {/* Header text */}
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Sign up to get started</Text>

                        {/* Card Container - White card that holds all form elements */}
                        <View style={styles.card}>
                            {/* Name Input Section */}
                            <View style={[
                                styles.inputWrapper,
                                nameFocused && styles.inputWrapperFocused,
                            ]}>
                                {/* User icon */}
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={nameFocused ? '#00b4d8' : '#999'}
                                    style={styles.inputIcon}
                                />
                                {/* Name input field */}
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full name"
                                    placeholderTextColor="#999"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    onFocus={() => setNameFocused(true)}
                                    onBlur={() => setNameFocused(false)}
                                />
                                {/* Validation icon - shows checkmark for valid name */}
                                {name.length > 0 && (
                                    <Ionicons
                                        name={name.length >= 2 ? "checkmark-circle" : "close-circle"}
                                        size={20}
                                        color={name.length >= 2 ? '#4CAF50' : '#ff6b6b'}
                                    />
                                )}
                            </View>

                            {/* Email Input Section */}
                            <View style={[
                                styles.inputWrapper,
                                emailFocused && styles.inputWrapperFocused,
                            ]}>
                                {/* Mail icon that changes color when focused */}
                                <Ionicons
                                    name="mail-outline"
                                    size={20}
                                    color={emailFocused ? '#00b4d8' : '#999'}
                                    style={styles.inputIcon}
                                />
                                {/* Email input field */}
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email address"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                />
                                {/* Validation icon - shows checkmark for valid email, X for invalid */}
                                {email.length > 0 && (
                                    <Ionicons
                                        name={isValidEmail ? "checkmark-circle" : "close-circle"}
                                        size={20}
                                        color={isValidEmail ? '#4CAF50' : '#ff6b6b'}
                                    />
                                )}
                            </View>

                            {/* Password Input Section */}
                            <View style={[
                                styles.inputWrapper,
                                passwordFocused && styles.inputWrapperFocused,
                            ]}>
                                {/* Lock icon */}
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={passwordFocused ? '#00b4d8' : '#999'}
                                    style={styles.inputIcon}
                                />
                                {/* Password input field - text is hidden by default */}
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#999"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                />
                                {/* Eye icon button to toggle password visibility */}
                                <Pressable onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#999"
                                    />
                                </Pressable>
                            </View>

                            {/* Confirm Password Input Section */}
                            <View style={[
                                styles.inputWrapper,
                                confirmPasswordFocused && styles.inputWrapperFocused,
                            ]}>
                                {/* Lock icon */}
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={confirmPasswordFocused ? '#00b4d8' : '#999'}
                                    style={styles.inputIcon}
                                />
                                {/* Confirm password input field */}
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm password"
                                    placeholderTextColor="#999"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                    onFocus={() => setConfirmPasswordFocused(true)}
                                    onBlur={() => setConfirmPasswordFocused(false)}
                                />
                                {/* Eye icon button to toggle confirm password visibility */}
                                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color="#999"
                                    />
                                </Pressable>
                                {/* Validation icon - shows checkmark if passwords match */}
                                {confirmPassword.length > 0 && (
                                    <Ionicons
                                        name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                                        size={20}
                                        color={passwordsMatch ? '#4CAF50' : '#ff6b6b'}
                                    />
                                )}
                            </View>

                            {/* Sign Up Button - Disabled until form is valid */}
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.signUpButton,
                                        !isFormValid && styles.signUpButtonDisabled
                                    ]}
                                    onPress={handleSignUp}
                                    disabled={!isFormValid || isLoading}
                                    activeOpacity={0.8}
                                >
                                    {/* Gradient button background */}
                                    <LinearGradient
                                        colors={isFormValid ? ['#2563eb', '#7c3aed'] : ['#d1d5db', '#9ca3af']}
                                        style={styles.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {/* Show loading state (spinner + text) while signing up */}
                                        {isLoading ? (
                                            <View style={styles.loadingContainer}>
                                                <ActivityIndicator color="#fff" size="small" />
                                                <Text style={styles.loadingText}>Creating account...</Text>
                                            </View>
                                        ) : (
                                            // Show button text with arrow icon when not loading
                                            <View style={styles.buttonContent}>
                                                <Text style={styles.signUpButtonText}>Sign Up</Text>
                                                <View style={styles.arrowContainer}>
                                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                                </View>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>

                            {/* Divider Section - "or continue with" text */}
                            <View style={styles.dividerContainer}>
                                <View style={styles.divider} />
                                <Text style={styles.dividerText}>or continue with</Text>
                                <View style={styles.divider} />
                            </View>

                            {/* Social Login Buttons - Quick sign up with Google, Apple, and Facebook */}
                            <View style={styles.socialContainer}>
                                <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignUp}>
                                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton}>
                                    <Ionicons name="logo-apple" size={24} color="#000" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton} onPress={handleFacebookSignUp}>
                                    <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Sign In Link - For users who already have an account */}
                        <View style={styles.signInContainer}>
                            <Text style={styles.signInText}>Already have an account? </Text>
                            <TouchableOpacity onPress={onNavigateToSignIn}>
                                <Text style={styles.signInLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// StyleSheet - Defines all styling for the sign-up page components
const styles = StyleSheet.create({
    // Root container
    root: {
        flex: 1,
    },
    // 50/50 vertical color split background
    colorSplit: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
    },
    // Left half - red
    colorLeft: {
        flex: 1,
        backgroundColor: '#d00000',
    },
    // Right half - blue
    colorRight: {
        flex: 1,
        backgroundColor: '#00b4d8',
    },
    // Full-screen container
    container: {
        flex: 1,
    },
    // ScrollView content container
    scrollContent: {
        flexGrow: 1,
    },
    // Inner container centered vertically with horizontal padding
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    // Large welcome text
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    // Smaller subtitle text
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginBottom: 32,
    },
    // White card container with shadow
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(208, 0, 0, 0.25)',
    },
    // Input field container with icon and text input
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 180, 216, 0.2)',
    },
    // Input wrapper styling when focused
    inputWrapperFocused: {
        borderColor: 'rgba(208, 0, 0, 0.5)',
        backgroundColor: '#fff',
    },
    // Icon spacing inside inputs
    inputIcon: {
        marginRight: 12,
    },
    // Text input field itself
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#333',
    },
    // Sign-up button container with shadow
    buttonContainer: {
        marginTop: 8,
        marginBottom: 20,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    // Sign-up button styling
    signUpButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    // Disabled button styling
    signUpButtonDisabled: {
        opacity: 0.6,
    },
    // Gradient background inside button
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        position: 'relative',
    },
    // Button content layout (text and arrow)
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    // Loading state container (spinner and text)
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    // Loading text styling
    loadingText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    // Arrow icon inside button
    arrowContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 20,
        padding: 6,
    },
    // Sign-up button text
    signUpButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // Divider container with text in between
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    // Horizontal divider line
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0, 180, 216, 0.3)',
    },
    // Divider text
    dividerText: {
        color: 'rgba(0, 180, 216, 0.7)',
        paddingHorizontal: 16,
        fontSize: 14,
        fontWeight: '500',
    },
    // Social login buttons container
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    // Individual social login button
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 180, 216, 0.2)',
    },
    // Sign-in link container
    signInContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    // Sign-in text styling
    signInText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    // Sign-in link styling
    signInLink: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
