import React from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// LandingPage Component - The first page users see after logging in
export default function LandingPage({ onNavigateToSignIn, onNavigateToFitness, onNavigateToNutrition, onNavigateToTrophy }) {
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
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                {/* Blank landing page - ready for content */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 20, textAlign: 'center', color: 'white' }}>Choose your path to wellness</Text>

                    <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 16,}}>
                        <Pressable onPress={onNavigateToFitness} style={[styles.btnSel, { backgroundColor: '#2D5BFF' }]}>
                            <Ionicons name="barbell-outline" size={26} color="#acacac" />
                            <Text style={styles.btnSelTxt}>Fitness</Text>
                        </Pressable>

                        <Pressable onPress={onNavigateToNutrition} style={[styles.btnSel, { backgroundColor: '#2D5BFF' }]}>
                            <MaterialCommunityIcons name="food-apple-outline" size={26} color="#acacac" />
                            <Text style={styles.btnSelTxt}>Nutrition</Text>
                        </Pressable>
                    </View>
                </View>
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

    btnSel: {
        width: 200,
        height: 200,
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        marginHorizontal: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },


    btnSelTxt: {
        color: 'white',
        fontSize: 24,
        textAlign: 'center'
    },
});
