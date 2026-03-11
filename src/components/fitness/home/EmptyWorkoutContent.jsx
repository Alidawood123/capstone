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
<<<<<<< Updated upstream
=======
import {
    searchExercises,
    getAllExercises,
    getBodyParts,
    ensureExercisesLoaded,
} from '../../../services/exerciseParser';
import { addUserExercise, deleteUserExercise } from '../../../services/userExerciseService';
import { addWorkout } from '../../../services/workoutStorage';
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
export default function EmptyWorkoutContent({ onAddExercises, onCancelWorkout }) {
    const [workoutTitle, setWorkoutTitle] = useState('Untitled Workout');
=======
/** Format rest seconds as "1:30" (min:sec) if >= 60, else "45s" */
function formatRestDisplay(seconds) {
    const sec = Math.max(0, Math.floor(Number(seconds) || 0));
    if (sec >= 60) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    }
    return `${sec}s`;
}

/** Parse rest input: "90", "1:30", "45s" -> seconds */
function parseRestInput(text) {
    const t = (text || '').trim().replace(/s$/i, '');
    if (t.includes(':')) {
        const parts = t.split(':');
        const m = parseInt(parts[0], 10) || 0;
        const s = parseInt(parts[1], 10) || 0;
        return m * 60 + s;
    }
    return Math.max(0, parseInt(t, 10) || 0);
}

/** Allow only digits (for reps, time in seconds). */
function numericOnly(value) {
    return (value || '').replace(/[^0-9]/g, '');
}

/** Allow digits and at most one decimal point (for weight, distance). */
function decimalOnly(value) {
    const v = (value || '').replace(/[^0-9.]/g, '');
    const parts = v.split('.');
    if (parts.length <= 1) return v;
    return parts[0] + '.' + parts.slice(1).join('');
}

