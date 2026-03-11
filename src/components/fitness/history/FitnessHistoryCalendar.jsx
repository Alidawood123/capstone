import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import FitnessHistoryCard from './FitnessHistoryCard';

const GREEN = '#22c55e';
const BLUE = '#2563eb';

<<<<<<< Updated upstream
export default function HistoryCalendar({ workoutHistory = [] }) {
=======
export default function FitnessHistoryCalendar({ workoutHistory = [], onRefresh }) {
>>>>>>> Stashed changes
    const [selectedDate, setSelectedDate] = useState(null);

    const markedDates = useMemo(() => {
        const marks = {};
<<<<<<< Updated upstream

        workoutHistory.forEach((w) => {
            marks[w.isoDate] = { selected: true, selectedColor: GREEN };
=======
        const hasWorkout = new Set(workoutHistory.map((w) => w.isoDate).filter(Boolean));

        hasWorkout.forEach((isoDate) => {
            marks[isoDate] = { marked: true, dotColor: GREEN };
>>>>>>> Stashed changes
        });

        if (selectedDate) marks[selectedDate] = { selected: true, selectedColor: BLUE };

        return marks;

    }, [workoutHistory, selectedDate]);


    const selectedWorkouts = useMemo(() => {
<<<<<<< Updated upstream
        return workoutHistory.filter((w) => w.isoDate === selectedDate);    
=======
        return workoutHistory.filter((w) => w.isoDate === selectedDate);
>>>>>>> Stashed changes
    }, [workoutHistory, selectedDate]);

    return (
    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
    
        <Calendar markedDates={markedDates} onDayPress={(day) => setSelectedDate(day.dateString)}
            theme={{ todayTextColor: BLUE, arrowColor: '#111827' }}
        />

        <View style={{ marginTop: 12 }}>
            {!selectedDate ? (
                <Text style={{ color: '#6b7280' }}>Tap a date to view workouts</Text>
            ) : selectedWorkouts.length === 0 ? (
                <Text style={{ color: '#6b7280' }}>No workouts on this day</Text>
            ) : (
                selectedWorkouts.map((w, i) => (
                    <FitnessHistoryCard key={`${w.isoDate}-${i}`} workoutDay={w} />
                ))
            )}
        </View>
    </ScrollView>
    );
}
