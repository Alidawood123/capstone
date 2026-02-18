import React from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// LandingPage Component - The first page users see after logging in
export default function LandingPage({ onNavigateToSignIn, onNavigateToNutrition, onNavigateToFitness, onNavigateToTrophy, onNavigateToSettings }) {
    return (
        <View style={styles.root}>
            {/* 50/50 color split: red left, blue right */}
            <View style={styles.colorSplit}>
                <View style={styles.colorLeft} />
                <View style={styles.colorRight} />
            </View>

            <View style={styles.container}>
                {/* Back button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={onNavigateToSignIn}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>

                {/* Nutrition button: 25% from top on red side */}
                <View style={styles.leftHalf}>
                    <TouchableOpacity
                        style={styles.nutritionButton}
                        activeOpacity={0.85}
                        onPress={onNavigateToNutrition}
                    >
                        <Ionicons name="nutrition-outline" size={32} color="#d00000" />
                        <Text style={styles.nutritionButtonLabel}>Nutrition</Text>
                    </TouchableOpacity>
                </View>
                {/* Fitness button: 25% from bottom on blue side */}
                <View style={styles.rightHalf}>
                    <TouchableOpacity
                        style={styles.fitnessButton}
                        activeOpacity={0.85}
                        onPress={onNavigateToFitness}
                    >
                        <Ionicons name="barbell-outline" size={32} color="#00b4d8" />
                        <Text style={styles.fitnessButtonLabel}>Fitness</Text>
                    </TouchableOpacity>
                </View>

                {/* Center: Trophy (above) -> Logo -> Settings (below) */}
                <View style={styles.centerBorderContainer} pointerEvents="box-none">
                    <View style={styles.centerColumn}>
                        <TouchableOpacity style={styles.centerIconButton} activeOpacity={0.8} onPress={onNavigateToTrophy}>
                            <Ionicons name="trophy" size={26} color="#fff" />
                        </TouchableOpacity>
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.centerLogo}
                            resizeMode="contain"
                        />
                        <TouchableOpacity style={styles.centerIconButton} activeOpacity={0.8} onPress={onNavigateToSettings}>
                            <Ionicons name="settings-outline" size={26} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

// StyleSheet - Defines all styling for the landing page components
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    colorSplit: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
    },
    colorLeft: {
        flex: 1,
        backgroundColor: '#d00000',
    },
    colorRight: {
        flex: 1,
        backgroundColor: '#00b4d8',
    },
    container: {
        flex: 1,
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
    // Left half (red): full height so button can sit at 25% from top
    leftHalf: {
        position: 'absolute',
        left: 0,
        width: '50%',
        top: 0,
        bottom: 0,
        alignItems: 'center',
    },
    // Right half (blue): full height so button can sit at 25% from bottom
    rightHalf: {
        position: 'absolute',
        right: 0,
        width: '50%',
        top: 0,
        bottom: 0,
        alignItems: 'center',
    },
    // Clean, modern Nutrition button (red side) — 25% from top
    nutritionButton: {
        position: 'absolute',
        top: '25%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 999,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    nutritionButtonLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#d00000',
        letterSpacing: 0.3,
    },
    // Clean, modern Fitness button (blue side) — 25% from bottom
    fitnessButton: {
        position: 'absolute',
        bottom: '25%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 28,
        borderRadius: 999,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    fitnessButtonLabel: {
        fontSize: 17,
        fontWeight: '600',
        color: '#00b4d8',
        letterSpacing: 0.3,
    },
    centerBorderContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    centerColumn: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
    },
    centerIconButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerLogo: {
        width: 88,
        height: 88,
    },
});
