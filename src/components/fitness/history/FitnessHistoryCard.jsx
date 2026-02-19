import React from 'react';
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
        margin: 10
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
        borderRadius: 25
    }
});
