import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import WorkoutDetailsFrame from "./FitnessHistoryWorkoutDetails";
import WorkoutEditFrame from "./FitnessHistoryEdits";

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

export default function FitnessHistoryCard({ workout }) {
    if (!workout) return null;
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const editWorkout = () => setEditOpen(true);

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

        (workout.exercises).forEach((exercise) => {
            (exercise.sets).forEach((set) => {
                const weight = Number(set.weight);
                const reps = Number(set.reps);

                total += weight * reps;
            });
        });

        return total;
    }, [workout]);

    const workoutItems = exercises.map((item) => {
        const name = item.exercises?.[0]?.title || 'Exercise';
        const sets = item.sets?.length || 0;
        return { type: name, sets };
    });

    const miniStat = [
        { icon: "time-outline", text: `${length}` },
        { icon: "barbell-outline", text: `${totalSets} sets` },
        { icon: "stats-chart-outline", text: `${totalLbs} lbs total` }
    ];

    const workoutItem = workoutItems[0];
    


    
    const removeWorkout = (WorkoutID) => {
        console.log(`Removing ${WorkoutID}`)

    }

    const displayActions = () => (
        <View style={styles.actions}>
            <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={editWorkout}>
                <Ionicons name="pencil-outline" size={20} color="#fff" />
            </Pressable>

            <Pressable style={[styles.actionBtn, styles.deleteBtn]} onPress={() => removeWorkout(workout.title)}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
            </Pressable>
        </View>
    );

    return (

        <View style={styles.swipeWrap}>
            <Swipeable
                renderRightActions={displayActions}
                overshootRight={true}
                overshootFriction={8}
                rightThreshold={100}
            >
                <View style={styles.root}>
                    <View style={styles.titleRow}>
                        <Ionicons name="barbell-outline" size={24} color="#111" />
                        <Text style={styles.titleText}>{workout.title || 'Workout'}</Text>
                    </View>

                    <View>
                        <Text style={styles.timeText}>{timestart} – {timeend}</Text>
                    </View>


                    <View style={styles.miniStatRow}>
                        {miniStat.map((c, i) => (
                            <View key={i} style={styles.chip}>
                                <Ionicons name={c.icon} size={16} color="#374151" />
                                <Text style={styles.chipText}>{c.text}</Text>
                            </View>
                        ))}
                    </View>

                    <View>
                        <View style={styles.exerciseRow}>
                            <Text style={styles.bullet}>•</Text>
                            <Text style={styles.exerciseText}>
                                {workoutItem ? `${workoutItem.type} – ${workoutItem.sets} set${workoutItem.sets !== 1 ? "s" : ""}` : "—"}
                            </Text>
                        </View>

                        <Pressable onPress={() => setDetailsOpen(true)} style={styles.moreBtn}>
                            <Text style={styles.moreTxt}>Show more</Text>
                        </Pressable>

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
                            onSave={(updated) => {setEditOpen(false);}}
                            miniStat={miniStat}
                        />

                    </View>
                </View>
            </Swipeable>
        </View>
    );
}

const styles = StyleSheet.create({
    swipeWrap: {
        margin: 10,
        borderRadius: 14,
        overflow: 'hidden',

        borderWidth: 1,
        borderColor: '#dbeafe',
        backgroundColor: '#6366f1',
    },

    root: {
        backgroundColor: '#fff',
        padding: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 5,
    },
    titleText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
    },
    timeText: {
        fontSize: 16,
        color: '#454545',
    },
    miniInfo: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 12,
    },
    smInfo: {
        backgroundColor: '#e4e4e4',
        padding: 5,
        borderRadius: 25,
        fontSize: 13,
        color: '#374151',
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    bullet: {
        fontSize: 20,
        marginRight: 5,
        lineHeight: 18,
        color: '#454545',
    },
    exerciseText: {
        fontSize: 16,
        color: '#454545',
    },

    actions: {
        flexDirection: 'row',
        alignItems: 'stretch',
        height: '100%',
    },
    actionBtn: {
        width: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },

    editBtn: { backgroundColor: '#6366f1' },
    deleteBtn: { backgroundColor: '#ef4444' },

    moreBtn: {
        marginTop: 8,
        paddingTop: 5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    moreTxt: {
        fontSize: 14,
        color: "#374151",
        fontWeight: "600",
    },
    miniStatRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
  paddingVertical: 12,
},

chip: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  backgroundColor: "#f3f4f6",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 999,
},

chipText: {
  color: "#111",
  fontSize: 13,
  fontWeight: "600",
},

});


