import React, { useState } from 'react';
import { StyleSheet, View, Pressable, Text, Image, StatusBar, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import FitnessHomeContent from './fitness-tabs/FitnessHomeContent';
import FitnessTemplatesContent from './fitness-tabs/FitnessTemplatesContent';
import FitnessHistoryContent from './fitness-tabs/FitnessHistoryContent';
import FitnessAnalyticsContent from './fitness-tabs/FitnessAnalyticsContent';
import FitnessProfileContent from './fitness-tabs/FitnessProfileContent';
import EmptyWorkoutContent from '../components/fitness/home/EmptyWorkoutContent';

import FitnessNavBar from '../components/fitness/FitnessNavigationBar';

const BLUE = '#00b4d8';
const GRAY = '#9ca3af';

export default function FitnessPage({ onNavigateToLanding }) {
    const [activeTab, setActiveTab] = useState('home');
    const [fitnessScreen, setFitnessScreen] = useState('tabs'); // 'tabs' | 'emptyworkout'
    const [historyTab, setHistoryTab] = useState('historyWorkout');
    const insets = useSafeAreaInsets();

    const toggleHistory = () => {
        if (historyTab == 'historyWorkout') setHistoryTab('historyCalendar');
        else setHistoryTab('historyWorkout');
    }

    


    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={BLUE} />
            
            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                {/* Blue header: logo left, title center (home only), back right (home only) */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Image source={require('../../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
                    </View>
                    {fitnessScreen === 'emptyworkout' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}> Empty Workout </Text>
                            <Pressable style={styles.backButton} onPress={() => setFitnessScreen('tabs')} activeOpacity={0.8}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </Pressable>
                        </>
                    ) : activeTab === 'home' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}> welcome back! </Text>
                            <Pressable style={styles.backButton} onPress={onNavigateToLanding} activeOpacity={0.8}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </Pressable>
                        </>
                    ) : activeTab === 'history' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}> History </Text>
                            <Pressable style={styles.backButton} onPress={toggleHistory} activeOpacity={0.8}>
                                <Ionicons name="calendar-outline" size={24} color="#fff" />
                            </Pressable>
                        </>
                    ) : (
                        <View style={styles.headerSpacer} />
                    )}
                </View>

                {/* Main content - white area, routes by tab or empty workout */}
                <View style={styles.content}>
                    {fitnessScreen === 'emptyworkout' ? (
                        <EmptyWorkoutContent onAddExercises={() => {}} onCancelWorkout={() => setFitnessScreen('tabs')} />
                    ) : (
                        <>
                            {activeTab === 'home' && (
                                <FitnessHomeContent onStartEmptyWorkout={() => setFitnessScreen('emptyworkout')} />
                            )}
                            {activeTab === 'templates' && <FitnessTemplatesContent />}
                            {activeTab === 'history' && <FitnessHistoryContent historyTab={historyTab} />}
                            {activeTab === 'analytics' && <FitnessAnalyticsContent />}
                            {activeTab === 'profile' && <FitnessProfileContent />}
                        </>
                    )}
                </View>

                {/* Bottom navigation bar - hide when on empty workout */}
                
                {fitnessScreen === 'tabs' && ( 
                    <FitnessNavBar activeTab={activeTab} setActiveTab={setActiveTab} /> 
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
        backgroundColor: BLUE,
    },
    header: {
        backgroundColor: BLUE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    headerLeft: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerLogo: {
        width: 50,
        height: 50,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSpacer: {
        flex: 1,
    },
    content: {
        flex: 1,
        minHeight: 0,
        backgroundColor: '#fff',
    },
});