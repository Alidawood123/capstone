import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#00b4d8';

function formatElapsed(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function EmptyWorkoutContent({ onAddExercises, onCancelWorkout }) {
    const [workoutTitle, setWorkoutTitle] = useState('Untitled Workout');
    const [startDate] = useState(() => new Date());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const dateStr = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <View style={styles.content}>
            <TextInput
                style={styles.workoutTitleInput}
                value={workoutTitle}
                onChangeText={setWorkoutTitle}
                placeholder="Workout name"
                placeholderTextColor="#9ca3af"
            />
            <Text style={styles.dateText}>{dateStr}</Text>
            <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={20} color="#6b7280" />
                <Text style={styles.timerText}>{formatElapsed(elapsedSeconds)}</Text>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.addExercisesButton}
                    onPress={() => setShowExerciseModal(true)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#fff" />
                    <Text style={styles.addExercisesText}>Add exercises</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelWorkoutButton}
                    onPress={onCancelWorkout}
                    activeOpacity={0.85}
                >
                    <Ionicons name="close-circle-outline" size={24} color="#6b7280" />
                    <Text style={styles.cancelWorkoutText}>Cancel workout</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={showExerciseModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowExerciseModal(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setShowExerciseModal(false)}
                >
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        {/* Top row: left [X] [New], right [Superset] [Add] */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <TouchableOpacity
                                    style={styles.modalIconButton}
                                    onPress={() => setShowExerciseModal(false)}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalNewButton}>
                                    <Text style={styles.modalNewButtonText}>New</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalHeaderRight}>
                                <TouchableOpacity style={styles.modalTextButton}>
                                    <Text style={styles.modalTextButtonLabel}>Superset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalAddButton}>
                                    <Text style={styles.modalAddButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Search bar */}
                        <View style={styles.searchWrap}>
                            <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                value={exerciseSearch}
                                onChangeText={setExerciseSearch}
                                placeholder="Search exercises..."
                                placeholderTextColor="#9ca3af"
                            />
                        </View>

                        {/* Exercise library (empty for now) */}
                        <ScrollView
                            style={styles.exerciseLibrary}
                            contentContainerStyle={styles.exerciseLibraryContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Empty – connect your data set here later */}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 32,
    },
    workoutTitleInput: {
        fontSize: 22,
        fontWeight: '600',
        color: '#111',
        marginBottom: 8,
        paddingVertical: 8,
        paddingHorizontal: 0,
        borderBottomWidth: 2,
        borderBottomColor: '#e5e7eb',
    },
    dateText: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 8,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 32,
    },
    timerText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
    },
    buttonRow: {
        gap: 12,
        paddingHorizontal: 8,
    },
    addExercisesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: BLUE,
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    addExercisesText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    cancelWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#f3f4f6',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cancelWorkoutText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6b7280',
    },
    // Exercise library modal
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '92%',
        minHeight: 320,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalNewButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    modalNewButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    modalTextButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    modalTextButtonLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    modalAddButton: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: BLUE,
    },
    modalAddButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111',
    },
    exerciseLibrary: {
        flex: 1,
        minHeight: 160,
    },
    exerciseLibraryContent: {
        paddingBottom: 24,
    },
});
