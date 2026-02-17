import {React, useState} from 'react';

import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import FitnessHistoryCard from '../../components/fitness/history/FitnessHistoryCard';
import HistoryCalendar from '../../components/fitness/history/FitnessHistoryCalendar';

// LandingPage Component - The first page users see after logging in
export default function FitnessHistoryContent({ historyTab }) {

    


    // Temporary Data
    const workoutHistory = [
        {
            name: "Push Day",
            date: "Sun, Nov 9, 2025",
            isoDate: "2025-11-09",
            timestart: "10:00 AM",
            timeend: "11:15 AM",
            length: "75 mins",
            sets: 10,
            weight: "7,290 lbs",
            workouts: [
                {type: "Push-ups", sets: 1},
                {type: "Barbell Bench Press", sets: 3},
                {type: "Overhead Press", sets: 3},
                {type: "Tricep Dips", sets: 3},
            ]
        },

        {
            name: "Pull Day",
            date: "Fri, Nov 7, 2025",
            isoDate: "2025-11-07",
            timestart: "9:30 AM",
            timeend: "11:00 AM",
            length: "90 mins",
            sets: 16,
            weight: "9,840 lbs",
            workouts: [
                { type: "Pull-ups", sets: 4 },
                { type: "Barbell Rows", sets: 4 },
                { type: "Lat Pulldowns", sets: 3 },
                { type: "Seated Cable Rows", sets: 3 },
                { type: "Bicep Curls", sets: 2 },
            ],
        },

        {
            name: "Leg Day",
            date: "Wed, Nov 5, 2025",
            isoDate: "2025-11-05",
            timestart: "10:00 AM",
            timeend: "11:20 AM",
            length: "80 mins",
            sets: 18,
            weight: "12,560 lbs",
            workouts: [
                { type: "Barbell Squats", sets: 4 },
                { type: "Leg Press", sets: 4 },
                { type: "Romanian Deadlifts", sets: 3 },
                { type: "Leg Extensions", sets: 3 },
                { type: "Hamstring Curls", sets: 2 },
                { type: "Calf Raises", sets: 2 },
            ],
        },

        {
            name: "Leg Day",
            date: "Wed, Nov 5, 2025",
            isoDate: "2025-11-05",
            timestart: "10:00 AM",
            timeend: "11:20 AM",
            length: "80 mins",
            sets: 18,
            weight: "12,560 lbs",
            workouts: [
                { type: "Barbell Squats", sets: 4 },
                { type: "Leg Press", sets: 4 },
                { type: "Romanian Deadlifts", sets: 3 },
                { type: "Leg Extensions", sets: 3 },
                { type: "Hamstring Curls", sets: 2 },
                { type: "Calf Raises", sets: 2 },
            ],
        },



    ]


    return (
        <View style={{ flex: 1 }}>
            {historyTab === 'historyWorkout' ? (
                <ScrollView>
                    {workoutHistory.map((workoutDay, i) => (
                        <View key={i}>
                            <Text style={styles.dateHeading}>{workoutDay.date}</Text>
                            <FitnessHistoryCard workoutDay={workoutDay} />
                        </View>
                    ))}
                </ScrollView>
            ) : historyTab === 'historyCalendar' ? (
                <View>
                    <HistoryCalendar workoutHistory={workoutHistory} />
                </View>
            ) : (
            <View>
                <Text>Unknown tab</Text>
            </View>
            )}
        </View>
    );
}

// Local StyleSheet For NutritionPage 
const styles = StyleSheet.create({ 
    dateHeading: {
        marginLeft: 12, 
        marginTop: 10, 
        fontWeight: '600', 
        color: '#6b7280'
    }



 });
