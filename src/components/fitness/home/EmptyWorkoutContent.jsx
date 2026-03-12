import { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Pressable,
    Keyboard,
    TouchableWithoutFeedback,
    Animated,
    PanResponder,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    ensureExercisesLoaded,
} from '../../../services/exerciseParser';
import { addWorkout } from '../../../services/workoutStorage';

import ExercisePicker from '../modals/ExercisePicker';

import { getAuth } from '@react-native-firebase/auth';

const BLUE = '#00b4d8';
const GREEN = '#22c55e';
const SWIPE_DELETE_WIDTH = 72;

function formatElapsed(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const getDefaultRestSeconds = async () => {
    return 60;
}

/** Format rest seconds as "1:30" (min:sec) if >= 60, else "45s" */
function formatRestDisplay(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
}

/** Parse rest input: "90", "1:30", "45s" -> seconds */
function parseRestInput(text) {
const digits = (text || "").replace(/[^0-9]/g, "").slice(0, 5);

  if (!digits) return 0;

  const padded = digits.padStart(2, "0");

  const ss = parseInt(padded.slice(-2), 10);

  const mm = padded.length > 2 ? parseInt(padded.slice(-4, -2), 10) : 0;

  const hh = padded.length > 4 ? parseInt(padded.slice(0, -4), 10) : 0;

  return hh * 3600 + mm * 60 + ss;

}



/** Convert total seconds back into compact digit string for editing.

 *  150s -> "230" (2min 30sec), 23s -> "23", 5025s -> "12345" (1h 23m 45s) */

function secondsToRestDigits(totalSeconds) {
    const total = Math.max(0, Math.floor(Number(totalSeconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;

    if (h > 0) return `${h}${String(m).padStart(2, "0")}${String(s).padStart(2, "0")}`;
    if (m > 0) return `${m}${String(s).padStart(2, "0")}`;

    return `${s}`;
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

function SetRowSwipeable({ children, onDelete }) {
    const translateX = useRef(new Animated.Value(0)).current;
    const openOffset = useRef(0);

    translateX.addListener(({ value }) => {
        openOffset.current = value;
    });

    const panResponder = useRef(
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

    const handleClose = () => {
        Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
        }).start();
    };

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
                <Pressable onPress={handleClose}>
                    {children}
                </Pressable>
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
    const auth = getAuth();
    const user = auth.currentUser;

    const isTemplateMode = mode === 'template';
    const [workoutTitle, setWorkoutTitle] = useState(
        isTemplateMode ? 'Untitled Template' : 'Untitled Workout'
    );
    const [startDate] = useState(() => new Date());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [addedItems, setAddedItems] = useState([]);
    const [editingRest, setEditingRest] = useState(null);
    const [restCountdown, setRestCountdown] = useState(null);
    const prevRestCountdownRef = useRef(null);
    const [completingWorkout, setCompletingWorkout] = useState(false);
    const [savedDefaultRest, setSavedDefaultRest] = useState(null);
    const hasSeededInitial = useRef(false);

    useEffect(() => {
        if (hasSeededInitial.current) return;
        if (initialTitle != null && initialTitle !== '') {
            setWorkoutTitle(initialTitle);
            hasSeededInitial.current = true;
        }
        if (Array.isArray(initialExercises) && initialExercises.length > 0) {
            setAddedItems(cloneWithNewIds(initialExercises));
            hasSeededInitial.current = true;
        }
    }, [initialTitle, initialExercises]);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        ensureExercisesLoaded();
    }, []);

    useEffect(() => {
        getDefaultRestSeconds().then((val) => setSavedDefaultRest(val));
    }, []);

    useEffect(() => {
        if (!restCountdown || restCountdown.remainingSeconds <= 0) return;
        const interval = setInterval(() => {
            setRestCountdown((prev) => {
                if (!prev || prev.remainingSeconds <= 1) return null;
                return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [restCountdown?.remainingSeconds]);

    useEffect(() => {
        if (restCountdown === null && prevRestCountdownRef.current?.remainingSeconds === 1) {
            Alert.alert(
                'Rest over',
                'Rest timer is over - start your next set!'
            );
        }
        prevRestCountdownRef.current = restCountdown;
    }, [restCountdown]);

    const dateStr = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    const defaultSet = () => ({
        weight: '',
        reps: '',
        distance: '',
        time: '',
        restSeconds: savedDefaultRest || 60,
        completed: false,
    });

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
            await addWorkout(user, workout);
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

    return (
        <View style={styles.content}>
            <ScrollView
                style={styles.scrollView}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
            >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.scrollContentContainer}>
            <TextInput
                style={styles.workoutTitleInput}
                value={workoutTitle}
                onChangeText={setWorkoutTitle}
                placeholder={isTemplateMode ? 'Template name' : 'Workout name'}
                placeholderTextColor="#9ca3af"
            />
            {!isTemplateMode && (
                <>
                    <Text style={styles.dateText}>{dateStr}</Text>
                    <View style={styles.timerRow}>
                        <Ionicons name="time-outline" size={20} color="#6b7280" />
                        <Text style={styles.timerText}>{formatElapsed(elapsedSeconds)}</Text>
                    </View>
                </>
            )}

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.addExercisesButton}
                    onPress={() => setShowExerciseModal(true)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#fff" />
                    <Text style={styles.addExercisesText}>Add exercises</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.addedExercisesSection}>
                <Text style={styles.sectionTitle}>Exercises</Text>
                {addedItems.length === 0 ? (
                    <Text style={styles.emptyStateText}>No exercises added yet.</Text>
                ) : (
                    <View style={styles.addedItemsList}>
                        {addedItems.map((item) => {
                            const sets = Array.isArray(item.sets) ? item.sets : [];
                            const exercise = item.exercises && item.exercises[0];
                            const fields = exercise
                                ? getFieldsForExerciseType(exercise.type)
                                : { weight: false, reps: true, distance: false, time: true };
                            return (
                                <View key={item.id} style={styles.addedItemCard}>
                                    {item.exercises.map((ex, exIndex) => (
                                        <View
                                            key={`${item.id}_${ex.id}`}
                                            style={styles.addedExerciseRow}
                                        >
                                            <View style={styles.addedExerciseRowText}>
                                                <Text style={styles.addedExerciseTitle}>
                                                    {ex.title}
                                                </Text>
                                                <Text style={styles.addedExerciseMeta}>
                                                    {[ex.type, ex.bodyPart, ex.equipment]
                                                        .filter(Boolean)
                                                        .join(' • ')}
                                                </Text>
                                            </View>
                                            {exIndex === 0 && (
                                                <TouchableOpacity
                                                    style={styles.removeExerciseButton}
                                                    onPress={() => removeAddedItem(item.id)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                    <Text style={styles.setsSectionLabel}>Sets</Text>
                                    {sets.map((set, setIndex) => (
                                        <SetRowSwipeable
                                            key={setIndex}
                                            onDelete={() => removeSet(item.id, setIndex)}
                                        >
                                            <View style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                                            <Text style={[styles.setNumber, set.completed && styles.setNumberCompleted]}>
                                                Set {setIndex + 1}
                                            </Text>
                                            <View style={styles.setInputsRow}>
                                                {fields.weight && (
                                                    <TextInput
                                                        style={styles.setInput}
                                                        value={set.weight ?? ''}
                                                        onChangeText={(v) =>
                                                            updateSet(item.id, setIndex, 'weight', decimalOnly(v))
                                                        }
                                                        placeholder="lbs"
                                                        placeholderTextColor="#9ca3af"
                                                        keyboardType="decimal-pad"
                                                    />
                                                )}
                                                {fields.reps && (
                                                    <TextInput
                                                        style={styles.setInput}
                                                        value={set.reps ?? ''}
                                                        onChangeText={(v) =>
                                                            updateSet(item.id, setIndex, 'reps', numericOnly(v))
                                                        }
                                                        placeholder="Reps"
                                                        placeholderTextColor="#9ca3af"
                                                        keyboardType="numeric"
                                                    />
                                                )}
                                                {fields.distance && (
                                                    <TextInput
                                                        style={styles.setInput}
                                                        value={set.distance ?? ''}
                                                        onChangeText={(v) =>
                                                            updateSet(item.id, setIndex, 'distance', decimalOnly(v))
                                                        }
                                                        placeholder="Dist (mi)"
                                                        placeholderTextColor="#9ca3af"
                                                        keyboardType="decimal-pad"
                                                    />
                                                )}
                                                {fields.time && (
                                                    <TextInput
                                                        style={styles.setInput}
                                                        value={set.time ?? ''}
                                                        onChangeText={(v) =>
                                                            updateSet(item.id, setIndex, 'time', numericOnly(v))
                                                        }
                                                        placeholder="Time (sec)"
                                                        placeholderTextColor="#9ca3af"
                                                        keyboardType="numeric"
                                                    />
                                                )}
                                            </View>
                                            <View style={styles.setRestAndDelete}>
                                                {isEditingRest(item.id, setIndex) ? (
                                                    <TextInput
                                                        style={styles.restInput}
                                                        defaultValue={formatRestDisplay(set.restSeconds ?? 60)}
                                                        placeholder="0:00 or 45s"
                                                        placeholderTextColor="#9ca3af"
                                                        keyboardType="numbers-and-punctuation"
                                                        onBlur={(e) =>
                                                            handleRestBlur(item.id, setIndex, e.nativeEvent.text)
                                                        }
                                                        onSubmitEditing={(e) =>
                                                            handleRestBlur(item.id, setIndex, e.nativeEvent.text)
                                                        }
                                                        selectTextOnFocus
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.restSemicolonButton,
                                                            isRestCountdownActive(item.id, setIndex) &&
                                                                styles.restCountdownActive,
                                                        ]}
                                                        onPress={() =>
                                                            setEditingRest({ itemId: item.id, setIndex })
                                                        }
                                                    >
                                                        <Text style={styles.restSemicolonText}>
                                                            {isRestCountdownActive(item.id, setIndex)
                                                                ? formatRestDisplay(restCountdown.remainingSeconds)
                                                                : formatRestDisplay(set.restSeconds ?? 60)}
                                                        </Text>
                                                        <Text style={styles.restSemicolonColon}>:</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <TouchableOpacity
                                                style={styles.setCheckbox}
                                                onPress={() =>
                                                    handleSetCompleteToggle(
                                                        item.id,
                                                        setIndex,
                                                        !set.completed,
                                                        set.restSeconds ?? 60
                                                    )
                                                }
                                            >
                                                <Ionicons
                                                    name={set.completed ? 'checkbox' : 'checkbox-outline'}
                                                    size={26}
                                                    color={set.completed ? BLUE : '#9ca3af'}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        </SetRowSwipeable>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.addSetButton}
                                        onPress={() => addSet(item.id)}
                                    >
                                        <Ionicons name="add" size={18} color={BLUE} />
                                        <Text style={styles.addSetButtonText}>Add set</Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>
                </View>
            </TouchableWithoutFeedback>
            </ScrollView>

            <View style={styles.bottomActionBar}>
                <TouchableOpacity
                    style={styles.cancelWorkoutButton}
                    onPress={onCancelWorkout}
                    activeOpacity={0.85}
                >
                    <Ionicons name="close-circle-outline" size={24} color="#fff" />
                    <Text style={styles.cancelWorkoutText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.completeWorkoutButton, completingWorkout && styles.completeWorkoutButtonDisabled]}
                    onPress={isTemplateMode ? handleSaveTemplate : handleCompleteWorkout}
                    activeOpacity={0.85}
                    disabled={completingWorkout}
                >
                    <Ionicons
                        name={isTemplateMode ? 'save-outline' : 'checkmark-done-outline'}
                        size={24}
                        color="#fff"
                    />
                    <Text style={styles.completeWorkoutText}>
                        {isTemplateMode ? 'Save as template' : 'Complete'}
                    </Text>
                </TouchableOpacity>
            </View>
            <ExercisePicker
                visible={showExerciseModal}
                onClose={() => setShowExerciseModal(false)}
                onAddExercises={(exercises) => {
                const newItems = exercises.map((ex) => ({
                    id: `exercise_${ex.id}_${Date.now()}`,
                    type: "single",
                    exercises: [ex],
                    sets: [defaultSet()],
                }));
                setAddedItems((prev) => [...prev, ...newItems]);
                if (onAddExercises) onAddExercises(newItems);
                setShowExerciseModal(false);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 24,
        paddingTop: 32,
        paddingBottom: 40,
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
    addedExercisesSection: {
        marginTop: 28,
        paddingHorizontal: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#6b7280',
    },
    addedItemsList: {
        gap: 12,
    },
    addedItemCard: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        padding: 14,
        backgroundColor: '#f9fafb',
    },
    addedItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        marginBottom: 10,
    },
    addedExerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    addedExerciseRowText: {
        flex: 1,
        paddingRight: 8,
    },
    addedExerciseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
    },
    addedExerciseMeta: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    addedItemCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    removeExerciseButton: {
        padding: 6,
    },
    setsSectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
        marginBottom: 8,
    },
    swipeRowContainer: {
        overflow: 'hidden',
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    swipeRowDeleteBg: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: SWIPE_DELETE_WIDTH,
        backgroundColor: '#dc2626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    swipeRowDeleteButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    swipeRowDeleteText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    swipeRowContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    setRowCompleted: {
        backgroundColor: '#dcfce7',
    },
    setCheckbox: {
        padding: 2,
    },
    setNumber: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        width: 44,
    },
    setNumberCompleted: {
        color: '#9ca3af',
        textDecorationLine: 'line-through',
    },
    setInputsRow: {
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    setInput: {
        minWidth: 64,
        fontSize: 14,
        color: '#111',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    setRestAndDelete: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    restInput: {
        width: 52,
        fontSize: 14,
        color: '#111',
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BLUE,
        textAlign: 'center',
    },
    restSemicolonButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    restCountdownActive: {
        backgroundColor: '#dbeafe',
        borderWidth: 1,
        borderColor: BLUE,
    },
    restSemicolonText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },
    restSemicolonColon: {
        fontSize: 14,
        color: '#6b7280',
        marginLeft: 2,
        fontWeight: '600',
    },
    addSetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        marginTop: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BLUE,
        borderStyle: 'dashed',
    },
    addSetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: BLUE,
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
    bottomActionBar: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        gap: 16,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    cancelWorkoutButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        minHeight: 52,
    },
    cancelWorkoutText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    completeWorkoutButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: GREEN,
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        minHeight: 52,
    },
    completeWorkoutButtonDisabled: {
        opacity: 0.6,
    },
    completeWorkoutText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    }
});
