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
import FitnessHomeContent from './fitness-tabs/FitnessHomeContent';
import FitnessTemplatesContent from './fitness-tabs/FitnessTemplatesContent';
import FitnessHistoryContent from './fitness-tabs/FitnessHistoryContent';
import FitnessAnalyticsContent from './fitness-tabs/FitnessAnalyticsContent';
import FitnessProfileContent from './fitness-tabs/FitnessProfileContent';
import EmptyWorkoutContent from '../components/fitness/home/EmptyWorkoutContent';
import FitnessNavigationBar from '../components/fitness/FitnessNavigationBar';
import { addTemplate } from '../services/templateStorage';

const BLUE = '#00b4d8';

export default function FitnessPage({ onNavigateToLanding }) {
    const [activeTab, setActiveTab] = useState('home');
    const [fitnessScreen, setFitnessScreen] = useState('tabs');
    const [workoutInitialData, setWorkoutInitialData] = useState(null);
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor={BLUE} />
            <View style={[styles.safeArea, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Image
                            source={require('../../assets/logo.png')}
                            style={styles.headerLogo}
                            resizeMode="contain"
                        />
                    </View>
                    {fitnessScreen === 'emptyworkout' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}>Empty Workout</Text>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => { setFitnessScreen('tabs'); setWorkoutInitialData(null); }}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : fitnessScreen === 'createtemplate' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}>Create template</Text>
                            <TouchableOpacity style={styles.backButton} onPress={() => setFitnessScreen('tabs')} activeOpacity={0.8}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : activeTab === 'home' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}>welcome back!</Text>
                            <TouchableOpacity style={styles.backButton} onPress={onNavigateToLanding} activeOpacity={0.8}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : activeTab === 'templates' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}>Templates</Text>
                            <TouchableOpacity style={styles.backButton} onPress={() => setFitnessScreen('createtemplate')} activeOpacity={0.8}>
                                <Ionicons name="add" size={28} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.headerSpacer} />
                    )}
                </View>

                <View style={styles.content}>
                    {fitnessScreen === 'emptyworkout' ? (
                        <EmptyWorkoutContent
                            onAddExercises={() => {}}
                            onCancelWorkout={() => { setFitnessScreen('tabs'); setWorkoutInitialData(null); }}
                            initialTitle={workoutInitialData?.title}
                            initialExercises={workoutInitialData?.exercises}
                        />
                    ) : fitnessScreen === 'createtemplate' ? (
                        <EmptyWorkoutContent
                            mode="template"
                            onAddExercises={() => {}}
                            onCancelWorkout={() => setFitnessScreen('tabs')}
                            onSaveTemplate={async (t) => {
                                await addTemplate(t);
                                setFitnessScreen('tabs');
                                setActiveTab('templates');
                            }}
                        />
                    ) : (
                        <>
                            {activeTab === 'home' && <FitnessHomeContent onStartEmptyWorkout={() => setFitnessScreen('emptyworkout')} />}
                            {activeTab === 'templates' && (
                                <FitnessTemplatesContent
                                    onUseTemplate={(template) => {
                                        setWorkoutInitialData({
                                            title: template.title || 'Untitled Workout',
                                            exercises: template.exercises || [],
                                        });
                                        setFitnessScreen('emptyworkout');
                                    }}
                                />
                            )}
                            {activeTab === 'history' && <FitnessHistoryContent />}
                            {activeTab === 'analytics' && <FitnessAnalyticsContent />}
                            {activeTab === 'profile' && <FitnessProfileContent />}
                        </>
                    )}
                </View>

                {fitnessScreen === 'tabs' && (
                    <FitnessNavigationBar activeTab={activeTab} onTabChange={setActiveTab} insets={insets} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#fff' },
    safeArea: { flex: 1, backgroundColor: BLUE },
    header: {
        backgroundColor: BLUE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    headerLeft: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    headerLogo: { width: 50, height: 50 },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#fff', textAlign: 'center' },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerSpacer: { flex: 1 },
    content: { flex: 1, minHeight: 0, backgroundColor: '#fff' },
});
