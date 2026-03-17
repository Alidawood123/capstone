import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#00b4d8';
const GRAY = '#6b7280';

function formatRestDisplay(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Template({ visible, template, onClose, onUseTemplate, onDeleteTemplate }) {

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalBackdrop} onPress={onClose}>
                <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle} numberOfLines={1}>
                            {template?.title || 'Template'}
                        </Text>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={onClose}
                            hitSlop={12}
                        >
                            <Ionicons name="close" size={24} color={GRAY} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalScroll}
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={true}
                    >
                        {template?.exercises?.length ? (
                            template.exercises.map((item, idx) => {
                                const sets = Array.isArray(item.sets) ? item.sets : [];
                                const name =
                                    item.type === 'superset'
                                        ? 'Superset'
                                        : (item.exercises && item.exercises[0]?.title) || 'Exercise';
                                return (
                                    <View key={item.id || idx} style={styles.detailBlock}>
                                        <Text style={styles.detailExerciseName}>{name}</Text>
                                        {item.exercises?.map((ex) => {
                                            const meta = [ex.type, ex.bodyPart]
                                                .filter(Boolean)
                                                .join(' · ');
                                            return meta ? (
                                                <Text key={ex.id} style={styles.detailSubName}>
                                                    {meta}
                                                </Text>
                                            ) : null;
                                        })}
                                        <Text style={styles.detailSets}>
                                            {sets.length} set{sets.length !== 1 ? 's' : ''}
                                            {sets.some((s) => s.restSeconds != null && s.restSeconds > 0) &&
                                                ` · Rest ${formatRestDisplay(sets[0]?.restSeconds)}`}
                                        </Text>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={styles.detailEmpty}>No exercises in this template.</Text>
                        )}
                    </ScrollView>
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.useTemplateButton}
                            onPress={onUseTemplate}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="play" size={22} color="#fff" />
                            <Text style={styles.useTemplateButtonText}>Use template</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteTemplateButton}
                            onPress={onDeleteTemplate}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="trash" size={22} color="#fff" />
                            <Text style={styles.deleteTemplateButtonText}>Delete template</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '600',
        color: '#111827',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalScroll: {
        maxHeight: 320,
    },
    modalScrollContent: {
        padding: 20,
        paddingBottom: 16,
    },
    detailBlock: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    detailExerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    detailSubName: {
        fontSize: 14,
        color: GRAY,
        marginTop: 2,
    },
    detailSets: {
        fontSize: 13,
        color: GRAY,
        marginTop: 4,
    },
    detailEmpty: {
        fontSize: 14,
        color: GRAY,
        fontStyle: 'italic',
    },
    modalActions: {
        padding: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        gap: 12,
        borderTopColor: '#e5e7eb',
    },
    useTemplateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: BLUE,
        paddingVertical: 14,
        borderRadius: 12,
    },
    useTemplateButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
    deleteTemplateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        borderRadius: 12,
    },
    deleteTemplateButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
});
