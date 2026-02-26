import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Modal,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTemplates } from '../../services/templateStorage';

const BLUE = '#00b4d8';
const GRAY = '#6b7280';

/** Format rest seconds for display */
function formatRestDisplay(seconds) {
    const sec = Math.max(0, Math.floor(Number(seconds) || 0));
    if (sec >= 60) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    }
    return `${sec}s`;
}

export default function FitnessTemplatesContent({ onUseTemplate }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const list = await getTemplates();
            setTemplates(list);
        } catch (error) {
            console.error('Failed to load templates:', error);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const openTemplateModal = (template) => {
        setSelectedTemplate(template);
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedTemplate(null);
    };

    const handleUseTemplate = () => {
        if (selectedTemplate && onUseTemplate) {
            onUseTemplate(selectedTemplate);
        }
        closeModal();
    };

    const exerciseCount = (template) => {
        const ex = template?.exercises;
        if (!Array.isArray(ex)) return 0;
        return ex.length;
    };

    const formatCreatedAt = (iso) => {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return '';
        }
    };

    return (
        <View style={styles.content}>
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={BLUE} />
                    <Text style={styles.loadingText}>Loading templates…</Text>
                </View>
            ) : templates.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="document-text-outline" size={48} color={GRAY} />
                    <Text style={styles.emptyTitle}>No templates yet</Text>
                    <Text style={styles.emptySubtext}>
                        Tap the + button above to create your first workout template.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                >
                    {templates.map((template) => (
                        <TouchableOpacity
                            key={template.id}
                            style={styles.templateRow}
                            onPress={() => openTemplateModal(template)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.templateRowInner}>
                                <Text style={styles.templateTitle} numberOfLines={1}>
                                    {template.title || 'Untitled template'}
                                </Text>
                                <Text style={styles.templateMeta}>
                                    {exerciseCount(template)} exercise{exerciseCount(template) !== 1 ? 's' : ''}
                                    {template.createdAt ? ` · ${formatCreatedAt(template.createdAt)}` : ''}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={GRAY} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <Pressable style={styles.modalBackdrop} onPress={closeModal}>
                    <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle} numberOfLines={1}>
                                {selectedTemplate?.title || 'Template'}
                            </Text>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={closeModal}
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
                            {selectedTemplate?.exercises?.length ? (
                                selectedTemplate.exercises.map((item, idx) => {
                                    const sets = Array.isArray(item.sets) ? item.sets : [];
                                    const name =
                                        item.type === 'superset'
                                            ? 'Superset'
                                            : (item.exercises && item.exercises[0]?.title) || 'Exercise';
                                    return (
                                        <View key={item.id || idx} style={styles.detailBlock}>
                                            <Text style={styles.detailExerciseName}>{name}</Text>
                                            {item.exercises?.map((ex) => (
                                                <Text key={ex.id} style={styles.detailSubName}>
                                                    {ex.title}
                                                </Text>
                                            ))}
                                            <Text style={styles.detailSets}>
                                                {sets.length} set{sets.length !== 1 ? 's' : ''}
                                                {sets.some((s) => s.restSeconds != null) &&
                                                    ` · Rest ${formatRestDisplay(sets[0]?.restSeconds ?? 60)}`}
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
                                onPress={handleUseTemplate}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="play" size={22} color="#fff" />
                                <Text style={styles.useTemplateButtonText}>Use template</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: GRAY,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: GRAY,
        marginTop: 8,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 24,
    },
    templateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
    },
    templateRowInner: {
        flex: 1,
        marginRight: 12,
    },
    templateTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
    },
    templateMeta: {
        fontSize: 13,
        color: GRAY,
        marginTop: 4,
    },
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
});
