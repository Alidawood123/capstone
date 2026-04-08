import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from '@react-native-firebase/auth';
import * as FileSystem from 'expo-file-system/legacy';

const BLUE = '#00b4d8';
const GREEN = '#22c55e';
const RED = '#ef4444';
const ORANGE = '#f97316';

const POLL_INTERVAL_MS = 3000;

const STAGE_CONFIG = {
    uploading: {
        icon: 'cloud-upload-outline',
        color: BLUE,
        title: 'Uploading Video',
        subtitle: 'Sending your footage to the server...',
        pulse: true,
    },
    queued: {
        icon: 'time-outline',
        color: ORANGE,
        title: 'In Queue',
        subtitle: 'Your video is waiting to be processed...',
        pulse: true,
    },
    processing: {
        icon: 'fitness-outline',
        color: BLUE,
        title: 'Analyzing Workout',
        subtitle: 'Our AI is detecting exercises in your footage...',
        pulse: true,
    },
    completed: {
        icon: 'checkmark-circle-outline',
        color: GREEN,
        title: 'Analysis Complete',
        subtitle: 'Your workout has been successfully analyzed!',
        pulse: false,
    },
    failed: {
        icon: 'close-circle-outline',
        color: RED,
        title: 'Analysis Failed',
        subtitle: 'Something went wrong while analyzing your video.',
        pulse: false,
    },
    error: {
        icon: 'alert-circle-outline',
        color: RED,
        title: 'Upload Error',
        subtitle: 'Could not send video to the server.',
        pulse: false,
    },
};

