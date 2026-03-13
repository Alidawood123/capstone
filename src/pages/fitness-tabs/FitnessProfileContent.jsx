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
    Share,
    Modal,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';

import { getAuth } from '@react-native-firebase/auth';

import {
    saveFullName,
    saveDob,
    saveMeasurements,

    addDailyGoal,
    toggleDailyGoal,
    deleteDailyGoal,

    addMonthlyGoal,
    toggleMonthlyGoal,
    deleteMonthlyGoal,

    addYearlyGoal,
    toggleYearlyGoal,
    deleteYearlyGoal,
} from '../../services/profileService';

// ─── Theme ────────────────────────────────────────────────────────────────────
const BLUE = '#00b4d8';
const GRAY = '#9ca3af';
const LIGHT_BLUE = '#e0f7fc';
const BORDER = '#e5e7eb';
const LIGHT_GRAY = '#f3f4f6';

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── CSV helpers ──────────────────────────────────────────────────────────────
function buildCSV(rows) {
    return rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
}

function parseCSV(text) {
    const map = {};
    for (const line of text.trim().split(/\r?\n/)) {
        const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/);
        if (m) map[m[1].replace(/""/g, '"')] = m[2].replace(/""/g, '"');
    }
    return map;
}

const goalsFromPipe = (str) =>
    str?.trim()
        ? str.split(' | ').filter(Boolean).map((text) => ({ text, done: false }))
        : [];

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

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ visible, onClose, onImport }) {
    const [text, setText] = useState('');
    const handleImport = () => {
        if (!text.trim()) { Alert.alert('Empty Input', 'Please paste your CSV data first.'); return; }
        onImport(text.trim());
        setText('');
    };
    const handleClose = () => { setText(''); onClose(); };
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <View style={styles.modalRoot}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Import from CSV</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
                        <Ionicons name="close" size={22} color={GRAY} />
                    </TouchableOpacity>
                </View>
                <View style={styles.modalInstructions}>
                    <Ionicons name="information-circle-outline" size={18} color={BLUE} />
                    <Text style={styles.modalInstructionText}>
                        Export your profile first, then copy the CSV text and paste it below to restore your data.
                    </Text>
                </View>
                <TextInput
                    style={styles.csvTextArea}
                    value={text}
                    onChangeText={setText}
                    placeholder="Paste your exported CSV text here..."
                    placeholderTextColor={GRAY}
                    multiline
                    autoCorrect={false}
                    autoCapitalize="none"
                    spellCheck={false}
                    textAlignVertical="top"
                />
                <TouchableOpacity style={styles.actionBtn} onPress={handleImport} activeOpacity={0.85}>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Import</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}>
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

function convertImperialToMetric(value, type) {
    if(!value) return '';

    if (type === 'weight') {
        return (parseFloat(value) * 0.453592).toFixed(1); // lbs to kg
    } else if (type === 'size') {
        return (parseFloat(value) * 2.54).toFixed(1); // in to cm
    }
    return value;
}

