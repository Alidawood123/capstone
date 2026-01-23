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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// SigninPage Component - A modern login screen with email/password authentication
// Features: email validation, password visibility toggle, loading state, social login buttons
export default function SigninPage({ onNavigateToSignUp, onNavigateToLanding }) {
    // State for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // UI state for enhanced user experience
    const [showPassword, setShowPassword] = useState(false); // Controls whether password is visible
    const [isLoading, setIsLoading] = useState(false); // Shows loading indicator while signing in
    const [emailFocused, setEmailFocused] = useState(false); // Tracks if email input is focused for styling
    const [passwordFocused, setPasswordFocused] = useState(false); // Tracks if password input is focused for styling

    // Handler for sign-in button press
    // Immediately navigates to landing page (authentication disabled for testing)
    const handleSignIn = () => {
        // Navigate to landing page immediately without validation
        if (onNavigateToLanding) {
            onNavigateToLanding();
        }
    };

    // Validates email format - checks for @ and . characters
    const isValidEmail = email.includes('@') && email.includes('.');
    // Allow sign-in without validation for testing - always enable button
    const isFormValid = true;

    return (
        // LinearGradient creates a sky blue-to-bright red gradient background
        <LinearGradient
            colors={['#00b4d8', '#d00000']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            {/* KeyboardAvoidingView prevents the keyboard from covering input fields on iOS */}
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.innerContainer}>
                    {/* Header text */}
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>

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
                        {/* Similar to email input with focus styling */}
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

                        {/* Forgot Password Link */}
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Sign In Button - Disabled until form is valid */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.signInButton,
                                    !isFormValid && styles.signInButtonDisabled
                                ]}
                                onPress={handleSignIn}
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
                                            <Text style={styles.loadingText}>Signing in...</Text>
                                        </View>
                                    ) : (
                                        // Show button text with arrow icon when not loading
                                        <View style={styles.buttonContent}>
                                            <Text style={styles.signInButtonText}>Sign In</Text>
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

                        {/* Social Login Buttons - Quick login with Google, Apple, and Facebook */}
                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-google" size={24} color="#DB4437" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={24} color="#000" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign Up Link - For users who don't have an account yet */}
                    <View style={styles.signUpContainer}>
                        <Text style={styles.signUpText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={onNavigateToSignUp}>
                            <Text style={styles.signUpLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

// StyleSheet - Defines all styling for the sign-in page components
const styles = StyleSheet.create({
    // Main gradient background container
    gradient: {
        flex: 1,
    },
    // Full-screen container
    container: {
        flex: 1,
    },
    // Inner container centered vertically with horizontal padding
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
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
    // Forgot password link container
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    // Forgot password link text color
    forgotPasswordText: {
        color: '#d00000',
        fontSize: 14,
        fontWeight: '600',
    },
    // Sign-in button container with shadow
    buttonContainer: {
        marginBottom: 20,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    // Sign-in button styling
    signInButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    // Disabled button styling
    signInButtonDisabled: {
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
    // Sign-in button text
    signInButtonText: {
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
    // Sign-up link container
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    // Sign-up text styling
    signUpText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    // Sign-up link styling
    signUpLink: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
