import React from 'react';

import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
<<<<<<< Updated upstream
import backButtonStyle from '../../styles/backButton'
=======
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
>>>>>>> Stashed changes

// LandingPage Component - The first page users see after logging in
export default function FitnessTemplatesContent({ onNavigateToLanding }) {
    return (
<<<<<<< Updated upstream
        <View>
            <Pressable onPress={onNavigateToLanding} style={backButtonStyle.backButton} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text>FitnessTemplatesContent Page</Text>
=======
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
>>>>>>> Stashed changes
        </View>
    );
}

// Local StyleSheet For NutritionPage 
const styles = StyleSheet.create({  });
