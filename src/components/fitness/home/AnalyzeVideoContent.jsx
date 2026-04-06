import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const BLUE = '#00b4d8';
const GREEN = '#22c55e';

const STEPS = [
    { icon: 'videocam-outline', label: 'Record your workout session on your device or camera' },
    { icon: 'cloud-upload-outline', label: 'Or grab your video from your Files' },
    { icon: 'hand-left-outline', label: 'Select it here and upload your footage' },
    { icon: 'bar-chart-outline', label: 'Our AI model will analyze your footage and detect what kind of exercises you are doing' },
];

function formatDuration(seconds) {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}m ${s}s`;
}

function formatSize(bytes) {
    if (!bytes) return '';
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AnalyzeVideoContent({ onBack, onAnalyze }) {
    const [video, setVideo] = useState(null);
    const [isFirstPerson, setIsFirstPerson] = useState(true);

    async function pickFromCameraRoll() {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Required',
                'The app needs access to your photo library to select workout footage.',
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setVideo({
                uri: asset.uri,
                name: asset.fileName || 'workout-video.mp4',
                duration: asset.duration || undefined,
            });
        }
    }

    async function pickFromFiles() {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['video/mp4', 'video/quicktime', 'video/*'],
            copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            setVideo({
                uri: asset.uri,
                name: asset.name,
                size: asset.size || undefined,
            });
        }
    }

    function handleAnalyze() {
        if (!video) return;
        if (onAnalyze) onAnalyze(video, isFirstPerson);
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* How it works */}
                <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
                <View style={styles.stepsCard}>
                    {STEPS.map((step, i) => (
                        <View key={i} style={styles.step}>
                            <View style={styles.stepIconBg}>
                                <Ionicons name={step.icon} size={20} color={BLUE} />
                            </View>
                            <Text style={styles.stepText}>{step.label}</Text>
                            {i < STEPS.length - 1 && <View style={styles.stepConnector} />}
                        </View>
                    ))}
                </View>

                {/* Info banner */}
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle-outline" size={20} color={BLUE} />
                    <Text style={styles.infoText}>
                        Footage from your Camera Roll or any video file on your device can be
                        uploaded below to begin AI-powered analysis. Your video will not be stored and will only be used for processing your workout data.
                    </Text>
                </View>

                {/* Footage type toggle */}
                <Text style={styles.sectionLabel}>FOOTAGE TYPE</Text>
                <View style={styles.toggleCard}>
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleOption, isFirstPerson && styles.toggleOptionActive]}
                            activeOpacity={0.8}
                            onPress={() => setIsFirstPerson(true)}
                        >
                            <Ionicons
                                name="eye-outline"
                                size={18}
                                color={isFirstPerson ? '#fff' : '#6b7280'}
                            />
                            <Text style={[styles.toggleOptionText, isFirstPerson && styles.toggleOptionTextActive]}>
                                First Person
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleOption, !isFirstPerson && styles.toggleOptionActive]}
                            activeOpacity={0.8}
                            onPress={() => setIsFirstPerson(false)}
                        >
                            <Ionicons
                                name="person-outline"
                                size={18}
                                color={!isFirstPerson ? '#fff' : '#6b7280'}
                            />
                            <Text style={[styles.toggleOptionText, !isFirstPerson && styles.toggleOptionTextActive]}>
                                Third Person
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.toggleHint}>
                        {isFirstPerson
                            ? 'Camera is worn or held by you (e.g. glasses, chest mount)'
                            : 'Camera is placed facing you (e.g. phone propped up)'}
                    </Text>
                </View>

                {/* Picker options */}
                <Text style={styles.sectionLabel}>SELECT FOOTAGE</Text>

                <TouchableOpacity
                    style={[styles.pickerButton, video !== null && styles.pickerButtonDisabled]}
                    activeOpacity={0.8}
                    onPress={pickFromCameraRoll}
                    disabled={video !== null}
                >
                    <View style={[styles.pickerIconBg, video !== null && styles.pickerIconBgDisabled]}>
                        <Ionicons name="images-outline" size={24} color={video !== null ? '#9ca3af' : BLUE} />
                    </View>
                    <View style={styles.pickerText}>
                        <Text style={[styles.pickerTitle, video !== null && styles.pickerTitleDisabled]}>Camera Roll</Text>
                        <Text style={styles.pickerSub}>
                            Select from your saved videos
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.pickerButton, video !== null && styles.pickerButtonDisabled]}
                    activeOpacity={0.8}
                    onPress={pickFromFiles}
                    disabled={video !== null}
                >
                    <View style={[styles.pickerIconBg, video !== null && styles.pickerIconBgDisabled]}>
                        <Ionicons name="folder-outline" size={24} color={video !== null ? '#9ca3af' : BLUE} />
                    </View>
                    <View style={styles.pickerText}>
                        <Text style={[styles.pickerTitle, video !== null && styles.pickerTitleDisabled]}>Browse Files</Text>
                        <Text style={styles.pickerSub}>
                            Pick a video from any folder on your device
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                {/* Selected video preview */}
                {video && (
                    <View style={styles.selectedCard}>
                        <View style={styles.selectedHeader}>
                            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
                            <Text style={styles.selectedLabel}>Video Selected</Text>
                            <TouchableOpacity onPress={() => setVideo(null)}>
                                <Ionicons name="close-circle" size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.selectedName} numberOfLines={1}>
                            {video.name}
                        </Text>
                        <View style={styles.selectedMeta}>
                            {video.duration ? (
                                <Text style={styles.selectedMetaText}>
                                    Duration: {formatDuration(video.duration)}
                                </Text>
                            ) : null}
                            {video.size ? (
                                <Text style={styles.selectedMetaText}>
                                    Size: {formatSize(video.size)}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Analyze CTA */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.analyzeButton, !video && styles.analyzeButtonDisabled]}
                    activeOpacity={0.85}
                    disabled={!video}
                    onPress={handleAnalyze}
                >
                    <Ionicons
                        name="analytics-outline"
                        size={22}
                        color={video ? '#fff' : '#9ca3af'}
                    />
                    <Text style={[styles.analyzeText, !video && styles.analyzeTextDisabled]}>
                        Analyze Workout
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
    sectionLabel: {
        color: '#9ca3af',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 10,
        marginTop: 4,
    },
    stepsCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    step: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        position: 'relative',
        paddingBottom: 16,
    },
    stepIconBg: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: `${BLUE}18`,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    stepText: {
        color: '#374151',
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
        paddingTop: 9,
    },
    stepConnector: {
        position: 'absolute',
        left: 18,
        top: 42,
        bottom: 0,
        width: 2,
        backgroundColor: '#e5e7eb',
    },
    infoBanner: {
        backgroundColor: `${BLUE}14`,
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: `${BLUE}30`,
    },
    infoText: {
        color: '#374151',
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    toggleCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        padding: 6,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    toggleRow: {
        flexDirection: 'row',
        gap: 4,
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    toggleOptionActive: {
        backgroundColor: BLUE,
    },
    toggleOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    toggleOptionTextActive: {
        color: '#fff',
    },
    toggleHint: {
        color: '#9ca3af',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 4,
        lineHeight: 15,
    },
    pickerButton: {
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    pickerButtonDisabled: {
        opacity: 0.45,
        backgroundColor: '#f3f4f6',
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    pickerIconBg: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: `${BLUE}18`,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    pickerIconBgDisabled: {
        backgroundColor: '#e5e7eb',
    },
    pickerText: {
        flex: 1,
    },
    pickerTitle: {
        color: '#111',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 3,
    },
    pickerTitleDisabled: {
        color: '#9ca3af',
    },
    pickerSub: {
        color: '#6b7280',
        fontSize: 12,
        lineHeight: 16,
    },
    selectedCard: {
        backgroundColor: `${GREEN}10`,
        borderRadius: 12,
        padding: 14,
        marginTop: 10,
        borderWidth: 1,
        borderColor: `${GREEN}40`,
    },
    selectedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    selectedLabel: {
        color: GREEN,
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    selectedName: {
        color: '#111',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    selectedMeta: {
        flexDirection: 'row',
        gap: 16,
    },
    selectedMetaText: {
        color: '#6b7280',
        fontSize: 12,
    },
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    analyzeButton: {
        backgroundColor: BLUE,
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    analyzeButtonDisabled: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    analyzeText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    analyzeTextDisabled: {
        color: '#9ca3af',
    },
});
