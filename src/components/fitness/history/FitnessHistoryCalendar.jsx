import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import FitnessHistoryCard from './FitnessHistoryCard';

const GREEN = '#22c55e';
const BLUE = '#2563eb';

export default function FitnessHistoryCalendar({ workoutHistory = [], onRefresh }) {
    const [selectedDate, setSelectedDate] = useState(null);

    const markedDates = useMemo(() => {
        const marks = {};
        const hasWorkout = new Set(workoutHistory.map((w) => w.isoDate).filter(Boolean));

        hasWorkout.forEach((isoDate) => {
            marks[isoDate] = { marked: true, dotColor: GREEN };
        });

        if (selectedDate) {
            marks[selectedDate] = {
                ...marks[selectedDate],
                selected: true,
                selectedColor: BLUE,
            };
        }

        return marks;
    }, [workoutHistory, selectedDate]);

    const selectedWorkouts = useMemo(() => {
        return workoutHistory.filter((w) => w.isoDate === selectedDate);
    }, [workoutHistory, selectedDate]);

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            <Calendar
                markedDates={markedDates}
                onDayPress={(day) => setSelectedDate(day.dateString)}
                theme={{ todayTextColor: BLUE, arrowColor: '#111827' }}
            />

            <View style={styles.listSection}>
                {!selectedDate ? (
                    <Text style={styles.hint}>Tap a date to view workouts</Text>
                ) : selectedWorkouts.length === 0 ? (
                    <Text style={styles.hint}>No workouts on this day</Text>
                ) : (
                    selectedWorkouts.map((workout, i) => (
                        <FitnessHistoryCard
                            key={`${workout.completedAt || workout.date}-${i}`}
                            workout={workout}
                        />
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 12, paddingBottom: 40 },
    listSection: { marginTop: 12 },
    hint: { color: '#6b7280', fontSize: 14 },
});
