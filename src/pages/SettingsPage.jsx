import React from 'react';

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import backButtonStyle from '../styles/backButton'

// LandingPage Component - The first page users see after logging in
export default function SettingsPage({ onNavigateToLanding }) {
    return (
        <View>
            <Pressable onPress={onNavigateToLanding} style={backButtonStyle.backButton} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>

            <Text>Settings Page</Text>
        </View>
    );
}

// Local StyleSheet For FitnessPage 
const styles = StyleSheet.create({  });
