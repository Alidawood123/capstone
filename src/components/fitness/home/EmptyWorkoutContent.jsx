import React, { useState, useEffect, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
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
    searchExercises,
    getAllExercises,
    getBodyParts,
    ensureExercisesLoaded,
} from '../../../services/exerciseParser';
import { addUserExercise, deleteUserExercise } from '../../../services/userExerciseService';
import { addWorkout } from '../../../services/workoutStorage';

import { getAuth } from '@react-native-firebase/auth';

const BLUE = '#00b4d8';
const GREEN = '#22c55e';
const SWIPE_DELETE_WIDTH = 72;
const ALLOWED_TYPES = ['Strength', 'Cardio', 'Flexibility', 'Endurance', 'Balance', 'Power'];
const DEFAULT_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const CUSTOM_BODY_PARTS = ['Arms', 'Back', 'Cardio', 'Chest', 'Core', 'Full body', 'Legs', 'Olympic', 'Shoulders', 'Other'];
const CUSTOM_CATEGORY_TYPES = ['Barbell', 'Dumbbell', 'Machine/other', 'Weighted bodyweight', 'Assisted bodyweight', 'Reps only', 'Cardio', 'Duration'];

// Modal exercise list filters (display labels; filter matches case-insensitive / normalized)
const EXERCISE_MODAL_BODY_PARTS = ['core', 'arms', 'back', 'chest', 'legs', 'shoulders', 'other', 'Olympic', 'full body'];
const EXERCISE_MODAL_CATEGORIES = ['barbell', 'dumbbell', 'weighted assisted', 'weighted bodyweight', 'reps only', 'cardio', 'duration'];

