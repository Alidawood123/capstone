import React from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// LandingPage Component - The first page users see after logging in
export default function LandingPage({ onNavigateToSignIn }) {
    return (
        <LinearGradient
            colors={['#00b4d8', '#d00000']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={styles.container}>
                {/* Back button to navigate to sign-in page */}
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={onNavigateToSignIn}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                {/* Blank landing page - ready for content */}
            </View>
        </LinearGradient>
    );
}

// StyleSheet - Defines all styling for the landing page components
const styles = StyleSheet.create({
    // Main gradient background container
    gradient: {
        flex: 1,
    },
    // Full-screen container
    container: {
        flex: 1,
    },
    // Back button styling
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
});
