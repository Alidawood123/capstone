import React, { useState, useRef, useEffect } from 'react';
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
<<<<<<< Updated upstream
=======
    Modal,
    Animated,
    Dimensions,
>>>>>>> Stashed changes
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithCredential,
    GoogleAuthProvider,
    FacebookAuthProvider,
    AppleAuthProvider,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { appleAuth } from '@invertase/react-native-apple-authentication';

import Toast from 'react-native-toast-message';

const BLUE      = '#00b4d8';
const BLUE_MID  = '#0099bb';
const BLUE_DEEP = '#007a99';
const TEAL_SOFT = '#e0f7fc';

export default function SignupPage({ onNavigateToSignIn, onNavigateToFitness }) {
    const auth = getAuth();

    const [name, setName]                           = useState('');
    const [email, setEmail]                         = useState('');
    const [password, setPassword]                   = useState('');
    const [confirmPassword, setConfirmPassword]     = useState('');
    const [showPassword, setShowPassword]           = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading]                 = useState(false);
    const [nameFocused, setNameFocused]             = useState(false);
    const [emailFocused, setEmailFocused]           = useState(false);
    const [passwordFocused, setPasswordFocused]     = useState(false);
    const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    // ── Entrance animations ──
    const bgAnim     = useRef(new Animated.Value(0)).current;
    const logoAnim   = useRef(new Animated.Value(0)).current;
    const cardAnim   = useRef(new Animated.Value(0)).current;
    const footerAnim = useRef(new Animated.Value(0)).current;

    // ── Input glow anims ──
    const nameGlow    = useRef(new Animated.Value(0)).current;
    const emailGlow   = useRef(new Animated.Value(0)).current;
    const pwGlow      = useRef(new Animated.Value(0)).current;
    const confirmGlow = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(bgAnim,     { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(logoAnim,   { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
            Animated.spring(cardAnim,   { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
            Animated.timing(footerAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();
    }, []);

    const focusGlow = (anim, on) =>
        Animated.timing(anim, { toValue: on ? 1 : 0, duration: 200, useNativeDriver: false }).start();

    // ── Auth handlers (logic unchanged) ──────────────────────────────────────

    // Handler for sign-up button press
    // Simulates an API call with a 2-second delay, then navigates to landing page
    const handleSignUp = () => {
        setIsLoading(true);
<<<<<<< Updated upstream
        // Simulate API call
        setTimeout(() => {
=======
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken();
            await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/create-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ fullName: name, email }),
            });
            Toast.show({ type: 'success', text1: 'Account created successfully!' });
            if (onNavigateToFitness) onNavigateToFitness();
        } catch (error) {
            if (auth.currentUser) auth.signOut();
            console.error('Error during sign up:', error.code, error.message);
            if (error.code === 'auth/weak-password') {
                setPasswordModalVisible(true);
            } else {
                Toast.show({ type: 'error', text1: 'Sign up failed', text2: error.message });
            }
        } finally {
>>>>>>> Stashed changes
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

            // Navigate to fitness page after successful sign-up
            if (onNavigateToFitness) {
                onNavigateToFitness();
            }
        }, 2000);
    };

    const handleGoogleSignUp = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const signInResult = await GoogleSignin.signIn();
            let idToken = signInResult.data?.idToken;
            if (!idToken) idToken = signInResult.idToken;
            if (!idToken) throw new Error('No ID token returned from Google Sign-In');
            const googleCredential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, googleCredential);
            const user = auth.currentUser;
            if (user) {
<<<<<<< Updated upstream
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


            if (onNavigateToFitness) {
                onNavigateToFitness();
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
=======
                const token = await user.getIdToken();
                await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/create-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ fullName: user.displayName || '', email: user.email }),
                });
            }
            if (onNavigateToFitness) onNavigateToFitness();
        } catch (error) {
            if (auth.currentUser) auth.signOut();
            Toast.show({ type: 'error', text1: 'Google sign-in failed', text2: error.message });
>>>>>>> Stashed changes
        }
    };

    const handleFacebookSignUp = async () => {
        try {
            const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
            if (result.isCancelled) throw new Error('User cancelled the login process');
            const data = await AccessToken.getCurrentAccessToken();
            if (!data) throw new Error('Something went wrong obtaining access token');
            const facebookCredential = FacebookAuthProvider.credential(data.accessToken);
            await signInWithCredential(auth, facebookCredential);
            const user = auth.currentUser;
            if (user) {
<<<<<<< Updated upstream
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

            if (onNavigateToFitness) {
                onNavigateToFitness();
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
=======
                const token = await user.getIdToken();
                await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/create-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ fullName: user.displayName || '', email: user.email }),
                });
            }
            if (onNavigateToFitness) onNavigateToFitness();
        } catch (error) {
            if (auth.currentUser) auth.signOut();
            Toast.show({ type: 'error', text1: 'Facebook login failed', text2: error.message });
>>>>>>> Stashed changes
        }
    };

    const handleAppleSignUp = async () => {
        try {
            if (!appleAuth.isSupported) throw new Error('Apple Sign Up is not supported on this device');
            const appleAuthRequestResponse = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });
            const { identityToken, nonce } = appleAuthRequestResponse;
            if (!identityToken) throw new Error('Apple Sign-In failed - no identity token returned');
            const appleCredential = AppleAuthProvider.credential(identityToken, nonce);
            await signInWithCredential(auth, appleCredential);
            const user = auth.currentUser;
            if (user) {
<<<<<<< Updated upstream
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

            console.log('Signed in with Apple credential!');
            if (onNavigateToFitness) {
                onNavigateToFitness();
            }
        }
        catch (error) {
            console.error('Error during Apple sign-in:', error);
            Toast.show({
                type: 'error',
                text1: 'Apple sign-in failed',
                text2: error.message,
            });
=======
                const token = await user.getIdToken();
                await fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/create-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ fullName: user.displayName || '', email: user.email }),
                });
            }
            if (onNavigateToFitness) onNavigateToFitness();
        } catch (error) {
            if (auth.currentUser) auth.signOut();
            Toast.show({ type: 'error', text1: 'Apple sign-in failed', text2: error.message });
>>>>>>> Stashed changes
        }
    };