function convertMetricToImperial(value, type) {
    if(!value) return '';
    if (type === 'weight') {
        return (parseFloat(value) * 2.20462).toFixed(1); // kg to lbs
    } else if (type === 'size') {
        return (parseFloat(value) * 0.393701).toFixed(1); // cm to in
    }
    return value;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FitnessProfileContent() {
    const auth = getAuth();
    const user = auth.currentUser;
    const [authToken, setAuthToken] = useState();

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

    // ── Progress pictures ──────────────────────────────────────────────────────
    const [pictures, setPictures] = useState([]);

    const handleAddPictureMenu = () => {
        Alert.alert('Add Progress Photo', 'Choose a source', [
            { text: 'Take Photo',          onPress: handleTakePicture  },
            { text: 'Choose from Library', onPress: handlePickPicture  },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handlePickPicture = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: false,
                quality: 0.8,
            });
            if (!result.canceled) {
                const { fileName, fileSize, uri } = result.assets[0];
                const nameParts = fileName.split('.');
                const fileType = nameParts[nameParts.length - 1];
                const formData = new FormData();
                formData.append('progressPicture', {
                    uri: uri,
                    name: `progress_${Date.now()}.${fileType}`,
                    size: fileSize,
                    type: `image/${fileType}`,
                });

                const newPic = result.assets.map((a) => ({
                    uri: a.uri,
                    date: new Date().toLocaleDateString(),
                }));
                fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/upload-progress-picture', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${await user.getIdToken()}`,
                    },
                    body: formData,
                }).then(() => {
                    console.log('Photo uploaded successfully');
                }).catch((err) => {
                    Alert.alert('Error', err.message)
                });
                setPictures((prev) => [...prev, newPic]);
            }
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    const handleTakePicture = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow camera access in Settings.');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (!result.canceled) {
                const { fileName, fileSize, uri } = result.assets[0];

                console.log(result.assets[0]);

                const nameParts = fileName.split('.');
                const fileType = nameParts[nameParts.length - 1];
                const formData = new FormData();
                formData.append('progressPicture', {
                    uri: uri,
                    name: `progress_${Date.now()}.${fileType}`,
                    size: fileSize,
                    type: `image/${fileType}`,
                });

                fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/upload-progress-picture', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${await user.getIdToken()}`,
                    },
                    body: formData,
                }).then(() => {
                    console.log('Photo uploaded successfully');
                }).catch((err) => {
                    Alert.alert('Error', err.message);
                });

                setPictures((prev) => [...prev, { uri: result.assets[0].uri, date: new Date().toLocaleDateString() }]);
            }
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    const removePicture = (i) => {
        const selectedPicture = pictures[i];

        if (!selectedPicture?.uri) {
            Alert.alert('Error', 'Could not find the selected photo.');
            return;
        }

        Alert.alert('Remove Photo', 'Delete this progress photo?', [
            { text: 'Delete', style: 'destructive', onPress: () => 
                {
                    fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/delete-progress-picture?pictureUrl=' + encodeURIComponent(selectedPicture.uri) + '&pictureId=' + encodeURIComponent(selectedPicture.id), {
                        method: 'delete',
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                        }
                    }).then(() => {
                        console.log('Photo deleted successfully');
                        setPictures((prev) => prev.filter((_, idx) => idx !== i));

                    }).catch((err) => {
                        Alert.alert('Error', err.message);
                    });

                }
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    // ── Rest Timer ─────────────────────────────────────────────────────────────
    const [defaultRest, setDefaultRest] = useState(90);
    const [customRest,  setCustomRest]  = useState('');
    const applyCustomRest = () => {
        const val = parseInt(customRest, 10);
        if (!isNaN(val) && val > 0) setDefaultRest(val);
        setCustomRest('');
    };

    // ── Import modal ───────────────────────────────────────────────────────────
    const [importVisible, setImportVisible] = useState(false);

    // ── Export ─────────────────────────────────────────────────────────────────
    const handleExport = async () => {
        const rows = [
            ['Field', 'Value'],
            ['Name', name],
            ['Date of Birth', dob],
            ['Units', useMetric ? 'Metric' : 'Imperial'],
            ...FIELDS.map((f) => [
                f.label,
                meas[f.key] ? `${meas[f.key]} ${f.type === 'weight' ? wUnit : sUnit}` : '',
            ]),
            ['Default Rest Timer', fmtRest(defaultRest)],
            ['Rest Timer Seconds', String(defaultRest)],
            ['Daily Goals',        daily.map((g) => g.text).join(' | ')],
            ['Monthly Goals',      monthly.map((g) => g.text).join(' | ')],
            ['Yearly Resolutions', yearly.map((g) => g.text).join(' | ')],
        ];
        try {
            await Share.share({ message: buildCSV(rows), title: 'Fitness Profile CSV' });
        } catch (e) {
            Alert.alert('Export Failed', e.message);
        }
    };

    // ── Import ─────────────────────────────────────────────────────────────────
    const handleImport = (text) => {
        try {
            const m = parseCSV(text);
            if (!Object.keys(m).length) {
                Alert.alert('Invalid Data', 'Could not parse the CSV. Make sure you pasted the full exported text.');
                return;
            }
            if (m['Name']          != null) setName(m['Name']);
            if (m['Date of Birth'] != null) setDob(m['Date of Birth']);
            if (m['Units']         != null) setUseMetric(m['Units'] === 'Metric');
            FIELDS.forEach((f) => {
                if (m[f.label] != null)
                    setMeas((prev) => ({ ...prev, [f.key]: m[f.label].replace(/\s*(kg|lbs|cm|in)$/, '').trim() }));
            });
            if (m['Rest Timer Seconds']) {
                const v = parseInt(m['Rest Timer Seconds'], 10);
                if (!isNaN(v) && v > 0) setDefaultRest(v);
            }
            if (m['Daily Goals']        != null) setDaily(goalsFromPipe(m['Daily Goals']));
            if (m['Monthly Goals']      != null) setMonthly(goalsFromPipe(m['Monthly Goals']));
            if (m['Yearly Resolutions'] != null) setYearly(goalsFromPipe(m['Yearly Resolutions']));
            setCollapsed({ personal: false, measurements: false, goals: false, pictures: false, rest: false, data: false });
            setImportVisible(false);
            Alert.alert('Import Successful', 'Your profile data has been restored.');
        } catch (e) {
            Alert.alert('Import Failed', e.message);
        }
    };

    useEffect(() => {

        // Load profile data from backend
        async function loadFullProfile() {
            setAuthToken(await user.getIdToken());

            fetch(process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/full-profile', {
                headers: {
                    'Authorization': `Bearer ${await user.getIdToken()}`, 
                }
            }).then(res => res.json()).then(data => {
                // console.log(data)

                setName(data.fullName);
                if(data.dateOfBirth)
                    setDob(new Date(data.dateOfBirth).toLocaleDateString());
                else
                    setDob('');
                
                data.bodyMeasurements.forEach(m => {
                    setMeasurement(m.bodyType, m.measurementValue !== null ? m.measurementValue.toString() : '');
                });

                data.dailyGoals.forEach(goal => {
                    setDaily((prev) => [...prev, { id: goal._id, text: goal.title, done: goal.achieved }]);
                })

                data.monthlyGoals.forEach(goal => {
                    setMonthly((prev) => [...prev, { id: goal._id, text: goal.title, done: goal.achieved }]);
                });

                data.yearlyGoals.forEach(goal => {
                    setYearly((prev) => [...prev, { id: goal._id, text: goal.title, done: goal.achieved }]);
                });

                data.progressPictures.forEach(picURL => {
                    console.log(picURL);
                    const parseURL = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL + '/api/profile/download-progress-picture?pictureUrl=' + picURL.url;
                    setPictures((prev) => [...prev, { id: picURL._id, uri: parseURL, date: picURL.date }]);
                })

                setDefaultRest(data.defaultRestTimer);
            }).catch(err => {
                console.error('Failed to load full profile:', err);
            });
        };

        loadFullProfile();

    }, []);

    const handleSaveFullName = async (newName) => {
        setName(newName);
        saveFullName(user, newName);
    };

    const handleSaveDob = async (newDob) => {
        setDob(newDob);
        saveDob(user, newDob);
    };

    const handleSaveMeasurement = (key, value) => {
        setMeasurements((prev) => {
            let updated;
            if(!useMetric) 
                updated = { ...prev, [key]: value };
            else
                updated = { ...prev, [key]: convertMetricToImperial(value, MEASUREMENT_FIELDS.find(f => f.key === key)?.type) };
            saveMeasurements(user, updated);
            return updated;
        });
    }

    const handleAddDailyGoal = async (goal) => {
        addDailyGoal(user, goal, setDaily);
    };

    const handleToggleDailyGoal = async (index) => {
        setDaily((prev) => {
            const updated = [...prev];
            updated[index].done = !updated[index].done;

            toggleDailyGoal(user, updated[index]);

            return updated;
        });
    };

    const handleDeleteDailyGoal = async (index) => {
        deleteDailyGoal(user, daily[index].id, setDaily);
    }

    const handleAddMonthlyGoal = async (goal) => {
        addMonthlyGoal(user, goal, setMonthly);
    };

    const handleToggleMonthlyGoal = async (index) => {
        setMonthly((prev) => {
            const updated = [...prev];
            updated[index].done = !updated[index].done;

            toggleMonthlyGoal(user, updated[index]);

            return updated;
        });
    };

    const handleDeleteMonthlyGoal = async (index) => {
        deleteMonthlyGoal(user, monthly[index].id, setMonthly);
    }

    const handleAddYearlyGoal = async (goal) => {
        addYearlyGoal(user, goal, setYearly);
    };

    const handleToggleYearlyGoal = async (index) => {
        setYearly((prev) => {
            const updated = [...prev];
            updated[index].done = !updated[index].done;

            toggleYearlyGoal(user, updated[index]);

            return updated;
        });
    };

    const handleDeleteYearlyGoal = async (index) => {
        deleteYearlyGoal(user, yearly[index].id, setYearly);
    }

    return (
        <>
            <ScrollView
                style={styles.root}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
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
                            value={!useMetric ? (measurements[f.key] ?? '') : (convertImperialToMetric(measurements[f.key], f.type) ?? '')}
                            onChangeText={(v) => handleSaveMeasurement(f.key, v)}
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
                        onAdd={(t) => handleAddDailyGoal(t)}
                        onToggle={(i) => handleToggleDailyGoal(i)}
                        onDelete={(i) => handleDeleteDailyGoal(i)}
                    />
                    <View style={styles.divider} />
                    <GoalGroup
                        label="Monthly Goals"
                        goals={monthly}
                        onAdd={(t) => handleAddMonthlyGoal(t)}
                        onToggle={(i) => handleToggleMonthlyGoal(i)}
                        onDelete={(i) => handleDeleteMonthlyGoal(i)}
                    />
                    <View style={styles.divider} />
                    <GoalGroup
                        label="Yearly Resolutions"
                        goals={yearly}
                        onAdd={(t) => handleAddYearlyGoal(t)}
                        onToggle={(i) => handleToggleYearlyGoal(i)}
                        onDelete={(i) => handleDeleteYearlyGoal(i)}
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
                            onPress={handleAddPictureMenu}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="add-circle-outline" size={32} color={BLUE} />
                            <Text style={styles.addPictureLabel}>Add Photo</Text>
                        </TouchableOpacity>
                        {pictures !== null && pictures.map((pic, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => removePicture(i)}
                                activeOpacity={0.85}
                                style={{ marginRight: 10 }}
                            >
                                <Image source={{ uri: pic.uri, headers: { Authorization: `Bearer ${authToken}` } }} style={styles.pictureThumbnail} resizeMode="cover" />
                                <View style={styles.picDateBadge}>
                                    <Text style={styles.picDateText}>{pic.date}</Text>
                                </View>
                                <View style={styles.picRemoveBadge}>
                                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {pictures.length > 0 && (
                        <Text style={styles.hintTextSm}>
                            {pictures.length} photo{pictures.length !== 1 ? 's' : ''} added — tap to remove
                        </Text>
                    )}
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

                {/* ── Export & Import Data ──────────────────────────────────── */}
                <Section id="data" icon="swap-vertical-outline" title="Export & Import Data" collapsed={collapsed} toggleSection={toggleSection}>
                    <Text style={styles.hintText}>
                        Export your profile data as CSV text to back it up, or paste a previous export to restore everything.
                    </Text>
                    <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85}>
                        <Ionicons name="document-text-outline" size={22} color="#fff" />
                        <Text style={styles.exportBtnText}>Export as CSV</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintTextSm}>
                        Opens your device share sheet — copy, email, or save the CSV text.
                    </Text>
                    <View style={styles.orRow}>
                        <View style={styles.orLine} />
                        <Text style={styles.orText}>OR</Text>
                        <View style={styles.orLine} />
                    </View>
                    <TouchableOpacity style={styles.importBtn} onPress={() => setImportVisible(true)} activeOpacity={0.85}>
                        <Ionicons name="cloud-upload-outline" size={22} color={BLUE} />
                        <Text style={styles.importBtnText}>Import from CSV</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintTextSm}>
                        Paste previously exported CSV text to restore your full profile.
                    </Text>
                </Section>

            </ScrollView>
            
            <ImportModal
                visible={importVisible}
                onClose={() => setImportVisible(false)}
                onImport={handleImport}
            />
        </>
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
    picDateBadge:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingVertical: 3, alignItems: 'center' },
    picDateText:      { fontSize: 9, color: '#fff', fontWeight: '600' },
    picRemoveBadge:   { position: 'absolute', top: -6, right: -6 },

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

    orRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
    orLine:        { flex: 1, height: 1, backgroundColor: BORDER },
    orText:        { fontSize: 12, color: GRAY, fontWeight: '600' },
    importBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: BLUE },
    importBtnText: { fontSize: 16, fontWeight: '700', color: BLUE },

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

    // Modals
    modalRoot:            { flex: 1, backgroundColor: '#f9fafb', padding: 20, paddingTop: 40 },
    modalHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle:           { fontSize: 18, fontWeight: '700', color: '#111827' },
    modalCloseBtn:        { padding: 4 },
    modalInstructions:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: LIGHT_BLUE, borderRadius: 12, padding: 12, marginBottom: 16 },
    modalInstructionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
    csvTextArea:          { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, fontSize: 13, color: '#111', fontFamily: 'monospace', marginBottom: 14, minHeight: 200 },
    actionBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, marginBottom: 10 },
    actionBtnText:        { fontSize: 16, fontWeight: '700', color: '#fff' },
    modalCancelBtn:       { alignItems: 'center', paddingVertical: 14 },
    modalCancelBtnText:   { fontSize: 15, color: GRAY, fontWeight: '600' },
});