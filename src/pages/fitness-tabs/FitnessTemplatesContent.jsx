import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTemplates } from '../../services/templateStorage';

import Template from '../../components/fitness/modals/Template';

import { getAuth } from '@react-native-firebase/auth';
import { deleteTemplate } from '../../services/templateStorage';
import Toast from 'react-native-toast-message';

const BLUE = '#00b4d8';
const GRAY = '#6b7280';

export default function FitnessTemplatesContent({ onUseTemplate }) {
    const auth = getAuth();
    const user = auth.currentUser;

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const loadTemplates = useCallback(async () => {
        setLoading(true);
        try {
            const list = await getTemplates(user);
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

    const handleDeleteTemplate = async () => {
        await deleteTemplate(user, selectedTemplate.templateId)
            .then(() => {
                Toast.show({ type: 'success', text1: 'Template deleted' });
                closeModal();
                loadTemplates();
            })
            .catch((error) => {
                console.error('Error deleting template:', error);
                Toast.show({ type: 'error', text1: 'Failed to delete template' });
                closeModal();
            });
    }
    

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
                            key={template._id}
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

            <Template
                visible={modalVisible}
                template={selectedTemplate}
                onClose={closeModal}
                onUseTemplate={handleUseTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                />
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
    }
});
