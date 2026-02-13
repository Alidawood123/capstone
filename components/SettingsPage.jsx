import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsPage({ onNavigateToLanding }) {
    return (
        <View style={styles.root}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={onNavigateToLanding}
                activeOpacity={0.8}
            >
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#2d2d2d',
    },
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
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
    },
});
