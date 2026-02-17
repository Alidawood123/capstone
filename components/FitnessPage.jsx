import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    TouchableOpacity,
    Text,
    Image,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FitnessHomeContent from './fitness/FitnessHomeContent';
import FitnessTemplatesContent from './fitness/FitnessTemplatesContent';
import FitnessHistoryContent from './fitness/FitnessHistoryContent';
import FitnessAnalyticsContent from './fitness/FitnessAnalyticsContent';
import FitnessProfileContent from './fitness/FitnessProfileContent';
import EmptyWorkoutContent from './fitness/EmptyWorkoutContent';

const BLUE = '#00b4d8';
const GRAY = '#9ca3af';

export default function FitnessPage({ onNavigateToLanding }) {
    const [activeTab, setActiveTab] = useState('home');
    const [fitnessScreen, setFitnessScreen] = useState('tabs'); // 'tabs' | 'emptyworkout'
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={BLUE} />
            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                {/* Blue header: logo left, title center (home only), back right (home only) */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Image
                            source={require('../assets/logo.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                    </View>
                    {fitnessScreen === 'emptyworkout' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                Empty Workout
                            </Text>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setFitnessScreen('tabs')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : activeTab === 'home' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                welcome back!
                            </Text>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={onNavigateToLanding}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.headerSpacer} />
                    )}
                </View>

                {/* Main content - white area, routes by tab or empty workout */}
                <View style={styles.content}>
                    {fitnessScreen === 'emptyworkout' ? (
                        <EmptyWorkoutContent
                                onAddExercises={() => {}}
                                onCancelWorkout={() => setFitnessScreen('tabs')}
                            />
                    ) : (
                        <>
                            {activeTab === 'home' && (
                                <FitnessHomeContent onStartEmptyWorkout={() => setFitnessScreen('emptyworkout')} />
                            )}
                            {activeTab === 'templates' && <FitnessTemplatesContent />}
                            {activeTab === 'history' && <FitnessHistoryContent />}
                            {activeTab === 'analytics' && <FitnessAnalyticsContent />}
                            {activeTab === 'profile' && <FitnessProfileContent />}
                        </>
                    )}
                </View>

                {/* Bottom navigation bar - hide when on empty workout */}
                {fitnessScreen === 'tabs' && (
                <View style={[styles.bottomNav, { paddingBottom: 12 + Math.max(insets.bottom, 12) }]}>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('home')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="home"
                            size={24}
                            color={activeTab === 'home' ? BLUE : GRAY}
                        />
                        <Text
                            style={[
                                styles.navLabel,
                                activeTab === 'home' && styles.navLabelActive,
                            ]}
                        >
                            Home
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('templates')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="barbell-outline"
                            size={24}
                            color={activeTab === 'templates' ? BLUE : GRAY}
                        />
                        <Text
                            style={[
                                styles.navLabel,
                                activeTab === 'templates' && styles.navLabelActive,
                            ]}
                        >
                            Templates
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('history')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="trending-up-outline"
                            size={24}
                            color={activeTab === 'history' ? BLUE : GRAY}
                        />
                        <Text
                            style={[
                                styles.navLabel,
                                activeTab === 'history' && styles.navLabelActive,
                            ]}
                        >
                            History
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('analytics')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="bar-chart-outline"
                            size={24}
                            color={activeTab === 'analytics' ? BLUE : GRAY}
                        />
                        <Text
                            style={[
                                styles.navLabel,
                                activeTab === 'analytics' && styles.navLabelActive,
                            ]}
                        >
                            Analytics
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => setActiveTab('profile')}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="person-outline"
                            size={24}
                            color={activeTab === 'profile' ? BLUE : GRAY}
                        />
                        <Text
                            style={[
                                styles.navLabel,
                                activeTab === 'profile' && styles.navLabelActive,
                            ]}
                        >
                            profile
                        </Text>
                    </TouchableOpacity>
                </View>
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
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingTop: 12,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    navLabel: {
        fontSize: 11,
        color: GRAY,
        marginTop: 6,
    },
    navLabelActive: {
        color: BLUE,
        fontWeight: '600',
    },
});
