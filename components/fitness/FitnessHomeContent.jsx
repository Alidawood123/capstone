import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#00b4d8';

export default function FitnessHomeContent() {
    return (
        <View style={styles.content}>
            <TouchableOpacity style={styles.startWorkoutButton} activeOpacity={0.85}>
                <Ionicons name="play" size={24} color="#fff" />
                <Text style={styles.startWorkoutText}>Start Empty Workout</Text>
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
    startWorkoutText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
});
