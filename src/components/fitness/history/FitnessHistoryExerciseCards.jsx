import React from "react";
import { View, Text, StyleSheet } from "react-native";

function fmtSetValue(set) {
    const w = Number(set.weight);
    const r = Number(set.reps);
    const t = Number(set.time);

    if (t && t > 0) return `${t}s`;
    if (!Number.isNaN(w) && w > 0 && !Number.isNaN(r) && r > 0) return `${w} lbs × ${r}`;
    if (!Number.isNaN(r) && r > 0) return `${r} reps`;
    return "—";
}

export default function ExerciseCard({ exerciseObj }) {
    const name = exerciseObj.exercises?.[0].title || "Exercise";
    const sets = Array.isArray(exerciseObj.sets) ? exerciseObj.sets : [];
    const completedSets = sets.filter(s => s?.completed).length;



    return (
        <View style={styles.exerciseCard}>
            <Text style={styles.exerciseTitle}>
                {name} ({completedSets}/{sets.length})
            </Text>
            <View style={styles.setsWrap}>
                {sets.map((s, i) => (
                    <View key={i} style={styles.setRow}>
                        <Text style={styles.setLeft}>Set</Text>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.setRight}>{fmtSetValue(s)}</Text>

                            {s.completed && (
                                <Text style={{ color: "#1d1d1d", fontWeight: "700" }}>✓</Text>
                            )}
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    exerciseCard: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    exerciseTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111",
        marginBottom: 8,
    },
    setsWrap: {
        gap: 6,
    },
    setRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    setLeft: {
        color: "#6b7280",
        fontWeight: "600",
    },
    setRight: {
        color: "#111",
        fontWeight: "700",
    },
});