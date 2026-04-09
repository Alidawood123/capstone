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
import AnalyzeVideoContent from '../components/fitness/home/AnalyzeVideoContent';
import VideoProcessingContent from '../components/fitness/home/VideoProcessingContent';
import FitnessNavigationBar from '../components/fitness/FitnessNavigationBar';
import { addTemplate } from '../services/templateStorage';
import Settings from '../components/fitness/modals/Settings';

import { getAuth } from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

const BLUE = '#00b4d8';

export default function FitnessPage({ onNavigateToSignIn }) {
    const auth = getAuth();
    const user = auth.currentUser;

    const [activeTab, setActiveTab] = useState('home');
    const [fitnessScreen, setFitnessScreen] = useState('tabs');
    const [workoutInitialData, setWorkoutInitialData] = useState(null);
    const [processingVideo, setProcessingVideo] = useState(null);
    const [isFirstPerson, setIsFirstPerson] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
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
                    ) : fitnessScreen === 'analyzevideo' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}>Analyze Video</Text>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setFitnessScreen('tabs')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                        </>
                    ) : fitnessScreen === 'processing' ? (
                        <>
                            <Text style={styles.headerTitle} numberOfLines={1}>Analyzing...</Text>
                            <View style={styles.headerSpacer} />
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
                            <Text style={styles.headerTitle} numberOfLines={1}>Welcome Back!</Text>
                            <TouchableOpacity style={styles.backButton} onPress={() => setShowSettings(true)} activeOpacity={0.8}>
                                <Ionicons name="settings-outline" size={24} color="#fff" />
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
                    {fitnessScreen === 'analyzevideo' ? (
                        <AnalyzeVideoContent
                            onBack={() => setFitnessScreen('tabs')}
                            onAnalyze={(video, firstPerson) => {
                                setProcessingVideo(video);
                                setIsFirstPerson(firstPerson);
                                setFitnessScreen('processing');
                            }}
                        />
                    ) : fitnessScreen === 'processing' ? (
                        <VideoProcessingContent
                            video={processingVideo}
                            isFirstPerson={isFirstPerson}
                            onBack={() => setFitnessScreen('analyzevideo')}
                            onComplete={(_session) => {
                                Toast.show({ type: 'success', text1: 'Workout video processed successfully', text2: 'You can find it in your history' });
                                setProcessingVideo(null);
                                setFitnessScreen('tabs');
                                setActiveTab('history');
                            }}
                        />
                    ) : fitnessScreen === 'emptyworkout' ? (
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
                                await addTemplate(user, t)
                                    .then(() => Toast.show({ type: 'success', text1: 'Template saved' }))
                                    .catch(() => Toast.show({ type: 'error', text1: 'Failed to save template' }));
                                setFitnessScreen('tabs');
                                setActiveTab('templates');
                            }}
                        />
                    ) : (
                        <>
                            {activeTab === 'home' && <FitnessHomeContent onStartEmptyWorkout={() => setFitnessScreen('emptyworkout')} onAnalyzeVideo={() => setFitnessScreen('analyzevideo')} />}
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

            <Settings visible={showSettings} onClose={() => setShowSettings(false)} onSignOut={onNavigateToSignIn} />
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
