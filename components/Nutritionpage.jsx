import React from 'react';

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// LandingPage Component - The first page users see after logging in
export default function NutritionPage({ onNavigateToLanding }) {
    return (
        <View>
            <Pressable onPress={onNavigateToLanding} style={styles.backButton} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>

            <Text>Nutrition Page</Text>
        </View>
    );
}

// StyleSheet - Defines all styling for the landing page components
const styles = StyleSheet.create({    
    // Back button styling
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 0, 0, 0.3)',
    },
});