function PulsingIcon({ name, color, pulse }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.3)).current;
    const loopRef = useRef(null);

    useEffect(() => {
        if (pulse) {
            loopRef.current = Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(scaleAnim, {
                            toValue: 1.15,
                            duration: 900,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacityAnim, {
                            toValue: 0.15,
                            duration: 900,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(scaleAnim, {
                            toValue: 1,
                            duration: 900,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacityAnim, {
                            toValue: 0.3,
                            duration: 900,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            );
            loopRef.current.start();
        } else {
            scaleAnim.setValue(1);
            opacityAnim.setValue(0.2);
        }
        return () => loopRef.current?.stop();
    }, [pulse, color]);

    return (
        <View style={styles.iconWrapper}>
            <Animated.View
                style={[
                    styles.iconRing,
                    { backgroundColor: color, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
                ]}
            />
            <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
                <Ionicons name={name} size={48} color={color} />
            </View>
        </View>
    );
}

function StepDot({ done, active, color }) {
    return (
        <View style={[styles.stepDot, done && { backgroundColor: color }, active && { borderColor: color }]}>
            {done && <Ionicons name="checkmark" size={10} color="#fff" />}
        </View>
    );
}

export default function VideoProcessingContent({ video, isFirstPerson, onBack, onComplete }) {
    const [stage, setStage] = useState('uploading');
    const [errorMsg, setErrorMsg] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const jobIDRef = useRef(null);
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const pollRef = useRef(null);
    const timerRef = useRef(null);
    const didUnmount = useRef(false);

    const config = STAGE_CONFIG[stage] ?? STAGE_CONFIG.error;
    const steps = ['uploading', 'queued', 'processing', 'completed'];

    // Elapsed timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            if (!didUnmount.current) setElapsedSecs(s => s + 1);
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    // Main upload + poll flow
    useEffect(() => {
        didUnmount.current = false;
        startUpload();
        return () => {
            didUnmount.current = true;
            clearInterval(pollRef.current);
        };
    }, []);

    async function startUpload() {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            const token = await user.getIdToken();

            // Step 1 — request a pre-signed S3 PUT URL from the backend
            const signRes = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_SERVER_URL}/api/ai/request-upload`,
                { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
            );
            const signData = await signRes.json();
            if (!signRes.ok) {
                if (!didUnmount.current) {
                    setStage('error');
                    setErrorMsg(signData?.message || 'Could not get upload URL.');
                }
                return;
            }

            console.log('Received signed URL data:', signData);

            const { signedUrl, s3Key } = signData;

            // Step 2 — upload directly to S3 (single network hop)

            console.log('Uploading video to S3 with signed URL...');

            const uploadTask = FileSystem.createUploadTask(
                signedUrl,
                video.uri,
                {
                    httpMethod: 'PUT',
                    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
                    headers: { 'Content-Type': 'video/mp4' },
                },
                ({ totalBytesSent, totalBytesExpectedToSend }) => {
                    if (!didUnmount.current && totalBytesExpectedToSend > 0) {
                        setUploadProgress(Math.round((totalBytesSent / totalBytesExpectedToSend) * 100));
                    }
                }
            );
            const uploadResult = await uploadTask.uploadAsync();
            if (uploadResult.status < 200 || uploadResult.status >= 300) {
                if (!didUnmount.current) {
                    setStage('error');
                    setErrorMsg('Failed to upload video to storage.');
                }
                return;
            }

            console.log('Video uploaded to S3 successfully.');

            if (didUnmount.current) return;
            setStage('queued');

            // Step 3 — tell the backend to kick off AI analysis
            const analysisRes = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_SERVER_URL}/api/ai/start-analysis`,
                {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ s3Key, firstPerson: isFirstPerson }),
                }
            );
            const analysisData = await analysisRes.json();
            if (!analysisRes.ok) {
                if (!didUnmount.current) {
                    setStage('error');
                    setErrorMsg(analysisData?.message || 'Failed to start analysis.');
                }
                return;
            }

            jobIDRef.current = analysisData.jobID;

            pollRef.current = setInterval(() => pollStatus(jobIDRef.current, token), POLL_INTERVAL_MS);
        } catch (err) {
            if (!didUnmount.current) {
                setStage('error');
                setErrorMsg('Could not connect to the server.');
            }
        }
    }

    async function pollStatus(id, token) {
        try {
            const res = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_SERVER_URL}/api/ai/analysis-progress?jobID=${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();

            if (didUnmount.current) return;

            const status = (data.status || '').toLowerCase();

            if (status === 'completed' || status === 'done' || status === 'finished') {
                clearInterval(pollRef.current);
                setStage('completed');
                setTimeout(() => {
                    if (!didUnmount.current) onComplete?.(data);
                }, 1800);
            } else if (status === 'failed' || status === 'error') {
                clearInterval(pollRef.current);
                setStage('failed');
                setErrorMsg(data.message || 'Analysis failed on the server.');
            } else if (status === 'processing' || status === 'running' || status === 'in_progress') {
                setStage('processing');
            } else if (status === 'queued' || status === 'pending' || status === 'waiting') {
                setStage('queued');
            }
        } catch {
            // transient network error — keep polling
        }
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }

    const isDone = stage === 'completed' || stage === 'failed' || stage === 'error';
    const currentStepIdx = steps.indexOf(stage);

    return (
        <View style={styles.container}>
            {/* Icon */}
            <PulsingIcon name={config.icon} color={config.color} pulse={config.pulse} />

            {/* Title + subtitle */}
            <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>

            {/* Upload percentage */}
            {stage === 'uploading' && (
                <Text style={[styles.uploadPercent, { color: BLUE }]}>{uploadProgress}%</Text>
            )}

            {/* Progress steps (only while active) */}
            {!isDone && (
                <View style={styles.stepsRow}>
                    {steps.map((s, i) => (
                        <React.Fragment key={s}>
                            <StepDot
                                done={currentStepIdx > i}
                                active={currentStepIdx === i}
                                color={BLUE}
                            />
                            {i < steps.length - 1 && (
                                <View
                                    style={[
                                        styles.stepLine,
                                        currentStepIdx > i && { backgroundColor: BLUE },
                                    ]}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </View>
            )}

            {/* Step labels */}
            {!isDone && (
                <View style={styles.stepLabels}>
                    {['Upload', 'Queue', 'Analyze', 'Done'].map((label, i) => (
                        <Text
                            key={label}
                            style={[
                                styles.stepLabel,
                                currentStepIdx === i && { color: BLUE, fontWeight: '700' },
                            ]}
                        >
                            {label}
                        </Text>
                    ))}
                </View>
            )}

            {/* Elapsed time */}
            {!isDone && (
                <View style={styles.timerRow}>
                    <Ionicons name="timer-outline" size={14} color="#9ca3af" />
                    <Text style={styles.timerText}>Elapsed: {formatTime(elapsedSecs)}</Text>
                </View>
            )}

            {/* Video info card */}
            {video && (
                <View style={styles.videoCard}>
                    <Ionicons name="videocam-outline" size={18} color={BLUE} />
                    <Text style={styles.videoName} numberOfLines={1}>{video.name || 'workout-video.mp4'}</Text>
                </View>
            )}

            {/* Error message */}
            {errorMsg && (
                <View style={styles.errorBanner}>
                    <Ionicons name="warning-outline" size={16} color={RED} />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
            )}

            {/* Action buttons for terminal states */}
            {(stage === 'failed' || stage === 'error') && (
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.retryButton} onPress={onBack} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={18} color={BLUE} />
                        <Text style={styles.retryText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 32,
        paddingVertical: 40,
    },
    iconWrapper: {
        width: 120,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    iconRing: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
        maxWidth: 280,
    },
    uploadPercent: {
        fontSize: 32,
        fontWeight: '700',
        marginBottom: 20,
        marginTop: -16,
    },
    stepsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
        maxWidth: 280,
    },
    stepDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 2,
    },
    stepLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 280,
        marginBottom: 24,
        paddingHorizontal: 2,
    },
    stepLabel: {
        fontSize: 10,
        color: '#9ca3af',
        fontWeight: '500',
        width: 48,
        textAlign: 'center',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 24,
    },
    timerText: {
        fontSize: 12,
        color: '#9ca3af',
    },
    videoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: `${BLUE}10`,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: `${BLUE}25`,
        maxWidth: 280,
        width: '100%',
        marginBottom: 16,
    },
    videoName: {
        fontSize: 13,
        color: '#374151',
        flex: 1,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#fef2f2',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
        maxWidth: 280,
        width: '100%',
        marginBottom: 20,
    },
    errorText: {
        fontSize: 13,
        color: '#b91c1c',
        flex: 1,
        lineHeight: 18,
    },
    actions: {
        width: '100%',
        maxWidth: 280,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: BLUE,
    },
    retryText: {
        fontSize: 15,
        fontWeight: '600',
        color: BLUE,
    },
});
