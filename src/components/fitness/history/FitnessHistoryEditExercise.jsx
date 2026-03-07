import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

function fmtSetValue(set) {
    const w = Number(set.weight);
    const r = Number(set.reps);
    const t = Number(set.time);

    if (t && t > 0) return `${t}s`;
    if (!Number.isNaN(w) && w > 0 && !Number.isNaN(r) && r > 0) return `${w} lbs × ${r}`;
    if (!Number.isNaN(r) && r > 0) return `${r} reps`;
    return "—";
}




export default function EditExerciseCard({ removeExercise, exerciseObj, defaultOpen = false}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [editingSetIndex, setEditingSetIndex] = useState(null);

    const name = exerciseObj?.exercises?.[0]?.title || "Exercise";

    const [sets, setSets] = useState(
        Array.isArray(exerciseObj?.sets) ? exerciseObj.sets : []
    );    const completedSets = sets.filter((s) => s?.completed).length;


    function defaultSet() {
        return { weight: "", reps: "", time: "", completed: false };
    }

    function removeSet(index) {
        const updatedSets = sets.filter((_, i) => i !== index);

        setSets(updatedSets);
        exerciseObj.sets = updatedSets;
    }

    function updateSet(index, field, value) {
        const updatedSets = sets.map((s, i) =>
            i === index ? { ...s, [field]: value } : s
        );

        setSets(updatedSets);
        exerciseObj.sets = updatedSets;
    }

    function completeSet(index) {
        const updatedSets = sets.map((s, i) =>
            i === index ? { ...s, completed: !s.completed } : s
        );

        setSets(updatedSets);
        exerciseObj.sets = updatedSets;
    }
    function handleRemoveExercise() {
        removeExercise(exerciseObj.id);
    }


    function addSet() {
        setSets((prev) => {
            const newIndex = prev.length;
            setEditingSetIndex(newIndex);
            return [...prev, defaultSet()];
        });
    }



    return (
        <View style={styles.exerciseCard}>
            <Pressable style={styles.exerciseHeader} onPress={() => setIsOpen((v) => !v)}>
                <Text style={styles.exerciseTitle}>
                    {name} ({completedSets}/{sets.length})
                </Text>

                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color="#374151" />
            </Pressable>

            {isOpen && (
                <View style={styles.setsWrap}>
                    {sets.map((s, i) => {
                        const isEditing = editingSetIndex === i;

                        return (
                            <View key={i} style={[styles.setCard, s?.completed && styles.setCardDone]}>
                                <View style={styles.setTopRow}>
                                    <Text style={styles.setLeft}>Set {i + 1}</Text>

                                    <View style={styles.setActions}>
                                        {/* Complete Set */}
                                        <Pressable style={[styles.iconBtn, s?.completed && styles.iconBtnDone]} onPress={() => completeSet(i)}>
                                            <Ionicons name={s?.completed ? "checkmark-circle" : "ellipse-outline"} size={18} color={s?.completed ? "#16a34a" : "#6b7280"} />
                                        </Pressable>
                                        
                                        {/* Opens Set Values */}
                                        <Pressable style={styles.iconBtn} onPress={() => setEditingSetIndex(isEditing ? null : i)}>
                                            <Ionicons name={isEditing ? "chevron-up-outline" : "create-outline"} size={18} color="#374151" />
                                        </Pressable>

                                        {/* Remove Set */}
                                        <Pressable style={styles.iconBtn} onPress={() => removeSet(i)}>
                                            <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                        </Pressable>
                                    </View>
                                </View>

                                {!isEditing ? (
                                    <View style={styles.valueRow}>
                                        <Text style={styles.setRight}>{fmtSetValue(s)}</Text>
                                        {s?.completed && <Text style={styles.check}>Completed</Text>}
                                    </View>
                                ) : (
                                    <View style={styles.editBox}>
                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Weight (lbs)</Text>
                                            <TextInput style={styles.input} value={String(s?.weight ?? "")}
                                                keyboardType="numeric" placeholder="0"
                                                onChangeText={(text) => updateSet(i, "weight", text)}
                                            />
                                        </View>

                                        <View style={styles.inputGroup}>
                                            <Text style={styles.inputLabel}>Reps</Text>
                                            <TextInput style={styles.input} value={String(s?.reps ?? "")}
                                                keyboardType="numeric" placeholder="0"
                                                onChangeText={(text) => updateSet(i, "reps", text)}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}

                    <View style={styles.bottomActions}>
                        {/* Add Set */}
                        <Pressable style={styles.addBtn} onPress={() => addSet()}>
                            <Ionicons name="add" size={18} color="#111" />
                            <Text style={styles.addBtnText}>Add Set</Text>
                        </Pressable>

                        {/* Remove Exercise */}
                        <Pressable style={styles.removeExerciseBtn} onPress={handleRemoveExercise}>
                            <Ionicons name="trash-outline" size={18} color="#fff" />
                            <Text style={styles.removeExerciseText}>Remove Exercise</Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    exerciseCard: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },

    exerciseHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    exerciseTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111",
        flex: 1,
        marginRight: 10,
    },

    setsWrap: {
        marginTop: 12,
        gap: 10,
    },

    setCard: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 12,
        backgroundColor: "#fafafa",
    },

    setCardDone: {
        backgroundColor: "#f0fdf4",
        borderColor: "#bbf7d0",
    },

    setTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    setLeft: {
        color: "#374151",
        fontWeight: "700",
        fontSize: 14,
    },

    setActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    iconBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
    },

    iconBtnDone: {
        backgroundColor: "#dcfce7",
    },

    valueRow: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    setRight: {
        color: "#111",
        fontWeight: "700",
        fontSize: 15,
    },

    check: {
        color: "#16a34a",
        fontWeight: "700",
        fontSize: 13,
    },

    editBox: {
        marginTop: 10,
        flexDirection: "row",
        gap: 10,
    },

    inputGroup: {
        flex: 1,
    },

    inputLabel: {
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 4,
        fontWeight: "600",
    },

    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 14,
        color: "#111",
        backgroundColor: "#fff",
    },

    bottomActions: {
        marginTop: 4,
        gap: 10,
    },

    addBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 12,
        paddingVertical: 10,
        backgroundColor: "#fff",
    },

    addBtnText: {
        color: "#111",
        fontWeight: "700",
    },

    removeExerciseBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 12,
        paddingVertical: 10,
        backgroundColor: "#dc2626",
    },

    removeExerciseText: {
        color: "#fff",
        fontWeight: "700",
    },
});