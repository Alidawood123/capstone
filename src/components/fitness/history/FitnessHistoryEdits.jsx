// EditWorkout.jsx
import React, { useState, useEffect, } from "react";
import { View, Text, Pressable, Modal, StyleSheet, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import EditExerciseCard from "./FitnessHistoryEditExercise";

import { searchExercises, ensureExercisesLoaded } from "../../../services/exerciseParser";

function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function WorkoutEditFrame({ open, onClose, workout, saveWorkout, removeWorkout, miniStat }) {
    // Edit Status
    const [editedWorkout, setEditedWorkout] = useState(workout);
    
    // Notes
    const [notes, setNotes] = useState(editedWorkout.notes || "");
    const [editingNotes, setEditingNotes] = useState(false);
    
    // Title
    const [editingTitle, setEditingTitle] = useState(false);
    const [title, setTitle] = useState(workout.title);

    // Add Exercise
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState("");
    const [filteredExercises, setFilteredExercises] = useState([]);

    const start = workout.date || workout.completedAt;
    const end = workout.completedAt || start;

    const dateLabel = new Date(start).toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric"
    });

    function defaultSet() {
        return {
            weight: "", reps: "", distance: "",
            time: "", restSeconds: 60, completed: false,
        };
    }

    // Edit
    useEffect(() => {
        setEditedWorkout(workout);
        setNotes(workout?.notes || "");
        setTitle(workout.title || "");
    }, [workout]);

    // Remove
    function removeExercise(id) {
        setEditedWorkout((prev) => ({
            ...prev,
            exercises: (prev.exercises || []).filter(
                (exercise) => exercise.id !== id
            ),
        }));
    }


    // Add Exercise Method
    function addExercise() {
        setExerciseSearch("");
        setFilteredExercises(searchExercises(""));
        setShowExerciseModal(true);
    }

    function handleSelectExercise(exercise) {
        const newExerciseItem = {
            id: `exercise_${exercise.id}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: "single",
            exercises: [exercise],
            sets: [defaultSet()],
        };

        setEditedWorkout((prev) => ({
            ...prev,
            exercises: [...(prev.exercises || []), newExerciseItem],
        }));

        setShowExerciseModal(false);
    }

    useEffect(() => {
        if (!showExerciseModal) return;
        setFilteredExercises(searchExercises(exerciseSearch || ""));
    }, [exerciseSearch, showExerciseModal]);

    useEffect(() => {
        async function loadExercises() {
            await ensureExercisesLoaded();
            setFilteredExercises(searchExercises(""));
        }

        loadExercises();
    }, []);

    return (
        <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>            
            {/* Main Page */}
            <SafeAreaView style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose}>
                        <Text style={styles.headerBtn}>Cancel</Text>
                    </Pressable>

                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#111" }}>Edit Workout</Text>
        
                    <Pressable onPress={() => saveWorkout(editedWorkout)}>
                        <Text style={styles.headerBtn}>Save</Text>
                    </Pressable>
                </View>

                {/* Body */}
                <View style={styles.body}>
                    {/* Top bar */}
                    <View style={styles.topLeft}>
                        <Ionicons name="barbell-outline" size={22} color="#111" />

                        {editingTitle ? (
                            <TextInput style={styles.workoutTitleInput} value={title} autoFocus placeholder="Workout"
                                onChangeText={(text) => {
                                    setTitle(text);
                                    setEditedWorkout((prev) => ({ ...prev, title: text }));
                                }}
                                onBlur={() => setEditingTitle(false)}
                                onSubmitEditing={() => setEditingTitle(false)}
                            />
                        ) : ( <Text style={{fontSize: 18, fontWeight: "700", color: "#111"}}>{title}</Text> )}

                        <Pressable onPress={() => setEditingTitle(true)} style={{padding: 4}}>
                            <Ionicons name="pencil-outline" size={16} color="#6b7280" />
                        </Pressable>
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
                        <View style={{ marginTop: 30 }}>
                            {(editedWorkout.exercises || []).map((exerciseObj) => (
                                <EditExerciseCard key={exerciseObj.id} removeExercise={() => removeExercise(exerciseObj.id)} exerciseObj={exerciseObj}
                                />
                            ))}
                        </View>
                        

                        <Pressable style={styles.addExerciseBtn} onPress={addExercise}>
                            <Ionicons name="add-circle-outline" size={18} color="#fff" />
                            <Text style={{color: "#fff", fontWeight: "700"}}>Add Exercise</Text>
                        </Pressable>

                        {/* Edit/Add Notes */}
                        <View>
                            <View style={styles.notesRow}>
                                <Text style={styles.notesLabel}>Workout Notes</Text>
                            </View>

                            <Pressable onPress={() => setEditingNotes(true)} style={styles.notesDisplay}>
                                {editingNotes ? (
                                    <TextInput style={styles.notesInput} multiline autoFocus
                                        placeholder="Write workout notes..." value={notes}
                                        onChangeText={(text) => {
                                            setNotes(text);
                                            setEditedWorkout((prev) => ({ ...prev, notes: text }));
                                        }}
                                        onBlur={() => setEditingNotes(false)}
                                    />
                                ) : (
                                    <Text style={styles.notesText}>
                                        {notes?.trim() ? notes : "Tap to add notes"}
                                    </Text>
                                )}
                            </Pressable>
                        </View>



                        {/* Remove Workout */}
                        <Pressable style={styles.removeWorkoutBtn} onPress={removeWorkout}>
                            <Ionicons name="trash-outline" size={18} color="#fff" />
                            <Text style={{color: "#dc2626", fontWeight: "700",}}>Remove Workout</Text>
                        </Pressable>
                    
                    </ScrollView>
                </View>
            </SafeAreaView>

            {/* Add Exercise Modal */}
            <Modal visible={showExerciseModal} transparent animationType="slide" onRequestClose={() => setShowExerciseModal(false)}>
                <Pressable style={styles.exerciseModalBackdrop} onPress={() => setShowExerciseModal(false)}>

                    <Pressable style={styles.exerciseModalCard} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.exerciseModalHeader}>
                            <Text style={styles.exerciseModalTitle}>Add Exercise</Text>

                            <Pressable onPress={() => setShowExerciseModal(false)}>
                                <Ionicons name="close" size={24} color="#111" />
                            </Pressable>
                        </View>
                        
                        {/* Search */}
                        <View style={styles.exerciseSearchWrap}>
                            <Ionicons name="search" size={18} color="#9ca3af" />
                            <TextInput style={styles.exerciseSearchInput} placeholder="Search exercises..."
                                value={exerciseSearch} onChangeText={setExerciseSearch} />
                        </View>
                        
                        {/* Exercise List */}
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredExercises.length === 0 ? (
                                <Text style={styles.exerciseEmptyText}>No exercises found.</Text>
                            ) : (
                                filteredExercises.map((exercise) => (
                                    <Pressable key={exercise.id} style={styles.exerciseItem} onPress={() => handleSelectExercise(exercise)}>
                                        <View>
                                            <Text style={styles.exerciseItemTitle}>{exercise.title}</Text>
                                            <Text style={styles.exerciseItemMeta}>
                                                {[exercise.type, exercise.bodyPart].filter(Boolean).join(" • ")}
                                            </Text>
                                        </View>
                                        <Ionicons name="add-circle-outline" size={20} color="#26b5dc" />
                                    </Pressable>
                                ))
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
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

    headerBtn: { fontSize: 16, fontWeight: "700", color: "#111" },

    body: { flex: 1, padding: 16 },

    topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },

    workoutTitleInput: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
        borderBottomWidth: 1,
        borderBottomColor: "#d1d5db",
        minWidth: 120,
        paddingVertical: 2,
    },
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
        borderRadius: 1000
    },
    chipText: { color: "#111", fontSize: 13, fontWeight: "600" },

    notesDisplay: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 12,
        backgroundColor: "#fafafa",
        minHeight: 80,
    },

    notesText: {
        color: "#374151",
        fontSize: 14,
        lineHeight: 20,
    },

    notesInput: {
        fontSize: 14,
        color: "#111",
        textAlignVertical: "top",
    },
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

    addExerciseBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 12,
        paddingVertical: 10,
        backgroundColor: "#26b5dc",
    },

    removeWorkoutBtn: {
        marginVertical: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 12,
        paddingVertical: 10,
        borderWidth: 2,
        borderColor: "#dc2626"
    },

// Exercise Modal
    exerciseModalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "flex-end",
    },

    exerciseModalCard: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        height: "75%",
    },

    exerciseModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },

    exerciseModalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111",
    },

    exerciseSearchWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 14,
        backgroundColor: "#f9fafb",
    },

    exerciseSearchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 15,
        color: "#111",
    },

    exerciseItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: "#fff",
    },

    exerciseItemTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111",
    },

    exerciseItemMeta: {
        marginTop: 2,
        fontSize: 13,
        color: "#6b7280",
    },

    exerciseEmptyText: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
        marginTop: 20,
    },

});