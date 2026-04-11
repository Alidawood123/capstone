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
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { 
    getAuth, 
    sendPasswordResetEmail
} from '@react-native-firebase/auth';

import Toast from 'react-native-toast-message';

// SigninPage Component - A modern login screen with email/password authentication
// Features: email validation, password visibility toggle, loading state, social login buttons
export default function SigninPage({ onNavigateToSignIn }) {
    const auth = getAuth();

    // State for form inputs
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // UI state for enhanced user experience
    const [emailFocused, setEmailFocused] = useState(false); // Tracks if email input is focused for styling

    // Handler for sign-in button press
    // Immediately navigates to landing page (authentication disabled for testing)
    const handleSendPasswordReset = async () => {
        if (email.trim() === '') {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your email.' });
            return;
        }

        if (!isValidEmail) {
            Toast.show({ type: 'error', text1: 'Invalid Email', text2: 'Please enter a valid email address.' });
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Toast.show({ type: 'success', text1: 'Success', text2: 'Password reset email sent. Please check your inbox.' });
            onNavigateToSignIn();
        } catch (error) {
            console.error('Password reset error:', error);
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to send password reset email. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Validates email format - checks for @ and . characters
    const isValidEmail = email.includes('@') && email.includes('.');
    // Allow sign-in without validation for testing - always enable button
    const isFormValid = true;

    return (
        <View style={styles.root}>
            {/* Content overlay */}
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.innerContainer}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    {/* Main header text */}
                    <Text style={styles.mainHeading}>Forgotten your password?</Text>

                    {/* Card Container - White card that holds all form elements */}
                    <View style={styles.card}>
                        {/* Email Input Section */}
                        {/* The wrapper changes color when focused for visual feedback */}
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
                                maxLength={50}
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

                        {/* Forgot Password Link */}
                        <TouchableOpacity style={styles.rememberPassword} onPress={onNavigateToSignIn}>
                            <Text style={styles.rememberPasswordText}>Remember Your Password?</Text>
                        </TouchableOpacity>

                        {/* Sign In Button - Disabled until form is valid */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.forgotButton,
                                    !isFormValid && styles.forgotButtonDisabled
                                ]}
                                onPress={handleSendPasswordReset}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                {/* Gradient button background */}
                                <LinearGradient
                                    colors={isFormValid ? ['#2563eb', '#7c3aed'] : ['#d1d5db', '#9ca3af']}
                                    style={styles.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {/* Show loading state (spinner + text) while signing in */}
                                    {isLoading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator color="#fff" size="small" />
                                            <Text style={styles.loadingText}>Sending reset link...</Text>
                                        </View>
                                    ) : (
                                        // Show button text with arrow icon when not loading
                                        <View style={styles.buttonContent}>
                                            <Text style={styles.forgotButtonText}>Send Reset Link</Text>
                                            <View style={styles.arrowContainer}>
                                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                                            </View>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// StyleSheet - Defines all styling for the sign-in page components
const styles = StyleSheet.create({
    // Root container
    root: {
        flex: 1,
    },
    // Full-screen container
    container: {
        flex: 1,
        backgroundColor: '#00b4d8',
    },
    // Inner container centered vertically with horizontal padding
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    // Logo container
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    // Logo image
    logo: {
        width: 80,
        height: 80,
    },
    // Main heading - Sign in to your account
    mainHeading: {
        fontSize: 22,
        fontWeight: '600',
        color: '#fff',
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
    // Remember password link container
    rememberPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    // Remember password link text color
    rememberPasswordText: {
        color: '#d00000',
        fontSize: 14,
        fontWeight: '600',
    },
    // Forgot password button container with shadow
    buttonContainer: {
        marginBottom: 20,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    // Forgot password button styling
    forgotButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    // Disabled button styling
    forgotButtonDisabled: {
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
    // Forgot password button text
    forgotButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
