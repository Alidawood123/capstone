import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { getAuth } from '@react-native-firebase/auth';

const BLUE = '#00b4d8';
const GRAY = '#9ca3af';
const LIGHT_BLUE = '#e0f7fc';
const BORDER = '#e5e7eb';
const LIGHT_GRAY = '#f3f4f6';

// ─── Reusable sub-components ──────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
    return (
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={20} color={BLUE} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function Card({ children, style }) {
    return <View style={[styles.card, style]}>{children}</View>;
}

function LabeledInput({ label, value, onChangeText, placeholder, keyboardType = 'default', suffix }) {
    return (
        <View style={styles.labeledInputRow}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputWithSuffix}>
                <TextInput
                    style={styles.inlineInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder ?? '—'}
                    placeholderTextColor="#9ca3af"
                    keyboardType={keyboardType}
                />
                {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
            </View>
        </View>
    );
}

function ChipButton({ label, active, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.chip, active && styles.chipActive]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── Goal helpers ─────────────────────────────────────────────────────────────

function GoalItem({ goal, onToggle, onDelete }) {
    return (
        <View style={styles.goalRow}>
            <TouchableOpacity onPress={onToggle} style={styles.goalCheck}>
                <Ionicons
                    name={goal.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={goal.done ? BLUE : GRAY}
                />
            </TouchableOpacity>
            <Text style={[styles.goalText, goal.done && styles.goalDone]}>{goal.text}</Text>
            <TouchableOpacity onPress={onDelete} style={styles.goalDelete}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );
}

function GoalGroup({ label, goals, onAdd, onToggle, onDelete }) {
    const [input, setInput] = useState('');
    const [adding, setAdding] = useState(false);

    const save = () => {
        if (input.trim()) { onAdd(input.trim()); setInput(''); setAdding(false); }
    };

    return (
        <View style={styles.goalGroup}>
            <Text style={styles.goalGroupTitle}>{label}</Text>
            {goals.length === 0 && !adding && (
                <Text style={styles.emptyText}>No goals yet.</Text>
            )}
            {goals.map((g, i) => (
                <GoalItem key={i} goal={g} onToggle={() => onToggle(i)} onDelete={() => onDelete(i)} />
            ))}
            {adding ? (
                <View style={styles.goalInputRow}>
                    <TextInput
                        autoFocus
                        style={styles.goalInput}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Describe your goal..."
                        placeholderTextColor="#9ca3af"
                        onSubmitEditing={save}
                    />
                    <TouchableOpacity style={styles.goalSaveBtn} onPress={save}>
                        <Text style={styles.goalSaveBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.goalCancelBtn} onPress={() => setAdding(false)}>
                        <Ionicons name="close" size={18} color={GRAY} />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.addGoalBtn} onPress={() => setAdding(true)}>
                    <Ionicons name="add" size={18} color={BLUE} />
                    <Text style={styles.addGoalText}>Add goal</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Section wrapper — defined OUTSIDE main component to prevent
//     re-mounting on every keystroke (which kills TextInput focus) ─────────────
function Section({ id, icon, title, collapsed, toggleSection, children }) {
    return (
        <Card style={{ marginBottom: 14 }}>
            <TouchableOpacity
                style={styles.sectionToggle}
                onPress={() => toggleSection(id)}
                activeOpacity={0.7}
            >
                <SectionHeader icon={icon} title={title} />
                <Ionicons
                    name={collapsed[id] ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    color={GRAY}
                />
            </TouchableOpacity>
            {!collapsed[id] && (
                <View style={styles.sectionBody}>{children}</View>
            )}
        </Card>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const REST_PRESETS = [30, 60, 90, 120, 180, 300];
const formatRest = (s) =>
    s >= 60 ? `${Math.floor(s / 60)}m${s % 60 > 0 ? ` ${s % 60}s` : ''}` : `${s}s`;

const MEASUREMENT_FIELDS = [
    { key: 'weight',    label: 'Weight',    type: 'weight' },
    { key: 'height',    label: 'Height',    type: 'size' },
    { key: 'chest',     label: 'Chest',     type: 'size' },
    { key: 'waist',     label: 'Waist',     type: 'size' },
    { key: 'hips',      label: 'Hips',      type: 'size' },
    { key: 'neck',      label: 'Neck',      type: 'size' },
    { key: 'shoulders', label: 'Shoulders', type: 'size' },
    { key: 'biceps',    label: 'Biceps',    type: 'size' },
    { key: 'forearms',  label: 'Forearms',  type: 'size' },
    { key: 'thighs',    label: 'Thighs',    type: 'size' },
    { key: 'calves',    label: 'Calves',    type: 'size' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FitnessProfileContent() {
    const auth = getAuth();
    const user = auth.currentUser;

    // ── Collapsible sections ───────────────────────────────────────────────────
    // FIX: collapsed state and toggleSection are defined here and passed
    // directly into each Section via a closure — no prop-passing needed
    const [collapsed, setCollapsed] = useState({
        personal:     false,
        measurements: true,
        goals:        true,
        pictures:     true,
        rest:         true,
        export:       true,
    });
    const toggleSection = (key) =>
        setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

    // ── Personal Info ──────────────────────────────────────────────────────────
    const [name, setName] = useState('');
    const [dob,  setDob]  = useState('');

    // ── Units ─────────────────────────────────────────────────────────────────
    const [useMetric, setUseMetric] = useState(false);
    const weightUnit = useMetric ? 'kg'  : 'lbs';
    const sizeUnit   = useMetric ? 'cm'  : 'in';
    const distUnit   = useMetric ? 'km'  : 'mi';

    // ── Measurements ──────────────────────────────────────────────────────────
    const [measurements, setMeasurements] = useState({});
    const setMeasurement = (key, val) =>
        setMeasurements((prev) => ({ ...prev, [key]: val }));

    // ── Goals ─────────────────────────────────────────────────────────────────
    const [daily,   setDaily]   = useState([]);
    const [monthly, setMonthly] = useState([]);
    const [yearly,  setYearly]  = useState([]);

    const addGoal    = (setter, text) => setter((p) => [...p, { text, done: false }]);
    const toggleGoal = (setter, i)    => setter((p) => p.map((g, idx) => idx === i ? { ...g, done: !g.done } : g));
    const deleteGoal = (setter, i)    => setter((p) => p.filter((_, idx) => idx !== i));

    // ── Progress Pictures ──────────────────────────────────────────────────────
    const [pictures, setPictures] = useState([]);
    const handleAddPicture = () => {
        Alert.alert(
            'Progress Picture',
            'Wire this up with expo-image-picker:\n\nconst result = await ImagePicker.launchImageLibraryAsync(...)'
        );
    };

    // ── Rest Timer ─────────────────────────────────────────────────────────────
    const [defaultRest, setDefaultRest] = useState(90);
    const [customRest,  setCustomRest]  = useState('');
    const applyCustomRest = () => {
        const val = parseInt(customRest, 10);
        if (!isNaN(val) && val > 0) setDefaultRest(val);
        setCustomRest('');
    };

    // ── Export CSV ─────────────────────────────────────────────────────────────
    const handleExport = () => {
        const rows = [
            ['Field', 'Value'],
            ['Name', name],
            ['Date of Birth', dob],
            ['Units', useMetric ? 'Metric' : 'Imperial'],
            ...MEASUREMENT_FIELDS.map((f) => [
                f.label,
                measurements[f.key]
                    ? `${measurements[f.key]} ${f.type === 'weight' ? weightUnit : sizeUnit}`
                    : '',
            ]),
            ['Default Rest Timer', formatRest(defaultRest)],
            ['Daily Goals',        daily.map((g) => g.text).join(' | ')],
            ['Monthly Goals',      monthly.map((g) => g.text).join(' | ')],
            ['Yearly Resolutions', yearly.map((g) => g.text).join(' | ')],
        ];
        const csv = rows
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        Alert.alert(
            'Export Ready',
            'Use expo-file-system + expo-sharing:\n\nawait FileSystem.writeAsStringAsync(uri, csv);\nawait Sharing.shareAsync(uri);'
        );
    };

    useEffect(() => {
        // Load profile data from backend

        async function loadBasicProfile() {
            fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/basic-profile', {
                headers: {
                    'Authorization': `Bearer ${await user.getIdToken()}`, 
                }
            }).then(res => res.json()).then(data => {
                setName(data.fullName);
                setDob(data.dateOfBirth);
            }).catch(err => {
                console.error('Failed to load profile:', err);
            });
        };

        async function loadFullProfile() {
            fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/full-profile', {
                headers: {
                    'Authorization': `Bearer ${await user.getIdToken()}`, 
                }
            }).then(res => res.json()).then(data => {
                console.log(data)

                setName(data.fullName);
                setDob(new Date(data.dateOfBirth).toLocaleDateString());
                
                data.bodyMeasurements.forEach(m => {
                    setMeasurement(m.bodyType, m.measurementValue.toString());
                });

                setDaily(data.dailyGoals);
                setMonthly(data.monthlyGoals);
                setYearly(data.yearlyGoals);
                setDefaultRest(data.defaultRestTimer);

                console.log(measurements)
            }).catch(err => {
                console.error('Failed to load full profile:', err);
            });
        };

        loadFullProfile();

    }, []);

    const handleSaveFullName = async (newName) => {
        setName(newName);
        if(newName === "")
            return;

        console.log('Saving full name:', newName);

        // Save full name to backend
        fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/update-name', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${await user.getIdToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newName: newName })
        }).then(res => res.json()).then(data => {
            console.log('Full name updated successfully:', data);
        }).catch(err => {
            console.error('Failed to update full name:', err);
        });
    };

    const handleSaveDob = async (newDob) => {
        setDob(newDob);
        if(newDob === "") return;

        fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/update-date-of-birth', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${await user.getIdToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newDateOfBirth: newDob })
        }).then(res => res.json()).then(data => {
            console.log('Date of birth updated successfully:', data);
        }).catch(err => {
            console.error('Failed to update date of birth:', err);
        });
    };

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Personal Info ── */}
            <Section id="personal" icon="person-circle-outline" title="Personal Info" collapsed={collapsed} toggleSection={toggleSection}>
                <LabeledInput
                    label="Full Name"
                    value={name}
                    onChangeText={newName => handleSaveFullName(newName)}
                    placeholder="Your name"
                />
                <LabeledInput
                    label="Date of Birth"
                    value={dob}
                    onChangeText={newText => handleSaveDob(newText)}
                    placeholder="MM/DD/YYYY"
                    keyboardType="numbers-and-punctuation"
                />

            </Section>

            {/* ── Measurements & Units (merged) ── */}
            <Section id="measurements" icon="body-outline" title="Body Measurements" collapsed={collapsed} toggleSection={toggleSection}>
                {/* Unit toggle at the top */}
                <View style={styles.switchRow}>
                    <View>
                        <Text style={styles.switchLabel}>
                            {useMetric ? 'Metric (kg, cm, km)' : 'Imperial (lbs, in, mi)'}
                        </Text>
                        <Text style={styles.switchSub}>Affects all measurements & distances</Text>
                    </View>
                    <Switch
                        value={useMetric}
                        onValueChange={setUseMetric}
                        trackColor={{ false: BORDER, true: BLUE }}
                        thumbColor="#fff"
                    />
                </View>
                <View style={styles.unitBadgeRow}>
                    {[['Weight', weightUnit], ['Size', sizeUnit], ['Distance', distUnit]].map(([l, v]) => (
                        <View key={l} style={styles.unitBadge}>
                            <Text style={styles.unitBadgeLabel}>{l}</Text>
                            <Text style={styles.unitBadgeValue}>{v}</Text>
                        </View>
                    ))}
                </View>
                {/* Divider between unit toggle and measurement fields */}
                <View style={[styles.divider, { marginTop: 16 }]} />
                {/* Body measurement fields */}
                {MEASUREMENT_FIELDS.map((f) => (
                    <LabeledInput
                        key={f.key}
                        label={f.label}
                        value={measurements[f.key] ?? ''}
                        onChangeText={(v) => setMeasurement(f.key, v)}
                        keyboardType="decimal-pad"
                        suffix={f.type === 'weight' ? weightUnit : sizeUnit}
                    />
                ))}
            </Section>

            {/* ── Goals & Resolutions ── */}
            <Section id="goals" icon="flag-outline" title="Goals & Resolutions" collapsed={collapsed} toggleSection={toggleSection}>
                <GoalGroup
                    label="Daily Goals"
                    goals={daily}
                    onAdd={(t) => addGoal(setDaily, t)}
                    onToggle={(i) => toggleGoal(setDaily, i)}
                    onDelete={(i) => deleteGoal(setDaily, i)}
                />
                <View style={styles.divider} />
                <GoalGroup
                    label="Monthly Goals"
                    goals={monthly}
                    onAdd={(t) => addGoal(setMonthly, t)}
                    onToggle={(i) => toggleGoal(setMonthly, i)}
                    onDelete={(i) => deleteGoal(setMonthly, i)}
                />
                <View style={styles.divider} />
                <GoalGroup
                    label="Yearly Resolutions"
                    goals={yearly}
                    onAdd={(t) => addGoal(setYearly, t)}
                    onToggle={(i) => toggleGoal(setYearly, i)}
                    onDelete={(i) => deleteGoal(setYearly, i)}
                />
            </Section>

            {/* ── Progress Pictures ── */}
            <Section id="pictures" icon="camera-outline" title="Progress Pictures" collapsed={collapsed} toggleSection={toggleSection}>
                <Text style={styles.hintText}>
                    Document your transformation over time. Photos are stored locally.
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginTop: 12 }}
                >
                    <TouchableOpacity
                        style={styles.addPictureBox}
                        onPress={handleAddPicture}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={32} color={BLUE} />
                        <Text style={styles.addPictureLabel}>Add Photo</Text>
                    </TouchableOpacity>
                    {pictures.map((_, i) => (
                        <View key={i} style={styles.pictureThumbnail} />
                    ))}
                </ScrollView>
                <Text style={styles.hintTextSm}>Requires expo-image-picker.</Text>
            </Section>

            {/* ── Default Rest Timer ── */}
            <Section id="rest" icon="timer-outline" title="Default Rest Timer" collapsed={collapsed} toggleSection={toggleSection}>
                <Text style={styles.hintText}>
                    Select a preset or enter a custom duration applied between sets.
                </Text>
                <View style={styles.presetRow}>
                    {REST_PRESETS.map((s) => (
                        <ChipButton
                            key={s}
                            label={formatRest(s)}
                            active={defaultRest === s}
                            onPress={() => setDefaultRest(s)}
                        />
                    ))}
                </View>
                <View style={styles.customRestRow}>
                    <TextInput
                        style={styles.customRestInput}
                        value={customRest}
                        onChangeText={setCustomRest}
                        placeholder="Custom (sec)"
                        placeholderTextColor="#9ca3af"
                        keyboardType="number-pad"
                    />
                    <TouchableOpacity
                        style={styles.customRestBtn}
                        onPress={applyCustomRest}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.customRestBtnText}>Set</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.currentRestBadge}>
                    <Ionicons name="time-outline" size={18} color={BLUE} />
                    <Text style={styles.currentRestText}>
                        Current default:{' '}
                        <Text style={{ fontWeight: '700', color: BLUE }}>
                            {formatRest(defaultRest)}
                        </Text>
                    </Text>
                </View>
            </Section>

            {/* ── Export Fitness Data ── */}
            <Section id="export" icon="download-outline" title="Export Fitness Data" collapsed={collapsed} toggleSection={toggleSection}>
                <Text style={styles.hintText}>
                    Download all your profile data — measurements, goals, and settings — as a CSV file.
                </Text>
                <TouchableOpacity
                    style={styles.exportBtn}
                    onPress={handleExport}
                    activeOpacity={0.85}
                >
                    <Ionicons name="document-text-outline" size={22} color="#fff" />
                    <Text style={styles.exportBtnText}>Export as CSV</Text>
                </TouchableOpacity>
                <Text style={styles.hintTextSm}>
                    Requires expo-file-system + expo-sharing.
                </Text>
            </Section>

        </ScrollView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

    root: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },

    // Card / Section
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    sectionBody: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },

    // Labeled Input
    labeledInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    inputLabel: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
    },
    inputWithSuffix: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    inlineInput: {
        fontSize: 15,
        color: '#111',
        textAlign: 'right',
        minWidth: 80,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: LIGHT_GRAY,
        borderRadius: 8,
    },
    inputSuffix: {
        fontSize: 13,
        color: GRAY,
        minWidth: 24,
    },

    // Profile preview
    profilePreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 14,
        padding: 12,
        backgroundColor: LIGHT_BLUE,
        borderRadius: 12,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: BLUE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 18,
    },
    previewName: {
        fontWeight: '700',
        color: '#111827',
        fontSize: 15,
    },
    previewDob: {
        fontSize: 13,
        color: GRAY,
        marginTop: 2,
    },

    // Units
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    switchLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    switchSub: {
        fontSize: 12,
        color: GRAY,
        marginTop: 2,
    },
    unitBadgeRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    unitBadge: {
        flex: 1,
        backgroundColor: LIGHT_BLUE,
        borderRadius: 10,
        alignItems: 'center',
        paddingVertical: 10,
    },
    unitBadgeLabel: {
        fontSize: 11,
        color: GRAY,
        marginBottom: 2,
    },
    unitBadgeValue: {
        fontSize: 16,
        fontWeight: '700',
        color: BLUE,
    },

    // Goals
    divider: {
        borderTopWidth: 1,
        borderTopColor: BORDER,
        marginVertical: 12,
    },
    goalGroup: {
        marginBottom: 4,
    },
    goalGroupTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 6,
    },
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    goalCheck: { padding: 2 },
    goalText: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
    },
    goalDone: {
        textDecorationLine: 'line-through',
        color: '#9ca3af',
    },
    goalDelete: { padding: 4 },
    goalInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    goalInput: {
        flex: 1,
        backgroundColor: LIGHT_GRAY,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111',
        borderWidth: 1,
        borderColor: BORDER,
    },
    goalSaveBtn: {
        backgroundColor: BLUE,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    goalSaveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    goalCancelBtn: {
        padding: 10,
        backgroundColor: LIGHT_GRAY,
        borderRadius: 10,
    },
    addGoalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
    },
    addGoalText: {
        fontSize: 14,
        color: BLUE,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 13,
        color: '#9ca3af',
        fontStyle: 'italic',
        paddingVertical: 6,
    },

    // Progress Pictures
    addPictureBox: {
        width: 90,
        height: 90,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: BLUE,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    addPictureLabel: {
        fontSize: 11,
        color: BLUE,
        marginTop: 4,
        fontWeight: '600',
    },
    pictureThumbnail: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: LIGHT_GRAY,
        marginRight: 10,
    },

    // Rest Timer
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: LIGHT_GRAY,
        borderWidth: 1,
        borderColor: BORDER,
    },
    chipActive: {
        backgroundColor: BLUE,
        borderColor: BLUE,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    chipTextActive: {
        color: '#fff',
    },
    customRestRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    customRestInput: {
        flex: 1,
        backgroundColor: LIGHT_GRAY,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 15,
        color: '#111',
        borderWidth: 1,
        borderColor: BORDER,
    },
    customRestBtn: {
        backgroundColor: BLUE,
        borderRadius: 10,
        paddingHorizontal: 22,
        justifyContent: 'center',
    },
    customRestBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    currentRestBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
        backgroundColor: LIGHT_BLUE,
        borderRadius: 10,
        padding: 12,
    },
    currentRestText: {
        fontSize: 14,
        color: '#374151',
    },

    // Export
    exportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: BLUE,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 12,
    },
    exportBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },

    // Hints
    hintText: {
        fontSize: 13,
        color: GRAY,
        lineHeight: 18,
    },
    hintTextSm: {
        marginTop: 8,
        fontSize: 12,
        color: '#9ca3af',
    },
});