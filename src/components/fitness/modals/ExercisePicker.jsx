import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Modal,
    ScrollView,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    searchExercises,
    ensureExercisesLoaded,
} from '../../../services/exerciseParser';
import { addUserExercise, deleteUserExercise } from '../../../services/userExerciseService';

const BLUE = '#00b4d8';

const CUSTOM_BODY_PARTS = ['Arms', 'Back', 'Cardio', 'Chest', 'Core', 'Full body', 'Legs', 'Olympic', 'Shoulders', 'Other'];
const CUSTOM_CATEGORY_TYPES = ['Barbell', 'Dumbbell', 'Machine/other', 'Weighted bodyweight', 'Assisted bodyweight', 'Reps only', 'Cardio', 'Duration'];

const EXERCISE_MODAL_BODY_PARTS = ['core', 'arms', 'back', 'chest', 'legs', 'shoulders', 'other', 'Olympic', 'full body'];
const EXERCISE_MODAL_CATEGORIES = ['barbell', 'dumbbell', 'weighted assisted', 'weighted bodyweight', 'reps only', 'cardio', 'duration'];

function DropdownField({
    label,
    value,
    placeholder,
    options,
    isOpen,
    onToggle,
    onSelect,
    styles: dropdownStyles,
}) {
    return (
        <View style={dropdownStyles.dropdownField}>
            <Text style={dropdownStyles.dropdownLabel}>{label}</Text>
            <Pressable style={dropdownStyles.dropdownInput} onPress={onToggle}>
                <Text style={value ? dropdownStyles.dropdownValue : dropdownStyles.dropdownPlaceholder}>
                    {value || placeholder}
                </Text>
                <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#6b7280"
                />
            </Pressable>
            {isOpen && (
                <View style={dropdownStyles.dropdownMenu}>
                    <ScrollView style={dropdownStyles.dropdownScroll} nestedScrollEnabled>
                        {options.length === 0 ? (
                            <Text style={dropdownStyles.dropdownEmpty}>No options</Text>
                        ) : (
                            options.map((option) => (
                                <Pressable
                                    key={option}
                                    style={dropdownStyles.dropdownOption}
                                    onPress={() => onSelect(option)}
                                >
                                    <Text style={dropdownStyles.dropdownOptionText}>{option}</Text>
                                </Pressable>
                            ))
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

export default function ExercisePicker({ visible, onClose, onAddExercises }) {
    const [activeTab, setActiveTab] = useState('search');
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [exercises, setExercises] = useState([]);
    const [filteredExercises, setFilteredExercises] = useState([]);
    const [loadingExercises, setLoadingExercises] = useState(false);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [newExercise, setNewExercise] = useState({
        title: '',
        type: '',
        bodyPart: '',
    });
    const [filterBodyPart, setFilterBodyPart] = useState(null);
    const [filterCategory, setFilterCategory] = useState(null);
    const [openExerciseFilter, setOpenExerciseFilter] = useState(null);

    useEffect(() => {
        if (!visible) return;
        ensureExercisesLoaded().then(() => {});
    }, [visible]);

    useEffect(() => {
        if (!visible) return;
        setLoadingExercises(true);
        try {
            const data = searchExercises('');
            setExercises(data);
            setFilteredExercises(data);
        } catch (error) {
            console.error('Failed to load exercises:', error);
            setExercises([]);
            setFilteredExercises([]);
        } finally {
            setLoadingExercises(false);
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) return;
        if (exercises.length === 0) return;
        let results = searchExercises(exerciseSearch);
        if (filterBodyPart) {
            const bpNorm = filterBodyPart.toLowerCase();
            results = results.filter(
                (ex) => (ex.bodyPart || '').toLowerCase() === bpNorm
            );
        }
        if (filterCategory) {
            const catNorm = filterCategory.toLowerCase();
            results = results.filter((ex) => {
                const typeNorm = (ex.type || '').toLowerCase();
                if (catNorm === 'weighted assisted') {
                    return typeNorm.includes('assisted');
                }
                return typeNorm === catNorm;
            });
        }
        setFilteredExercises(results);
    }, [visible, exerciseSearch, exercises.length, filterBodyPart, filterCategory]);

    const resetModalState = () => {
        setActiveTab('search');
        setExerciseSearch('');
        setOpenDropdown(null);
        setOpenExerciseFilter(null);
        setFilterBodyPart(null);
        setFilterCategory(null);
        setSelectedExercises([]);
        setShowNewExerciseForm(false);
        setNewExercise({ title: '', type: '', bodyPart: '' });
    };

    const handleClose = () => {
        resetModalState();
        onClose();
    };

    const handleAddSelected = () => {
        if (selectedExercises.length === 0) return;
        if (onAddExercises) {
            onAddExercises(selectedExercises);
        }
        resetModalState();
        onClose();
    };

    const handleOpenNewExercise = () => {
        setShowNewExerciseForm(true);
        setActiveTab('add');
    };

    const handleCancelNewExercise = () => {
        setShowNewExerciseForm(false);
        setOpenDropdown(null);
        setActiveTab('search');
        setNewExercise({ title: '', type: '', bodyPart: '' });
    };

    const handleSaveNewExercise = () => {
        if (!newExercise.title.trim()) return;
        const created = addUserExercise({
            ...newExercise,
            description: '',
            level: '',
            equipment: '',
        });
        setShowNewExerciseForm(false);
        setOpenDropdown(null);
        setNewExercise({ title: '', type: '', bodyPart: '' });
        setExerciseSearch(created.title || '');
        setSelectedExercises((prev) => {
            if (prev.some((ex) => ex.id === created.id)) return prev;
            return [...prev, created];
        });
        setExercises(searchExercises(''));
        setFilteredExercises(searchExercises(created.title || ''));
        setActiveTab('search');
    };

    const handleDeleteCustomExercise = (id) => {
        deleteUserExercise(id);
        setExercises(searchExercises(''));
        setFilteredExercises(searchExercises(exerciseSearch));
        setSelectedExercises((prev) => prev.filter((exercise) => exercise.id !== id));
    };

    const isExerciseSelected = (id) =>
        selectedExercises.some((ex) => ex.id === id);

    const handleSelectExercise = (exercise) => {
        setSelectedExercises((prev) => {
            if (prev.some((ex) => ex.id === exercise.id)) return prev;
            return [...prev, exercise];
        });
    };

    const handleRemoveSelectedExercise = (id) => {
        setSelectedExercises((prev) => prev.filter((exercise) => exercise.id !== id));
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <Pressable
                style={styles.modalBackdrop}
                onPress={handleClose}
            >
                <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHeaderLeft}>
                            <TouchableOpacity
                                style={styles.modalIconButton}
                                onPress={handleClose}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalHeaderRight}>
                            <TouchableOpacity
                                style={[
                                    styles.modalAddButton,
                                    (selectedExercises.length === 0 || showNewExerciseForm) &&
                                        styles.modalAddButtonDisabled,
                                ]}
                                onPress={handleAddSelected}
                                disabled={selectedExercises.length === 0 || showNewExerciseForm}
                            >
                                <Text style={styles.modalAddButtonText}>
                                    Add ({selectedExercises.length})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.modalTabs}>
                        <TouchableOpacity
                            style={[
                                styles.modalTabButton,
                                activeTab === 'search' && styles.modalTabButtonActive,
                            ]}
                            onPress={() => setActiveTab('search')}
                        >
                            <Text
                                style={[
                                    styles.modalTabButtonText,
                                    activeTab === 'search' && styles.modalTabButtonTextActive,
                                ]}
                            >
                                Search
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modalTabButton,
                                activeTab === 'add' && styles.modalTabButtonActive,
                            ]}
                            onPress={handleOpenNewExercise}
                        >
                            <Text
                                style={[
                                    styles.modalTabButtonText,
                                    activeTab === 'add' && styles.modalTabButtonTextActive,
                                ]}
                            >
                                Add Custom
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {activeTab === 'add' ? (
                        <ScrollView
                            style={styles.exerciseLibrary}
                            contentContainerStyle={styles.addCustomFormContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.addCustomFormCard}>
                                <Text style={styles.formTitle}>Add custom exercise</Text>
                                <Text style={styles.formSubtitle}>Name your exercise and choose body part and category.</Text>
                                <Text style={styles.formLabel}>Name</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={newExercise.title}
                                    onChangeText={(value) =>
                                        setNewExercise((prev) => ({ ...prev, title: value }))
                                    }
                                    placeholder="Exercise name"
                                    placeholderTextColor="#9ca3af"
                                />
                                <Text style={styles.formLabel}>Body part</Text>
                                <DropdownField
                                    label=""
                                    value={newExercise.bodyPart}
                                    placeholder="Select body part"
                                    options={CUSTOM_BODY_PARTS}
                                    isOpen={openDropdown === 'bodyPart'}
                                    onToggle={() =>
                                        setOpenDropdown((prev) =>
                                            prev === 'bodyPart' ? null : 'bodyPart'
                                        )
                                    }
                                    onSelect={(value) => {
                                        setNewExercise((prev) => ({ ...prev, bodyPart: value }));
                                        setOpenDropdown(null);
                                    }}
                                    styles={styles}
                                />
                                <Text style={styles.formLabel}>Category type</Text>
                                <DropdownField
                                    label=""
                                    value={newExercise.type}
                                    placeholder="Select category"
                                    options={CUSTOM_CATEGORY_TYPES}
                                    isOpen={openDropdown === 'type'}
                                    onToggle={() =>
                                        setOpenDropdown((prev) => (prev === 'type' ? null : 'type'))
                                    }
                                    onSelect={(value) => {
                                        setNewExercise((prev) => ({ ...prev, type: value }));
                                        setOpenDropdown(null);
                                    }}
                                    styles={styles}
                                />
                                <View style={styles.formButtons}>
                                    <TouchableOpacity
                                        style={styles.formCancelButton}
                                        onPress={handleCancelNewExercise}
                                    >
                                        <Text style={styles.formCancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.formSaveButton,
                                            !newExercise.title.trim() && styles.formSaveButtonDisabled,
                                        ]}
                                        onPress={handleSaveNewExercise}
                                        disabled={!newExercise.title.trim()}
                                    >
                                        <Text style={styles.formSaveButtonText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    ) : (
                        <ScrollView
                            style={styles.exerciseLibrary}
                            contentContainerStyle={styles.exerciseLibraryContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.searchWrap}>
                                <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                                <TextInput
                                    style={styles.searchInput}
                                    value={exerciseSearch}
                                    onChangeText={setExerciseSearch}
                                    placeholder="Search exercises..."
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>

                            <View style={styles.filterRow}>
                                <View style={styles.filterButtonWrap}>
                                    <Pressable
                                        style={[
                                            styles.filterButton,
                                            openExerciseFilter === 'bodyPart' && styles.filterButtonActive,
                                        ]}
                                        onPress={() =>
                                            setOpenExerciseFilter((prev) =>
                                                prev === 'bodyPart' ? null : 'bodyPart'
                                            )
                                        }
                                    >
                                        <Text
                                            style={styles.filterButtonText}
                                            numberOfLines={1}
                                        >
                                            {filterBodyPart || 'Any body part'}
                                        </Text>
                                        <Ionicons
                                            name={openExerciseFilter === 'bodyPart' ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color="#6b7280"
                                        />
                                    </Pressable>
                                    {openExerciseFilter === 'bodyPart' && (
                                        <View style={styles.filterDropdownMenu}>
                                            <ScrollView
                                                style={styles.filterDropdownScroll}
                                                nestedScrollEnabled
                                                keyboardShouldPersistTaps="handled"
                                            >
                                                <Pressable
                                                    style={styles.filterDropdownOption}
                                                    onPress={() => {
                                                        setFilterBodyPart(null);
                                                        setOpenExerciseFilter(null);
                                                    }}
                                                >
                                                    <Text style={styles.filterDropdownOptionText}>
                                                        Any body part
                                                    </Text>
                                                </Pressable>
                                                {EXERCISE_MODAL_BODY_PARTS.map((opt) => (
                                                    <Pressable
                                                        key={opt}
                                                        style={[
                                                            styles.filterDropdownOption,
                                                            filterBodyPart === opt && styles.filterDropdownOptionActive,
                                                        ]}
                                                        onPress={() => {
                                                            setFilterBodyPart(opt);
                                                            setOpenExerciseFilter(null);
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.filterDropdownOptionText,
                                                                filterBodyPart === opt && styles.filterDropdownOptionTextActive,
                                                            ]}
                                                        >
                                                            {opt}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.filterButtonWrap}>
                                    <Pressable
                                        style={[
                                            styles.filterButton,
                                            openExerciseFilter === 'category' && styles.filterButtonActive,
                                        ]}
                                        onPress={() =>
                                            setOpenExerciseFilter((prev) =>
                                                prev === 'category' ? null : 'category'
                                            )
                                        }
                                    >
                                        <Text
                                            style={styles.filterButtonText}
                                            numberOfLines={1}
                                        >
                                            {filterCategory || 'Any category'}
                                        </Text>
                                        <Ionicons
                                            name={openExerciseFilter === 'category' ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color="#6b7280"
                                        />
                                    </Pressable>
                                    {openExerciseFilter === 'category' && (
                                        <View style={styles.filterDropdownMenu}>
                                            <ScrollView
                                                style={styles.filterDropdownScroll}
                                                nestedScrollEnabled
                                                keyboardShouldPersistTaps="handled"
                                            >
                                                <Pressable
                                                    style={styles.filterDropdownOption}
                                                    onPress={() => {
                                                        setFilterCategory(null);
                                                        setOpenExerciseFilter(null);
                                                    }}
                                                >
                                                    <Text style={styles.filterDropdownOptionText}>
                                                        Any category
                                                    </Text>
                                                </Pressable>
                                                {EXERCISE_MODAL_CATEGORIES.map((opt) => (
                                                    <Pressable
                                                        key={opt}
                                                        style={[
                                                            styles.filterDropdownOption,
                                                            filterCategory === opt && styles.filterDropdownOptionActive,
                                                        ]}
                                                        onPress={() => {
                                                            setFilterCategory(opt);
                                                            setOpenExerciseFilter(null);
                                                        }}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.filterDropdownOptionText,
                                                                filterCategory === opt && styles.filterDropdownOptionTextActive,
                                                            ]}
                                                        >
                                                            {opt}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {selectedExercises.length > 0 && (
                                <View style={styles.selectedSection}>
                                    <Text style={styles.selectedHeader}>
                                        Selected ({selectedExercises.length})
                                    </Text>
                                    <View style={styles.selectedList}>
                                        {selectedExercises.map((exercise) => (
                                            <View key={exercise.id} style={styles.selectedItem}>
                                                <View style={styles.selectedItemText}>
                                                    <Text style={styles.selectedTitle}>
                                                        {exercise.title}
                                                    </Text>
                                                    <Text style={styles.selectedMeta}>
                                                        {[exercise.type, exercise.bodyPart]
                                                            .filter(Boolean)
                                                            .join(' • ')}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.selectedRemoveButton}
                                                    onPress={() =>
                                                        handleRemoveSelectedExercise(exercise.id)
                                                    }
                                                >
                                                    <Ionicons name="close" size={16} color="#6b7280" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {loadingExercises ? (
                                <Text style={styles.emptyStateText}>Loading exercises...</Text>
                            ) : filteredExercises.length === 0 ? (
                                <Text style={styles.emptyStateText}>No exercises found.</Text>
                            ) : (
                                filteredExercises.map((exercise) => {
                                    const selected = isExerciseSelected(exercise.id);
                                    return (
                                        <View key={exercise.id} style={[styles.exerciseItemContainer, selected && styles.exerciseItemSelected]}>
                                            <TouchableOpacity
                                                style={styles.exerciseRow}
                                                onPress={() => handleSelectExercise(exercise)}
                                                activeOpacity={selected ? 1 : 0.85}
                                                disabled={selected}
                                            >
                                                <View style={styles.exerciseRowText}>
                                                    <Text style={[styles.exerciseTitle, selected && styles.exerciseTitleSelected]}>{exercise.title}</Text>
                                                    <Text style={styles.exerciseMeta}>
                                                        {[exercise.type, exercise.bodyPart]
                                                            .filter(Boolean)
                                                            .join(' • ')}
                                                    </Text>
                                                </View>
                                                <Ionicons
                                                    name={selected ? 'checkmark-circle' : 'chevron-forward'}
                                                    size={selected ? 20 : 18}
                                                    color={selected ? BLUE : '#9ca3af'}
                                                />
                                            </TouchableOpacity>
                                            {exercise.isUserCreated && (
                                                <TouchableOpacity
                                                    style={styles.exerciseDeleteButton}
                                                    onPress={() => handleDeleteCustomExercise(exercise.id)}
                                                >
                                                    <Ionicons name="trash" size={16} color="#ef4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '92%',
        minHeight: 320,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalIconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalAddButton: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: BLUE,
    },
    modalAddButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    modalAddButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    modalTabs: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    modalTabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
    },
    modalTabButtonActive: {
        backgroundColor: '#e0f2fe',
    },
    modalTabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
    },
    modalTabButtonTextActive: {
        color: '#111',
    },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    filterButtonWrap: {
        flex: 1,
        position: 'relative',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        minHeight: 44,
    },
    filterButtonActive: {
        backgroundColor: '#e0f2fe',
        borderColor: BLUE,
    },
    filterButtonText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
        marginRight: 8,
    },
    filterDropdownMenu: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        maxHeight: 220,
        zIndex: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    filterDropdownScroll: {
        maxHeight: 216,
    },
    filterDropdownOption: {
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    filterDropdownOptionActive: {
        backgroundColor: '#e0f2fe',
    },
    filterDropdownOptionText: {
        fontSize: 14,
        color: '#374151',
    },
    filterDropdownOptionTextActive: {
        color: '#111',
        fontWeight: '600',
    },
    exerciseLibrary: {
        flex: 1,
        minHeight: 160,
    },
    exerciseLibraryContent: {
        paddingBottom: 24,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#6b7280',
    },
    selectedSection: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 12,
        marginBottom: 12,
    },
    selectedHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
        marginBottom: 8,
    },
    selectedList: {
        gap: 8,
    },
    selectedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    selectedItemText: {
        flex: 1,
        marginRight: 8,
    },
    selectedTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    selectedMeta: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    selectedRemoveButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    exerciseItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#fff',
    },
    exerciseItemSelected: {
        backgroundColor: '#f0f9ff',
        borderColor: BLUE,
        opacity: 0.7,
    },
    exerciseRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    exerciseDeleteButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#f3f4f6',
    },
    exerciseRowText: {
        flex: 1,
        paddingRight: 12,
    },
    exerciseTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111',
        marginBottom: 4,
    },
    exerciseTitleSelected: {
        color: '#6b7280',
    },
    exerciseMeta: {
        fontSize: 13,
        color: '#6b7280',
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        marginBottom: 6,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
        marginTop: 4,
    },
    addCustomFormContent: {
        padding: 20,
        paddingBottom: 40,
    },
    addCustomFormCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        padding: 20,
    },
    dropdownField: {
        marginBottom: 12,
    },
    dropdownLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 6,
    },
    dropdownInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownValue: {
        fontSize: 15,
        color: '#111',
        flex: 1,
        marginRight: 8,
    },
    dropdownPlaceholder: {
        fontSize: 15,
        color: '#9ca3af',
        flex: 1,
        marginRight: 8,
    },
    dropdownMenu: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        backgroundColor: '#fff',
        maxHeight: 220,
    },
    dropdownScroll: {
        maxHeight: 220,
    },
    dropdownOption: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    dropdownOptionText: {
        fontSize: 15,
        color: '#111',
    },
    dropdownEmpty: {
        fontSize: 14,
        color: '#6b7280',
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    formInput: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#111',
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    formButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    formCancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    formCancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    formSaveButton: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        backgroundColor: BLUE,
    },
    formSaveButtonDisabled: {
        backgroundColor: '#93c5fd',
    },
    formSaveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