<<<<<<< Updated upstream
    // Validates email format - checks for @ and . characters
    const isValidEmail = email.includes('@') && email.includes('.');
    // Checks if passwords match
=======
    // ── Derived values ────────────────────────────────────────────────────────

    const passwordRequirements = [
        { label: 'At least 6 characters',         met: password.length >= 6 },
        { label: 'At least one uppercase letter',  met: /[A-Z]/.test(password) },
        { label: 'At least one lowercase letter',  met: /[a-z]/.test(password) },
        { label: 'At least one number',            met: /[0-9]/.test(password) },
        { label: 'At least one special character', met: /[^A-Za-z0-9]/.test(password) },
    ];
    const unmetRequirements = passwordRequirements.filter(r => !r.met);

    const isValidEmail   = email.includes('@') && email.includes('.');
>>>>>>> Stashed changes
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
    const isFormValid    = name.trim().length > 0 && isValidEmail && unmetRequirements.length === 0 && passwordsMatch;

    // Animated border/bg helpers
    const mkBorder = (anim) => anim.interpolate({ inputRange: [0,1], outputRange: ['#dde1e7', BLUE] });
    const mkBg     = (anim) => anim.interpolate({ inputRange: [0,1], outputRange: ['#f4f6f8', TEAL_SOFT] });

    const logoEntrance = {
        opacity:   logoAnim,
        transform: [
            { scale:      logoAnim.interpolate({ inputRange: [0,1], outputRange: [0.7, 1] }) },
            { translateY: logoAnim.interpolate({ inputRange: [0,1], outputRange: [-20, 0] }) },
        ],
    };
    const cardEntrance = {
        opacity:   cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0,1], outputRange: [40, 0] }) }],
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
<<<<<<< Updated upstream
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
                                <TouchableOpacity style={styles.socialButton} onPress={handleAppleSignUp}>
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
=======

            {/* Full-bleed gradient */}
            <LinearGradient
                colors={[BLUE, BLUE_MID, BLUE_DEEP]}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
            />

            {/* Depth bubbles */}
            <View style={[styles.bubble, styles.bubbleLg]} />
            <View style={[styles.bubble, styles.bubbleMd]} />
            <View style={[styles.bubble, styles.bubbleSm]} />

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo block */}
                    <Animated.View style={[styles.logoBlock, logoEntrance]}>
                        <View style={styles.logoRingOuter}>
                            <View style={styles.logoRingInner}>
                                <Ionicons name="person-add-outline" size={32} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.appName}>Create Account</Text>
                        <Text style={styles.appSub}>Start your fitness journey today</Text>
                    </Animated.View>

                    {/* Card */}
                    <Animated.View style={[styles.card, cardEntrance]}>

                        <LinearGradient
                            colors={[BLUE, BLUE_MID]}
                            style={styles.cardAccentBar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />

                        <View style={styles.cardBody}>

                            {/* Name */}
                            <Text style={styles.fieldLabel}>Full Name</Text>
                            <Animated.View style={[styles.inputWrapper, { borderColor: mkBorder(nameGlow), backgroundColor: mkBg(nameGlow) }]}>
                                <Ionicons name="person-outline" size={19} color={nameFocused ? BLUE : '#a0aab4'} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your name"
                                    placeholderTextColor="#b0bac4"
                                    value={name}
                                    onChangeText={setName}
                                    maxLength={50}
                                    autoCapitalize="words"
                                    onFocus={() => { setNameFocused(true);  focusGlow(nameGlow, true); }}
                                    onBlur={()  => { setNameFocused(false); focusGlow(nameGlow, false); }}
                                />
                            </Animated.View>

                            {/* Email */}
                            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Email</Text>
                            <Animated.View style={[styles.inputWrapper, { borderColor: mkBorder(emailGlow), backgroundColor: mkBg(emailGlow) }]}>
                                <Ionicons name="mail-outline" size={19} color={emailFocused ? BLUE : '#a0aab4'} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#b0bac4"
                                    value={email}
                                    onChangeText={setEmail}
                                    maxLength={50}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onFocus={() => { setEmailFocused(true);  focusGlow(emailGlow, true); }}
                                    onBlur={()  => { setEmailFocused(false); focusGlow(emailGlow, false); }}
                                />
                                {email.length > 0 && (
                                    <Ionicons
                                        name={isValidEmail ? 'checkmark-circle' : 'close-circle'}
                                        size={19}
                                        color={isValidEmail ? '#22c55e' : '#ef4444'}
                                    />
                                )}
                            </Animated.View>

                            {/* Password */}
                            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
                            <Animated.View style={[styles.inputWrapper, { borderColor: mkBorder(pwGlow), backgroundColor: mkBg(pwGlow) }]}>
                                <Ionicons name="lock-closed-outline" size={19} color={passwordFocused ? BLUE : '#a0aab4'} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#b0bac4"
                                    value={password}
                                    onChangeText={setPassword}
                                    maxLength={128}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => { setPasswordFocused(true);  focusGlow(pwGlow, true); }}
                                    onBlur={()  => { setPasswordFocused(false); focusGlow(pwGlow, false); }}
                                />
                                <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={10}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color="#a0aab4" />
                                </Pressable>
                            </Animated.View>

                            {/* Password strength pills */}
                            {password.length > 0 && (
                                <View style={styles.strengthRow}>
                                    {passwordRequirements.map((r, i) => (
                                        <View key={i} style={[styles.strengthPill, r.met && styles.strengthPillMet]} />
                                    ))}
                                </View>
                            )}

                            {/* Confirm Password */}
                            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Confirm Password</Text>
                            <Animated.View style={[styles.inputWrapper, { borderColor: mkBorder(confirmGlow), backgroundColor: mkBg(confirmGlow) }]}>
                                <Ionicons name="shield-checkmark-outline" size={19} color={confirmPasswordFocused ? BLUE : '#a0aab4'} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#b0bac4"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    maxLength={128}
                                    secureTextEntry={!showConfirmPassword}
                                    onFocus={() => { setConfirmPasswordFocused(true);  focusGlow(confirmGlow, true); }}
                                    onBlur={()  => { setConfirmPasswordFocused(false); focusGlow(confirmGlow, false); }}
                                />
                                <Pressable onPress={() => setShowConfirmPassword(v => !v)} hitSlop={10}>
                                    <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={19} color="#a0aab4" />
                                </Pressable>
                                {confirmPassword.length > 0 && (
                                    <Ionicons
                                        name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                                        size={19}
                                        color={passwordsMatch ? '#22c55e' : '#ef4444'}
                                        style={{ marginLeft: 6 }}
                                    />
                                )}
                            </Animated.View>

                            {/* CTA */}
                            <TouchableOpacity
                                onPress={handleSignUp}
                                disabled={isLoading}
                                activeOpacity={0.88}
                                style={[styles.ctaOuter, !isFormValid && styles.ctaDisabled]}
                            >
                                <LinearGradient
                                    colors={[BLUE, BLUE_DEEP]}
                                    style={styles.ctaGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <View style={styles.ctaRow}>
                                            <ActivityIndicator color="#fff" size="small" />
                                            <Text style={styles.ctaText}>Creating account…</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.ctaRow}>
                                            <Text style={styles.ctaText}>Create Account</Text>
                                            <View style={styles.ctaArrow}>
                                                <Ionicons name="arrow-forward" size={17} color="#fff" />
                                            </View>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.divRow}>
                                <View style={styles.divLine} />
                                <Text style={styles.divText}>or sign up with</Text>
                                <View style={styles.divLine} />
                            </View>

                            {/* Social */}
                            <View style={styles.socialRow}>
                                <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignUp} activeOpacity={0.78}>
                                    <Ionicons name="logo-google" size={21} color="#DB4437" />
                                    <Text style={styles.socialLabel}>Google</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialBtn} onPress={handleAppleSignUp} activeOpacity={0.78}>
                                    <Ionicons name="logo-apple" size={21} color="#111" />
                                    <Text style={styles.socialLabel}>Apple</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialBtn} onPress={handleFacebookSignUp} activeOpacity={0.78}>
                                    <Ionicons name="logo-facebook" size={21} color="#4267B2" />
                                    <Text style={styles.socialLabel}>Facebook</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </Animated.View>

                    {/* Footer */}
                    <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={onNavigateToSignIn} activeOpacity={0.75}>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </TouchableOpacity>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Password requirements modal (logic unchanged) */}
            <Modal
                visible={passwordModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPasswordModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="alert-circle" size={24} color="#ef4444" />
                            <Text style={styles.modalTitle}>Password Requirements</Text>
                        </View>
                        <Text style={styles.modalSubtitle}>Your password must include:</Text>
                        {passwordRequirements.map((req, i) => (
                            <View key={i} style={styles.requirementRow}>
                                <Ionicons
                                    name={req.met ? 'checkmark-circle' : 'close-circle'}
                                    size={20}
                                    color={req.met ? '#22c55e' : '#ef4444'}
                                />
                                <Text style={[styles.requirementText, req.met && styles.requirementMet]}>
                                    {req.label}
                                </Text>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setPasswordModalVisible(false)}>
                            <Text style={styles.modalCloseText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
>>>>>>> Stashed changes
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

    // Depth bubbles
    bubble: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)' },
    bubbleLg: { width: 320, height: 320, top: -80,   right: -100 },
    bubbleMd: { width: 180, height: 180, top: 160,   left: -60   },
    bubbleSm: { width: 110, height: 110, bottom: 180, right: -20  },

    // Logo block
    logoBlock:     { alignItems: 'center', marginBottom: 28 },
    logoRingOuter: {
        width: 96, height: 96, borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18, shadowRadius: 16, elevation: 10,
    },
<<<<<<< Updated upstream
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
=======
    logoRingInner: {
        width: 72, height: 72, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.28)',
        justifyContent: 'center', alignItems: 'center',
>>>>>>> Stashed changes
    },
    appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
    appSub:  { fontSize: 14, color: 'rgba(255,255,255,0.72)', letterSpacing: 0.1 },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#006080',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
        elevation: 14,
        marginBottom: 22,
    },
    cardAccentBar: { height: 5, width: '100%' },
    cardBody:      { padding: 24 },

    // Field labels
    fieldLabel: {
        fontSize: 12, fontWeight: '700', color: '#6b7280',
        letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
    },

    // Inputs
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 14, paddingHorizontal: 14,
        borderWidth: 1.5, height: 54,
    },
    inputIcon: { marginRight: 10 },
    input:     { flex: 1, fontSize: 15, color: '#111827' },

    // Password strength
    strengthRow: { flexDirection: 'row', gap: 6, marginBottom: 4, marginTop: 8 },
    strengthPill: {
        flex: 1, height: 4, borderRadius: 2,
        backgroundColor: '#e5e7eb',
    },
