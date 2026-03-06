// EditWorkout.jsx
import React, { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import EditExerciseCard from "./FitnessHistoryEditExercise";

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function WorkoutEditFrame({ open, onClose, workout, onSave, miniStat }) {

    const start = workout.date || workout.completedAt;
    const end = workout.completedAt || start;

    const dateLabel = new Date(start).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });


    return (
        <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>            
            <SafeAreaView style={styles.page}>
            {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose}>
                        <Text style={styles.headerBtn}>X</Text>
                    </Pressable>

                    <Text style={styles.headerTitle}>Edit Workout</Text>

                    <Pressable onPress={() => onSave?.(workout)}>
                        <Text style={styles.headerBtn}>Save</Text>
                    </Pressable>
                </View>

            {/* Body */}
                <View style={styles.body}>
                {/* Top bar */}
                    <View style={styles.topRow}>
                        <View style={styles.topLeft}>
                            <Ionicons name="barbell-outline" size={22} color="#111" />
                            <Text style={styles.workoutTitle}>{workout.title || "Workout"}</Text>
                        </View>
                    </View>

                    {/* Date + time range */}
                    <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                        <Text style={styles.timeText}>
                            {formatTime(start)} – {formatTime(end)}
                        </Text>
                        <Text style={styles.dateText}>{dateLabel}</Text>
                    </View>


                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {/* Mini Stat */}
                        <View style={styles.miniStatRow}>
                            {(miniStat || []).map((c, i) => (
                                <View key={i} style={styles.chip}>
                                    <Ionicons name={c.icon} size={16} color="#374151" />
                                    <Text style={styles.chipText}>{c.text}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Exercises */}
                        <View style={{marginTop: 30}}>
                            {(workout.exercises || []).map((exerciseObj, i) => (
                                <EditExerciseCard
                                    exerciseObj={exerciseObj}
                                />
                            ))}



                        </View>


                        {/* Notes */}
                        <View style={styles.notesRow}>
                            <Text style={styles.notesLabel}>Workout Notes</Text>
                            <View style={styles.notesRight}>
                                <Ionicons name="pencil-outline" size={18} color="#111" />
                                <Text style={styles.notesAdd}>Add</Text>
                            </View>
                        </View>


                        <Pressable>
                            <Text>Remove Workout</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: "#fff" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },

    headerTitle: {
        position: "absolute",
        left: 0,
        right: 0,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
    },

    headerBtn: { fontSize: 16, fontWeight: "700", color: "#111" },

    body: { flex: 1, padding: 16 },

    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

    workoutTitle: { fontSize: 18, fontWeight: "700", color: "#111" },

    timeRow: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    timeText: { color: "#374151", fontSize: 14, fontWeight: "600" },
    dateText: { color: "#6b7280", fontSize: 13, fontWeight: "600" },

    miniStatRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
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

    notesRow: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    notesLabel: { color: "#6b7280", fontWeight: "700" },
    notesRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    notesAdd: { color: "#111", fontWeight: "700" },
});