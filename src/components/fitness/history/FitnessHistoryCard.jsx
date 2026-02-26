import React from 'react';
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
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 14,
        padding: 16,
        elevation: 3,
        margin: 10,
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
});
