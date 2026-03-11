import React from 'react';
<<<<<<< Updated upstream
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function FitnessHistoryCard({ workoutDay }) {
    return (
        <View style={styles.root}>
            <View style={styles.title}>
                <Ionicons name="barbell-outline" size={24} />
                <Text style={{fontSize: 18}}>{workoutDay.name}</Text>
            </View>
            
            <View>
                <Text style={{fontSize: 16, color: "#454545"}}>{workoutDay.timestart} - {workoutDay.timeend}</Text>
            </View>

            <View style={styles.miniInfo}>
                <Text style={styles.smInfo}>{workoutDay.length}</Text>
                <Text style={styles.smInfo}>{workoutDay.sets} Sets</Text>
                <Text style={styles.smInfo}>{workoutDay.weight}</Text>
            </View>
            
            
            <View>
                {workoutDay.workouts.map((workout, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
                        <Text style={{ fontSize: 20, marginRight: 5, lineHeight: 18, color: "#454545" }}>•</Text>
                        <Text style={{ fontSize: 16, color: "#454545" }}>{workout.type} - {workout.sets}</Text>
=======
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Format seconds as m:ss or h:mm:ss */
function formatDuration(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const ss = s % 60;
    if (h > 0) {
        return `${h}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    }
    return `${mm}:${String(ss).padStart(2, '0')}`;
}

/** Stored workout shape: { title, date, durationSeconds, completedAt, exercises } */
export default function FitnessHistoryCard({ workout }) {
    if (!workout) return null;

    const dateStr = workout.date || workout.completedAt;
    const startDate = dateStr ? new Date(dateStr) : new Date();
    const durationSeconds = Number(workout.durationSeconds) || 0;
    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);

    const timestart = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeend = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const length = formatDuration(durationSeconds);

    const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
    const totalSets = exercises.reduce((acc, item) => acc + (item.sets?.length || 0), 0);
    const workoutItems = exercises.map((item) => {
        const name = item.exercises?.[0]?.title || 'Exercise';
        const sets = item.sets?.length || 0;
        return { type: name, sets };
    });

    return (
        <View style={styles.root}>
            <View style={styles.titleRow}>
                <Ionicons name="barbell-outline" size={24} color="#111" />
                <Text style={styles.titleText}>{workout.title || 'Workout'}</Text>
            </View>

            <View>
                <Text style={styles.timeText}>{timestart} – {timeend}</Text>
            </View>

            <View style={styles.miniInfo}>
                <Text style={styles.smInfo}>{length}</Text>
                <Text style={styles.smInfo}>{totalSets} Sets</Text>
                <Text style={styles.smInfo}>—</Text>
            </View>

            <View>
                {workoutItems.map((item, i) => (
                    <View key={i} style={styles.exerciseRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.exerciseText}>
                            {item.type} – {item.sets} set{item.sets !== 1 ? 's' : ''}
                        </Text>
>>>>>>> Stashed changes
                    </View>
                ))}
            </View>
        </View>
    );
}

<<<<<<< Updated upstream


const styles = StyleSheet.create({  

=======
const styles = StyleSheet.create({
>>>>>>> Stashed changes
    root: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 14,
        padding: 16,
        elevation: 3,
<<<<<<< Updated upstream
        margin: 10
=======
        margin: 10,
>>>>>>> Stashed changes
    },

    title: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 5
    },

    miniInfo: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 12,
    },
    smInfo: {
        backgroundColor: '#e4e4e4',
        padding: 5,
<<<<<<< Updated upstream
        borderRadius: 25
    }
=======
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
>>>>>>> Stashed changes
});
