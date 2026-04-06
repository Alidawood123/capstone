import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#00b4d8';

export default function FitnessHomeContent({ onStartEmptyWorkout, onAnalyzeVideo }) {
    return (
        <View style={styles.content}>
            <TouchableOpacity
                style={styles.startWorkoutButton}
                activeOpacity={0.85}
                onPress={onStartEmptyWorkout}
            >
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.startWorkoutText}>Start Empty Workout</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.startWorkoutButton, styles.analyzeButton]}
                activeOpacity={0.85}
                onPress={onAnalyzeVideo}
            >
                <Ionicons name="analytics-outline" size={24} color="#fff" />
                <Text style={styles.startWorkoutText}>Analyze Workout Video</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    startWorkoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: BLUE,
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        marginHorizontal: 24,
        marginTop: 24,
    },
    analyzeButton: {
        backgroundColor: '#0077a8',
    },
    startWorkoutText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
});