function DropdownField({
    label,
    value,
    placeholder,
    options,
    isOpen,
    onToggle,
    onSelect,
}) {
    return (
        <View style={styles.dropdownField}>
            <Text style={styles.dropdownLabel}>{label}</Text>
            <Pressable style={styles.dropdownInput} onPress={onToggle}>
                <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
                    {value || placeholder}
                </Text>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#6b7280"
                />
            </Pressable>
            {isOpen && (
                <View style={styles.dropdownMenu}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {options.length === 0 ? (
                            <Text style={styles.dropdownEmpty}>No options</Text>
                        ) : (
                            options.map((option) => (
                                <Pressable
                                    key={option}
                                    style={styles.dropdownOption}
                                    onPress={() => onSelect(option)}
                                >
                                    <Text style={styles.dropdownOptionText}>{option}</Text>
                                </Pressable>
                            ))
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

function SetRowSwipeable({ children, onDelete }) {
    const translateX = React.useRef(new Animated.Value(0)).current;

    const panResponder = React.useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
            onPanResponderMove: (_, g) => {
                const dx = g.dx;
                if (dx <= 0) translateX.setValue(Math.max(-SWIPE_DELETE_WIDTH, dx));
            },
            onPanResponderRelease: (_, g) => {
                if (g.dx < -SWIPE_DELETE_WIDTH / 2) {
                    Animated.spring(translateX, {
                        toValue: -SWIPE_DELETE_WIDTH,
                        useNativeDriver: true,
                        tension: 80,
                        friction: 12,
                    }).start();
                } else {
                    Animated.spring(translateX, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 80,
                        friction: 12,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <View style={styles.swipeRowContainer}>
            <View style={styles.swipeRowDeleteBg}>
                <TouchableOpacity style={styles.swipeRowDeleteButton} onPress={onDelete} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.swipeRowDeleteText}>Delete</Text>
                </TouchableOpacity>
            </View>
            <Animated.View
                style={[styles.swipeRowContent, { transform: [{ translateX }] }]}
                {...panResponder.panHandlers}
            >
                {children}
            </Animated.View>
        </View>
    );
}

/** Clone exercise items with new ids so they can be used as a fresh workout or template. */
function cloneWithNewIds(items) {
    if (!Array.isArray(items)) return [];
    return items.map((it) => ({
        ...it,
        id: it.id ? `exercise_${it.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}` : `exercise_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        sets: Array.isArray(it.sets) ? it.sets.map((s) => ({ ...s })) : [],
    }));
}

export default function EmptyWorkoutContent({
    onAddExercises,
    onCancelWorkout,
    mode = 'workout',
    initialTitle,
    initialExercises,
    onSaveTemplate,
}) {
    const isTemplateMode = mode === 'template';
    const [workoutTitle, setWorkoutTitle] = useState(
        isTemplateMode ? 'Untitled template' : 'Untitled Workout'
    );
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
    const typeOptions = useMemo(() => ALLOWED_TYPES, []);

    const bodyPartOptions = useMemo(() => {
        if (!exercisesReady) {
            return [];
        }
        return getBodyParts();
    }, [exercisesReady]);

    const levelOptions = useMemo(() => {
        if (!exercisesReady) {
            return DEFAULT_LEVELS;
        }
        const levels = new Set(
            getAllExercises()
                .map((exercise) => exercise.level)
                .filter(Boolean)
        );
        if (levels.size === 0) {
            return DEFAULT_LEVELS;
        }
        return Array.from(levels).sort();
    }, [exercisesReady]);

    const handleSelectExercise = (exercise) => {
        setSelectedExercises((prev) => [...prev, exercise]);
    };

    const handleRemoveSelectedExercise = (id) => {
        setSelectedExercises((prev) => prev.filter((exercise) => exercise.id !== id));
    };

    const defaultSet = () => ({
        weight: '',
        reps: '',
        distance: '',
        time: '',
        restSeconds: 60,
        completed: false,
    });

    const handleAddSelected = () => {
        if (selectedExercises.length === 0) return;
        const newItems = selectedExercises.map((exercise) => ({
            id: `exercise_${exercise.id}_${Date.now()}`,
            type: 'single',
            exercises: [exercise],
            sets: [defaultSet()],
        }));

        setAddedItems((prev) => [...prev, ...newItems]);
        if (onAddExercises) {
            onAddExercises(newItems);
        }
        setSelectedExercises([]);
        setExerciseSearch('');
        setShowExerciseModal(false);
    };

    const handleOpenNewExercise = () => {
        setShowNewExerciseForm(true);
        setActiveTab('add');
    };

    const handleCloseModal = () => {
        setShowExerciseModal(false);
        setShowNewExerciseForm(false);
        setOpenDropdown(null);
        setOpenExerciseFilter(null);
        setFilterBodyPart(null);
        setFilterCategory(null);
        setSelectedExercises([]);
        setExerciseSearch('');
        setActiveTab('search');
    };

    const handleCancelNewExercise = () => {
        setShowNewExerciseForm(false);
        setOpenDropdown(null);
        setActiveTab('search');
        setNewExercise({ title: '', type: '', bodyPart: '' });
    };

    const handleSaveNewExercise = () => {
        if (!newExercise.title.trim()) return;
        const created = addUserExercise({
            ...newExercise,
            description: '',
            level: '',
            equipment: '',
        });
        setShowNewExerciseForm(false);
        setOpenDropdown(null);
        setNewExercise({ title: '', type: '', bodyPart: '' });
        setExerciseSearch(created.title || '');
        setSelectedExercises((prev) => [...prev, created]);
        setExercises(searchExercises(''));
        setFilteredExercises(searchExercises(created.title || ''));
        setActiveTab('search');
    };

    const handleDeleteCustomExercise = (id) => {
        deleteUserExercise(id);
        const data = searchExercises(exerciseSearch);
        setExercises(searchExercises(''));
        setFilteredExercises(data);
        setSelectedExercises((prev) => prev.filter((exercise) => exercise.id !== id));
    };

    /** Returns which set fields to show: weight (lbs), reps, distance (miles), time */
    const getFieldsForExerciseType = (type) => {
        const t = (type || '').toLowerCase();
        // Weight (lbs) + reps: barbell, dumbbell, machine/other, weighted bodyweight, assisted bodyweight
        if (['barbell', 'dumbbell', 'machine/other', 'machine'].includes(t) || t.includes('barbell') || t.includes('dumbbell') || t.includes('weighted') || t.includes('assisted')) return { weight: true, reps: true, distance: false, time: false };
        // Reps only
        if (t === 'reps only' || t === 'reps') return { weight: false, reps: true, distance: false, time: false };
        // Cardio: distance (miles) + time
        if (['cardio', 'endurance'].includes(t)) return { weight: false, reps: false, distance: true, time: true };
        // Duration: time only
        if (['duration', 'flexibility', 'balance'].includes(t)) return { weight: false, reps: false, distance: false, time: true };
        return { weight: false, reps: true, distance: false, time: true };
    };

    const addSet = (itemId) => {
        setAddedItems((prev) =>
            prev.map((it) =>
                it.id === itemId ? { ...it, sets: [...(it.sets || []), defaultSet()] } : it
            )
        );
    };

    const removeSet = (itemId, setIndex) => {
        setAddedItems((prev) =>
            prev.map((it) => {
                if (it.id !== itemId) return it;
                const sets = [...(it.sets || [])];
                sets.splice(setIndex, 1);
                return { ...it, sets };
            })
        );
    };

    const updateSet = (itemId, setIndex, field, value) => {
        setAddedItems((prev) =>
            prev.map((it) => {
                if (it.id !== itemId) return it;
                const sets = [...(it.sets || [])];
                if (!sets[setIndex]) sets[setIndex] = defaultSet();
                sets[setIndex] = { ...sets[setIndex], [field]: value };
                return { ...it, sets };
            })
        );
    };

    const removeAddedItem = (itemId) => {
        setAddedItems((prev) => prev.filter((it) => it.id !== itemId));
    };

    const isEditingRest = (itemId, setIndex) =>
        editingRest && editingRest.itemId === itemId && editingRest.setIndex === setIndex;

    const handleRestBlur = (itemId, setIndex, text) => {
        const seconds = parseRestInput(text);
        updateSet(itemId, setIndex, 'restSeconds', seconds);
        setEditingRest(null);
    };

    const isRestCountdownActive = (itemId, setIndex) =>
        restCountdown && restCountdown.itemId === itemId && restCountdown.setIndex === setIndex;

    const handleSetCompleteToggle = (itemId, setIndex, completed, restSeconds) => {
        updateSet(itemId, setIndex, 'completed', completed);
        if (completed && (restSeconds ?? 60) > 0) {
            setRestCountdown({ itemId, setIndex, remainingSeconds: restSeconds ?? 60 });
        } else if (!completed && isRestCountdownActive(itemId, setIndex)) {
            setRestCountdown(null);
        }
    };

    const handleCompleteWorkout = async () => {
        if (completingWorkout) return;
        setCompletingWorkout(true);
        try {
            const workout = {
                title: workoutTitle,
                date: startDate.toISOString(),
                durationSeconds: elapsedSeconds,
                completedAt: new Date().toISOString(),
                exercises: addedItems,
            };
            await addWorkout(workout);
            if (onCancelWorkout) onCancelWorkout();
        } catch (error) {
            console.error('Failed to save workout:', error);
        } finally {
            setCompletingWorkout(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (completingWorkout) return;
        setCompletingWorkout(true);
        try {
            if (onSaveTemplate) {
                await onSaveTemplate({ title: workoutTitle, exercises: addedItems });
            }
            if (onCancelWorkout) onCancelWorkout();
        } catch (error) {
            console.error('Failed to save template:', error);
        } finally {
            setCompletingWorkout(false);
        }
    };

>>>>>>> Stashed changes
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