<<<<<<< Updated upstream
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
=======
    strengthPillMet: { backgroundColor: '#22c55e' },

    // CTA button
    ctaOuter: {
        borderRadius: 15, overflow: 'hidden',
        marginTop: 22, marginBottom: 24,
        shadowColor: BLUE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.38, shadowRadius: 14, elevation: 8,
    },
    ctaDisabled:  { opacity: 0.55 },
    ctaGradient:  { paddingVertical: 17, alignItems: 'center' },
    ctaRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ctaText:      { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
    ctaArrow:     { backgroundColor: 'rgba(255,255,255,0.24)', borderRadius: 20, padding: 5 },

    // Divider
    divRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    divLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
    divText: { color: '#9ca3af', paddingHorizontal: 12, fontSize: 12, fontWeight: '600' },

    // Social
    socialRow: { flexDirection: 'row', gap: 10 },
    socialBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 7,
        height: 48, borderRadius: 13,
        backgroundColor: '#f4f6f8',
        borderWidth: 1.5, borderColor: '#e5e7eb',
    },
    socialLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

    // Footer
    footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: 'rgba(255,255,255,0.72)', fontSize: 14 },
    footerLink: { color: '#fff', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
    },
    modalHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    modalTitle:    { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
    modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
    requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    requirementText: { fontSize: 14, color: '#ef4444' },
    requirementMet:  { color: '#22c55e' },
    modalCloseButton: {
        marginTop: 16, backgroundColor: BLUE,
        borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    },
    modalCloseText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
>>>>>>> Stashed changes