function formatElapsed(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
    const auth = getAuth();
    const user = auth.currentUser;

    const isTemplateMode = mode === 'template';
    const [workoutTitle, setWorkoutTitle] = useState(
        isTemplateMode ? 'Untitled template' : 'Untitled Workout'
    );
    const [startDate] = useState(() => new Date());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [activeTab, setActiveTab] = useState('search');
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [exercises, setExercises] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [loadingExercises, setLoadingExercises] = useState(false);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [addedItems, setAddedItems] = useState([]);
    const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
    const [exercisesReady, setExercisesReady] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [editingRest, setEditingRest] = useState(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [restCountdown, setRestCountdown] = useState(null);
    const prevRestCountdownRef = React.useRef(null);
    const [completingWorkout, setCompletingWorkout] = useState(false);
    const [newExercise, setNewExercise] = useState({
        title: '',
        type: '',
        bodyPart: '',
    });
    const [filterBodyPart, setFilterBodyPart] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);
    const [openExerciseFilter, setOpenExerciseFilter] = useState(null);
    const hasSeededInitial = React.useRef(false);

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
        let isMounted = true;
        ensureExercisesLoaded().then(() => {
            if (isMounted) {
                setExercisesReady(true);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardVisible(true);
            setKeyboardHeight(e.endCoordinates?.height ?? 0);
        });
        const hideSub = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
            setKeyboardHeight(0);
        });
        return () => {
            showSub.remove();
            hideSub.remove();
        };
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

    useEffect(() => {
        if (!showExerciseModal) return;
        setLoadingExercises(true);
        try {
            const data = searchExercises('');
            setExercises(data);
            setFilteredExercises(data);
        } catch (error) {
            console.error('Failed to load exercises:', error);
            setExercises([]);
            setFilteredExercises([]);
        } finally {
            setLoadingExercises(false);
        }
    }, [showExerciseModal]);

    useEffect(() => {
        if (!showExerciseModal) return;
        if (exercises.length === 0) return;
        let results = searchExercises(exerciseSearch);
        if (filterBodyPart) {
            const bpNorm = filterBodyPart.toLowerCase();
            results = results.filter(
                (ex) => (ex.bodyPart || '').toLowerCase() === bpNorm
            );
        }
        if (filterCategory) {
            const catNorm = filterCategory.toLowerCase();
            results = results.filter((ex) => {
                const typeNorm = (ex.type || '').toLowerCase();
                if (catNorm === 'weighted assisted') {
                    return typeNorm.includes('assisted');
                }
                return typeNorm === catNorm;
            });
        }
        setFilteredExercises(results);
    }, [exerciseSearch, exercises.length, showExerciseModal, filterBodyPart, filterCategory]);

    const dateStr = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

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

            <Modal
                visible={showExerciseModal}
                transparent
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={handleCloseModal}
                >
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        {/* Top row: left [X] [New], right [Superset] [Add] */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderLeft}>
                                <TouchableOpacity
                                    style={styles.modalIconButton}
                                    onPress={handleCloseModal}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <Ionicons name="close" size={24} color="#374151" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalHeaderRight}>
                                <TouchableOpacity
                                    style={[
                                        styles.modalAddButton,
                                        (selectedExercises.length === 0 || showNewExerciseForm) &&
                                            styles.modalAddButtonDisabled,
                                    ]}
                                    onPress={handleAddSelected}
                                    disabled={selectedExercises.length === 0 || showNewExerciseForm}
                                >
                                    <Text style={styles.modalAddButtonText}>
                                        Add ({selectedExercises.length})
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.modalTabs}>
                            <TouchableOpacity
                                style={[
                                    styles.modalTabButton,
                                    activeTab === 'search' && styles.modalTabButtonActive,
                                ]}
                                onPress={() => setActiveTab('search')}
                            >
                                <Text
                                    style={[
                                        styles.modalTabButtonText,
                                        activeTab === 'search' && styles.modalTabButtonTextActive,
                                    ]}
                                >
                                    Search
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalTabButton,
                                    activeTab === 'add' && styles.modalTabButtonActive,
                                ]}
                                onPress={handleOpenNewExercise}
                            >
                                <Text
                                    style={[
                                        styles.modalTabButtonText,
                                        activeTab === 'add' && styles.modalTabButtonTextActive,
                                    ]}
                                >
                                    Add Custom
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {activeTab === 'add' ? (
                            <ScrollView
                                style={styles.exerciseLibrary}
                                contentContainerStyle={styles.addCustomFormContent}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View style={styles.addCustomFormCard}>
                                    <Text style={styles.formTitle}>Add custom exercise</Text>
                                    <Text style={styles.formSubtitle}>Name your exercise and choose body part and category.</Text>
                                    <Text style={styles.formLabel}>Name</Text>
                                    <TextInput
                                        style={styles.formInput}
                                        value={newExercise.title}
                                        onChangeText={(value) =>
                                            setNewExercise((prev) => ({ ...prev, title: value }))
                                        }
                                        placeholder="Exercise name"
                                        placeholderTextColor="#9ca3af"
                                    />
                                    <Text style={styles.formLabel}>Body part</Text>
                                    <DropdownField
                                        label=""
                                        value={newExercise.bodyPart}
                                        placeholder="Select body part"
                                        options={CUSTOM_BODY_PARTS}
                                        isOpen={openDropdown === 'bodyPart'}
                                        onToggle={() =>
                                            setOpenDropdown((prev) =>
                                                prev === 'bodyPart' ? null : 'bodyPart'
                                            )
                                        }
                                        onSelect={(value) => {
                                            setNewExercise((prev) => ({ ...prev, bodyPart: value }));
                                            setOpenDropdown(null);
                                        }}
                                    />
                                    <Text style={styles.formLabel}>Category type</Text>
                                    <DropdownField
                                        label=""
                                        value={newExercise.type}
                                        placeholder="Select category"
                                        options={CUSTOM_CATEGORY_TYPES}
                                        isOpen={openDropdown === 'type'}
                                        onToggle={() =>
                                            setOpenDropdown((prev) => (prev === 'type' ? null : 'type'))
                                        }
                                        onSelect={(value) => {
                                            setNewExercise((prev) => ({ ...prev, type: value }));
                                            setOpenDropdown(null);
                                        }}
                                    />
                                    <View style={styles.formButtons}>
                                        <TouchableOpacity
                                            style={styles.formCancelButton}
                                            onPress={handleCancelNewExercise}
                                        >
                                            <Text style={styles.formCancelButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.formSaveButton,
                                                !newExercise.title.trim() && styles.formSaveButtonDisabled,
                                            ]}
                                            onPress={handleSaveNewExercise}
                                            disabled={!newExercise.title.trim()}
                                        >
                                            <Text style={styles.formSaveButtonText}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                        ) : (
                            <ScrollView
                                style={styles.exerciseLibrary}
                                contentContainerStyle={styles.exerciseLibraryContent}
                                keyboardShouldPersistTaps="handled"
                            >
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

                                {/* Filter buttons row */}
                                <View style={styles.filterRow}>
                                    <View style={styles.filterButtonWrap}>
                                        <Pressable
                                            style={[
                                                styles.filterButton,
                                                openExerciseFilter === 'bodyPart' && styles.filterButtonActive,
                                            ]}
                                            onPress={() =>
                                                setOpenExerciseFilter((prev) =>
                                                    prev === 'bodyPart' ? null : 'bodyPart'
                                                )
                                            }
                                        >
                                            <Text
                                                style={styles.filterButtonText}
                                                numberOfLines={1}
                                            >
                                                {filterBodyPart || 'Any body part'}
                                            </Text>
                                            <Ionicons
                                                name={openExerciseFilter === 'bodyPart' ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#6b7280"
                                            />
                                        </Pressable>
                                        {openExerciseFilter === 'bodyPart' && (
                                            <View style={styles.filterDropdownMenu}>
                                                <ScrollView
                                                    style={styles.filterDropdownScroll}
                                                    nestedScrollEnabled
                                                    keyboardShouldPersistTaps="handled"
                                                >
                                                    <Pressable
                                                        style={styles.filterDropdownOption}
                                                        onPress={() => {
                                                            setFilterBodyPart(null);
                                                            setOpenExerciseFilter(null);
                                                        }}
                                                    >
                                                        <Text style={styles.filterDropdownOptionText}>
                                                            Any body part
                                                        </Text>
                                                    </Pressable>
                                                    {EXERCISE_MODAL_BODY_PARTS.map((opt) => (
                                                        <Pressable
                                                            key={opt}
                                                            style={[
                                                                styles.filterDropdownOption,
                                                                filterBodyPart === opt && styles.filterDropdownOptionActive,
                                                            ]}
                                                            onPress={() => {
                                                                setFilterBodyPart(opt);
                                                                setOpenExerciseFilter(null);
                                                            }}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.filterDropdownOptionText,
                                                                    filterBodyPart === opt && styles.filterDropdownOptionTextActive,
                                                                ]}
                                                            >
                                                                {opt}
                                                            </Text>
                                                        </Pressable>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.filterButtonWrap}>
                                        <Pressable
                                            style={[
                                                styles.filterButton,
                                                openExerciseFilter === 'category' && styles.filterButtonActive,
                                            ]}
                                            onPress={() =>
                                                setOpenExerciseFilter((prev) =>
                                                    prev === 'category' ? null : 'category'
                                                )
                                            }
                                        >
                                            <Text
                                                style={styles.filterButtonText}
                                                numberOfLines={1}
                                            >
                                                {filterCategory || 'Any category'}
                                            </Text>
                                            <Ionicons
                                                name={openExerciseFilter === 'category' ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#6b7280"
                                            />
                                        </Pressable>
                                        {openExerciseFilter === 'category' && (
                                            <View style={styles.filterDropdownMenu}>
                                                <ScrollView
                                                    style={styles.filterDropdownScroll}
                                                    nestedScrollEnabled
                                                    keyboardShouldPersistTaps="handled"
                                                >
                                                    <Pressable
                                                        style={styles.filterDropdownOption}
                                                        onPress={() => {
                                                            setFilterCategory(null);
                                                            setOpenExerciseFilter(null);
                                                        }}
                                                    >
                                                        <Text style={styles.filterDropdownOptionText}>
                                                            Any category
                                                        </Text>
                                                    </Pressable>
                                                    {EXERCISE_MODAL_CATEGORIES.map((opt) => (
                                                        <Pressable
                                                            key={opt}
                                                            style={[
                                                                styles.filterDropdownOption,
                                                                filterCategory === opt && styles.filterDropdownOptionActive,
                                                            ]}
                                                            onPress={() => {
                                                                setFilterCategory(opt);
                                                                setOpenExerciseFilter(null);
                                                            }}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.filterDropdownOptionText,
                                                                    filterCategory === opt && styles.filterDropdownOptionTextActive,
                                                                ]}
                                                            >
                                                                {opt}
                                                            </Text>
                                                        </Pressable>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                </View>

                                {selectedExercises.length > 0 && (
                                    <View style={styles.selectedSection}>
                                        <Text style={styles.selectedHeader}>
                                            Selected ({selectedExercises.length})
                                        </Text>
                                        <View style={styles.selectedList}>
                                            {selectedExercises.map((exercise) => (
                                                <View key={exercise.id} style={styles.selectedItem}>
                                                    <View style={styles.selectedItemText}>
                                                        <Text style={styles.selectedTitle}>
                                                            {exercise.title}
                                                        </Text>
                                                        <Text style={styles.selectedMeta}>
                                                            {[exercise.type, exercise.bodyPart]
                                                                .filter(Boolean)
                                                                .join(' • ')}
                                                        </Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.selectedRemoveButton}
                                                        onPress={() =>
                                                            handleRemoveSelectedExercise(exercise.id)
                                                        }
                                                    >
                                                        <Ionicons name="close" size={16} color="#6b7280" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {loadingExercises ? (
                                    <Text style={styles.emptyStateText}>Loading exercises...</Text>
                                ) : filteredExercises.length === 0 ? (
                                    <Text style={styles.emptyStateText}>No exercises found.</Text>
                                ) : (
                                    filteredExercises.map((exercise) => {
                                        return (
                                            <View key={exercise.id} style={styles.exerciseItemContainer}>
                                                <TouchableOpacity
                                                    style={styles.exerciseRow}
                                                    onPress={() => handleSelectExercise(exercise)}
                                                    activeOpacity={0.85}
                                                >
                                                    <View style={styles.exerciseRowText}>
                                                        <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                                                        <Text style={styles.exerciseMeta}>
                                                            {[exercise.type, exercise.bodyPart]
                                                                .filter(Boolean)
                                                                .join(' • ')}
                                                        </Text>
                                                    </View>
                                                    <Ionicons
                                                        name="chevron-forward"
                                                        size={18}
                                                        color="#9ca3af"
                                                    />
                                                </TouchableOpacity>
                                                {exercise.isUserCreated && (
                                                    <TouchableOpacity
                                                        style={styles.exerciseDeleteButton}
                                                        onPress={() => handleDeleteCustomExercise(exercise.id)}
                                                    >
                                                        <Ionicons name="trash" size={16} color="#ef4444" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        );
                                    })
                                )}
                            </ScrollView>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
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
    inputAccessoryBar: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 12,
        backgroundColor: '#f3f4f6',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    inputAccessoryDone: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    inputAccessoryDoneText: {
        fontSize: 16,
        fontWeight: '600',
        color: BLUE,
    },
    keyboardDoneBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 16,
        backgroundColor: '#f3f4f6',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        zIndex: 1000,
    },
    keyboardDoneButton: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        backgroundColor: BLUE,
        borderRadius: 10,
    },
    keyboardDoneButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
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
    restOptionsRow: {
        flexDirection: 'row',
        gap: 4,
    },
    restOptionChip: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
    },
    restOptionChipActive: {
        backgroundColor: BLUE,
    },
    restOptionChipText: {
        fontSize: 12,
        color: '#6b7280',
    },
    restOptionChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    deleteSetButton: {
        padding: 4,
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
    modalAddButton: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: BLUE,
    },
    modalAddButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    modalAddButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    modalTabs: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    modalTabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    modalTabButtonActive: {
        backgroundColor: '#e0f2fe',
    },
    modalTabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    modalTabButtonTextActive: {
        color: '#111',
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
    filterRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    filterButtonWrap: {
        flex: 1,
        position: 'relative',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        minHeight: 44,
    },
    filterButtonActive: {
        backgroundColor: '#e0f2fe',
        borderColor: BLUE,
    },
    filterButtonText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
        marginRight: 8,
    },
    filterDropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        maxHeight: 220,
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    filterDropdownScroll: {
        maxHeight: 216,
    },
    filterDropdownOption: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    filterDropdownOptionActive: {
        backgroundColor: '#e0f2fe',
    },
    filterDropdownOptionText: {
        fontSize: 14,
        color: '#374151',
    },
    filterDropdownOptionTextActive: {
        color: '#111',
        fontWeight: '600',
    },
    exerciseLibrary: {
        flex: 1,
        minHeight: 160,
    },
    exerciseLibraryContent: {
        paddingBottom: 24,
    },
    exerciseItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    exerciseRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    exerciseDeleteButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#f3f4f6',
    },
    exerciseRowText: {
        flex: 1,
        paddingRight: 12,
    },
    exerciseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    exerciseMeta: {
        fontSize: 13,
        color: '#6b7280',
    },
    selectedSection: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
        marginBottom: 12,
    },
    selectedHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        marginBottom: 8,
    },
    selectedList: {
        gap: 8,
    },
    selectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    selectedItemText: {
        flex: 1,
        marginRight: 8,
    },
    selectedTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    selectedMeta: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    selectedRemoveButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        marginBottom: 6,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
        marginTop: 4,
    },
    addCustomFormContent: {
        padding: 20,
        paddingBottom: 40,
    },
    addCustomFormCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 20,
    },
    labeledInputGroup: {
        marginBottom: 12,
    },
    dropdownField: {
        marginBottom: 12,
    },
    dropdownLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    dropdownInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownValue: {
        fontSize: 15,
        color: '#111',
        flex: 1,
        marginRight: 8,
    },
    dropdownPlaceholder: {
        fontSize: 15,
        color: '#9ca3af',
        flex: 1,
        marginRight: 8,
    },
    dropdownMenu: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#fff',
        maxHeight: 220,
    },
    dropdownScroll: {
        maxHeight: 220,
    },
    dropdownOption: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownOptionText: {
        fontSize: 15,
        color: '#111',
    },
    dropdownEmpty: {
        fontSize: 14,
        color: '#6b7280',
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111',
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    formInputMultiline: {
        minHeight: 90,
        textAlignVertical: 'top',
    },
    formButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    formCancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    formCancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    formSaveButton: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: BLUE,
    },
    formSaveButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    formSaveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
