import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import FitnessHistoryCalendar from '../../components/fitness/history/FitnessHistoryCalendar';
import { getWorkouts } from '../../services/workoutStorage';

import { getAuth } from '@react-native-firebase/auth';

/** Normalize stored workout to include isoDate (YYYY-MM-DD) for calendar. */
function withIsoDate(workout) {
    const dateStr = workout.date || workout.completedAt || '';
    const isoDate = dateStr ? dateStr.slice(0, 10) : '';
    return { ...workout, isoDate };
}

export default function FitnessHistoryContent() {
    const auth = getAuth();
    const user = auth.currentUser;

    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadWorkouts = useCallback(async () => {
        setLoading(true);
        try {
            const workouts = await getWorkouts(user);
            setWorkoutHistory(workouts.map(withIsoDate));
        } catch (error) {
            console.error('Failed to load workout history:', error);
            setWorkoutHistory([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWorkouts();
    }, [loadWorkouts]);

    if (loading) {
        return (
            <View style={[styles.content, styles.centered]}>
                <ActivityIndicator size="large" color="#00b4d8" />
                <Text style={styles.loadingText}>Loading history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.content}>
            <FitnessHistoryCalendar workoutHistory={workoutHistory} onRefresh={loadWorkouts} />
        </View>
    );
}

const styles = StyleSheet.create({
    content: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
});
