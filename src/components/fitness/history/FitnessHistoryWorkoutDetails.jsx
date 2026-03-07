// WorkoutDetailsFrame.jsx
import React, { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ExerciseCard from "./FitnessHistoryExerciseCards";

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function WorkoutDetailsFrame({ open, onClose, workout, miniStat}) {
    const [showExercises, setShowExercises] = useState(false);
    
    const start = workout.date || workout.completedAt;
    const end = workout.completedAt || start;

    const dateLabel = new Date(start).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    


    return (
        <Modal visible={open} transparent animationType="fade">
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={() => {}}>
                
                {/* Top bar */}
                    <View style={styles.topRow}>
                        <View style={styles.topLeft}>
                            <Ionicons name="barbell-outline" size={22} color="#111" />
                            <Text style={styles.title}>{workout.title || "Workout"}</Text>
                        </View>

                        <Pressable onPress={onClose} hitSlop={10}>
                            <Ionicons name="close" size={22} color="#111" />
                        </Pressable>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Mini Stat */}
                        <View style={styles.miniStatRow}>
                            {miniStat.map((c, i) => (
                                <View key={i} style={styles.chip}>
                                    <Ionicons name={c.icon} size={16} color="#374151" />
                                    <Text style={styles.chipText}>{c.text}</Text>
                                </View>
                            ))}
                        </View>

                    {/* Date + time range */}
                        <Text style={styles.dateText}>{dateLabel}</Text>
                        
                        <View style={styles.timeRow}>
                            <Ionicons name="time-outline" size={16} color="#6b7280" />
                            <Text style={styles.timeText}>
                                {formatTime(start)} – {formatTime(end)}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                    {/* Exercises */}
                        <Pressable style={styles.exercisesHeader} onPress={() => setShowExercises(v => !v)}>
                            <Text style={styles.exercisesTitle}>Exercises</Text>

                            <Ionicons
                                name={showExercises ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#374151"
                            />
                        </Pressable>



                        {showExercises && (
                            (workout.exercises || []).map((exerciseObj, i) => (
                                <ExerciseCard key={exerciseObj.id || i} exerciseObj={exerciseObj} />
                            ))
                        )}

                    {/* Notes */}
                        <View style={styles.notesRow}>
                            <Text style={{color: "#6b7280", fontWeight: "700"}}>Workout Notes</Text>
                        </View>

                        <View style={styles.notesBox}>
                            <Text style={styles.notesTextDisplay}>
                                {workout?.notes?.trim() ? workout.notes : ""}
                            </Text>
                        </View>
                    </ScrollView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
    },

    sheet: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        maxHeight: "80%",
    },

    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    title: { fontSize: 18, fontWeight: "700", color: "#111" },

    miniStatRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    chipText: { color: "#111", fontSize: 13, fontWeight: "600" },

    dateText: { marginTop: 10, color: "#6b7280", fontSize: 13 },
    timeRow: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 6 },
    timeText: { color: "#374151", fontSize: 14, fontWeight: "600" },

    divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 12 },
    
    exercisesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
    },
    exercisesTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111",
    },

    notesRow: {
        marginTop: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    notesBox: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 12,
        backgroundColor: "#fafafa",
    },

    notesTextDisplay: {
        fontSize: 14,
        color: "#374151",
        lineHeight: 20,
    },
});

/* 
  {
    "title": "Chest Day",
    "date": "2026-03-05T23:05:45.546Z",
    "durationSeconds": 63,
    "completedAt": "2026-03-05T23:06:57.282Z",
    "exercises": [
      {
        "id": "exercise_355_1772751974440",
        "type": "single",
        "exercises": [
          {
            "id": "355",
            "title": "Reverse Band Bench Press",
            "description": "Reverse Band Bench Press exercise.",
            "type": "barbell",
            "bodyPart": "arms",
            "equipment": "",
            "level": "",
            "rating": ""
          }
        ],
        "sets": [
          {
            "weight": "50",
            "reps": "12",
            "distance": "",
            "time": "",
            "restSeconds": 60,
            "completed": true
          },
          {
            "weight": "20",
            "reps": "15",
            "distance": "",
            "time": "",
            "restSeconds": 60,
            "completed": true
          },
          {
            "weight": "10",
            "reps": "13",
            "distance": "",
            "time": "",
            "restSeconds": 60,
            "completed": false
          }
        ]
      }
    ],
    "isoDate": "2026-03-05"
  }
]


*/