import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';

import WorkoutDetailsFrame from "./FitnessHistoryWorkoutDetails";
import WorkoutEditFrame from "./FitnessHistoryEdits";

import { getAuth } from "@react-native-firebase/auth";
import Toast from "react-native-toast-message";
import { removeWorkout, updateWorkout } from '../../../services/workoutStorage';

function formatDuration(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const ss = s % 60;
    if (h > 0)
        return `${h}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    return `${mm}:${String(ss).padStart(2, '0')}`;
}

// Side Actions
function RightActions({ dragX, onEdit, onDelete }) {
    const animStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            dragX.value,
            [-130, -130 * 0.3, 0],
            [1, 0.6, 0],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            dragX.value,
            [-130, 0],
            [1, 0.85],
            Extrapolation.CLAMP
        );
        return { opacity, transform: [{ scale }] };
    });

    return (
        <Reanimated.View style={[styles.actionsContainer, animStyle]}>
            <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={onEdit} activeOpacity={0.85}>
                <Ionicons name="pencil" size={19} color="#fff" />
                <Text style={styles.actionLabel}>Edit</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete} activeOpacity={0.85}>
                <Ionicons name="trash" size={19} color="#fff" />
                <Text style={styles.actionLabel}>Delete</Text>
            </Pressable>
        </Reanimated.View>
    );
}

export default function FitnessHistoryCard({ workout, setWorkoutHistory }) {
    if (!workout) return null;

    const auth = getAuth();
    const user = auth.currentUser;

    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const dateStr = workout.date || workout.completedAt;
    const startDate = dateStr ? new Date(dateStr) : new Date();
    const durationSeconds = Number(workout.durationSeconds) || 0;
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);

    const timestart = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeend = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const length = formatDuration(durationSeconds);

    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const totalSets = exercises.reduce((acc, item) => acc + (item.sets?.length || 0), 0);

    const totalLbs = useMemo(() => {
        let total = 0;
        (workout.exercises || []).forEach((exercise) => {
            (exercise.sets || []).forEach((set) => total += Number(set.weight) * Number(set.reps));
        });
        return total;
    }, [workout]);

    const workoutItems = exercises.map((item) => ({
        type: item.exercises?.[0]?.title || 'Exercise',
        sets: item.sets?.length || 0,
    }));

    const miniStat = [
        { icon: "time-outline", text: length },
        { icon: "barbell-outline", text: `${totalSets} sets` },
        { icon: "stats-chart-outline", text: `${totalLbs} lbs` },
    ];

    const workoutItem = workoutItems[0];

    const handleRemoveWorkout = () => {
        try{
            const workoutId = workout._id;
            removeWorkout(user, workoutId);
            setWorkoutHistory((prev) => prev.filter((w) => w._id !== workoutId));
            Toast.show({ type: 'success', text1: 'Removed', text2: 'Workout deleted.' });
        }
        catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to remove workout.' });
        } finally {
            setEditOpen(false);
        }
    };

    const handleSaveWorkout = (updatedWorkout) => {
        try {
            const workoutId = updatedWorkout._id;
            updateWorkout(user, workoutId, updatedWorkout);
            setWorkoutHistory((prev) =>
                prev.map((w) => w._id === workoutId ? { ...w, ...updatedWorkout } : w)
            );
            Toast.show({ type: 'success', text1: 'Saved', text2: 'Workout updated.' });
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to save workout.' });
        } finally {
            setEditOpen(false);
        }
    };

    return (
        <View style={styles.wrapper}>
            <Swipeable
                renderRightActions={(_progress, drag) => (
                    <RightActions dragX={drag} onEdit={() => setEditOpen(true)} onDelete={handleRemoveWorkout} />
                )}
                rightThreshold={130 / 2}
                overshootRight={false}
                friction={2}
                enableTrackpadTwoFingerGesture
                containerStyle={styles.swipeableContainer}
            >
                <View style={styles.root}>
                    <View style={styles.titleRow}>
                        <View style={styles.iconBadge}>
                            <Ionicons name="barbell-outline" size={17} color="#6366f1" />
                        </View>
                        <Text style={styles.titleText} numberOfLines={1}>
                            {workout.title || 'Workout'}
                        </Text>
                    </View>

                    <Text style={styles.timeText}>{timestart} – {timeend}</Text>

                    <View style={styles.miniStatRow}>
                        {miniStat.map((c, i) => (
                            <View key={i} style={styles.chip}>
                                <Ionicons name={c.icon} size={14} color="#6366f1" />
                                <Text style={styles.chipText}>{c.text}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.exerciseRow}>
                        <View style={styles.dot} />
                        <Text style={styles.exerciseText}>
                            {workoutItem
                                ? `${workoutItem.type} – ${workoutItem.sets} set${workoutItem.sets !== 1 ? "s" : ""}`
                                : "—"}
                        </Text>
                    </View>

                    <Pressable onPress={() => setDetailsOpen(true)} style={styles.moreBtn}>
                        <Text style={styles.moreTxt}>Show more</Text>
                        <Ionicons name="chevron-down" size={14} color="#6366f1" />
                    </Pressable>
                </View>
            </Swipeable>

            <WorkoutDetailsFrame
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                workout={workout}
                workoutItems={workoutItems}
                date={dateStr}
                miniStat={miniStat}
            />

            <WorkoutEditFrame
                open={editOpen}
                onClose={() => setEditOpen(false)}
                workout={workout}
                saveWorkout={handleSaveWorkout}
                removeWorkout={handleRemoveWorkout}
                miniStat={miniStat}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 16,
        marginVertical: 6,
    },
    swipeableContainer: {
        borderRadius: 16,
        border: '2px solid black',
        borderWidth: 1,
        overflow: 'hidden',
    },

    // Actions
    actionsContainer: {
        width: 130,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    actionBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    actionLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    editBtn: { backgroundColor: '#6366f1' },
    deleteBtn: { backgroundColor: '#ef4444' },

    // Card
    root: {
        backgroundColor: '#fff',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 6,
    },
    iconBadge: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: '#eef2ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    timeText: {
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 12,
        marginLeft: 2,
    },
    miniStatRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    chipText: {
        color: '#374151',
        fontSize: 12,
        fontWeight: '600',
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 2,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#6366f1',
    },
    exerciseText: {
        fontSize: 14,
        color: '#4b5563',
    },
    moreBtn: {
        marginTop: 10,
        paddingTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    moreTxt: {
        fontSize: 13,
        color: '#6366f1',
        fontWeight: '600',
    },
});
