import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, Share, Modal, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getAuth } from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import { saveFullName, saveDob, saveMeasurements, saveDefaultRestTimer, addDailyGoal, toggleDailyGoal, deleteDailyGoal, addMonthlyGoal, toggleMonthlyGoal, deleteMonthlyGoal, addYearlyGoal, toggleYearlyGoal, deleteYearlyGoal } from '../../services/profileService';

const BLUE = '#00b4d8', GRAY = '#9ca3af', LIGHT_BLUE = '#e0f7fc', BORDER = '#e5e7eb', LIGHT_GRAY = '#f3f4f6', GREEN = '#22c55e';
const API = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL;
const REST_PRESETS = [30, 60, 90, 120, 180, 300];
const formatRest = (s) => s >= 60 ? `${Math.floor(s / 60)}m${s % 60 > 0 ? ` ${s % 60}s` : ''}` : `${s}s`;
const mf = (key, label, type = 'size') => ({ key, label, type });
const MEASUREMENT_FIELDS = [
    mf('weight', 'Weight', 'weight'),
    mf('height', 'Height'), mf('chest', 'Chest'),   mf('waist', 'Waist'),
    mf('hips',   'Hips'),   mf('neck',  'Neck'),    mf('shoulders', 'Shoulders'),
    mf('biceps', 'Biceps'), mf('forearms', 'Forearms'), mf('thighs', 'Thighs'), mf('calves', 'Calves'),
];

const buildCSV = (rows) => rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
const parseCSV = (text) => {
    const map = {};
    for (const line of text.trim().split(/\r?\n/)) {
        const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/);
        if (m) map[m[1].replace(/""/g, '"')] = m[2].replace(/""/g, '"');
    }
    return map;
};
const goalsFromPipe = (str) => str?.trim() ? str.split(' | ').filter(Boolean).map((text) => ({ text, done: false })) : [];
const convertMeasurement = (value, type, toMetric) => {
    if (!value) return '';
    const n = parseFloat(value);
    if (type === 'weight') return (toMetric ? n * 0.453592 : n * 2.20462).toFixed(1);
    if (type === 'size')   return (toMetric ? n * 2.54     : n * 0.393701).toFixed(1);
    return value;
};

function LabeledInput({ label, value, onChangeText, onEndEditing, maxLength = null, placeholder, keyboardType = 'default', suffix }) {
    return (
        <View style={styles.labeledInputRow}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={styles.inputWithSuffix}>
                <TextInput style={styles.inlineInput} value={value} onChangeText={onChangeText} onEndEditing={onEndEditing} maxLength={maxLength} placeholder={placeholder ?? '—'} placeholderTextColor={GRAY} keyboardType={keyboardType} />
                {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
            </View>
        </View>
    );
}

function GoalGroup({ label, goals, onAdd, onToggle, onDelete }) {
    const [input, setInput] = useState('');
    const [adding, setAdding] = useState(false);
    const save = () => { if (input.trim()) { onAdd(input.trim()); setInput(''); setAdding(false); } };
    return (
        <View style={styles.goalGroup}>
            <Text style={styles.goalGroupTitle}>{label}</Text>
            {goals.length === 0 && !adding && <Text style={styles.emptyText}>No goals yet.</Text>}
            {goals.map((g, i) => (
                <View key={i} style={styles.goalRow}>
                    <TouchableOpacity onPress={() => onToggle(i)} style={{ padding: 2 }}><Ionicons name={g.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={g.done ? BLUE : GRAY} /></TouchableOpacity>
                    <Text style={[styles.goalText, g.done && styles.goalDone]}>{g.text}</Text>
                    <TouchableOpacity onPress={() => onDelete(i)} style={{ padding: 4 }}><Ionicons name="trash-outline" size={18} color="#ef4444" /></TouchableOpacity>
                </View>
            ))}
            {adding ? (
                <View style={styles.goalInputRow}>
                    <TextInput autoFocus style={styles.goalInput} value={input} onChangeText={setInput} placeholder="Describe your goal..." placeholderTextColor={GRAY} onSubmitEditing={save} maxLength={50} />
                    <TouchableOpacity style={styles.goalSaveBtn} onPress={save}><Text style={styles.goalSaveBtnText}>Save</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.goalCancelBtn} onPress={() => setAdding(false)}><Ionicons name="close" size={18} color={GRAY} /></TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.addGoalBtn} onPress={() => setAdding(true)}>
                    <Ionicons name="add" size={18} color={BLUE} /><Text style={styles.addGoalText}>Add goal</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

function Section({ id, icon, title, collapsed, toggleSection, isDirty, children }) {
    return (
        <View style={[styles.card, { marginBottom: 14 }]}>
            <TouchableOpacity style={styles.sectionToggle} onPress={() => toggleSection(id)} activeOpacity={0.7}>
                <View style={styles.sectionHeader}>
                    <Ionicons name={icon} size={20} color={BLUE} />
                    <Text style={styles.sectionTitle}>{title}</Text>
                    {isDirty && <View style={styles.dirtyDot} />}
                </View>
                <Ionicons name={collapsed[id] ? 'chevron-down' : 'chevron-up'} size={20} color={GRAY} />
            </TouchableOpacity>
            {!collapsed[id] && <View style={styles.sectionBody}>{children}</View>}
        </View>
    );
}

function PhotoPreviewModal({ visible, pic, onClose, onDelete }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.previewOverlay}>
                <View style={styles.previewContainer}>
                    <View style={styles.previewHeader}>
                        <Text style={styles.previewDate}>{pic?.date ?? ''}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.previewCloseBtn}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
                    </View>
                    {pic && <Image source={{ uri: pic.uri, headers: pic.headers }} style={styles.previewImage} resizeMode="contain" />}
                    <TouchableOpacity style={styles.previewDeleteBtn} onPress={onDelete}>
                        <Ionicons name="trash-outline" size={20} color="#fff" /><Text style={styles.previewDeleteText}>Delete Photo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function ImportModal({ visible, onClose, onImport }) {
    const [text, setText] = useState('');
    const [isPicking, setIsPicking] = useState(false);
    const handleClose = () => { setText(''); onClose(); };
    const handlePickFile = async () => {
        try {
            setIsPicking(true);
            const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain', '*/*'], copyToCacheDirectory: true });
            if (result.canceled) { setIsPicking(false); return; }
            onImport((await (await fetch(result.assets[0].uri)).text()).trim());
        } catch (e) { Alert.alert('File Import Failed', e.message); }
        finally { setIsPicking(false); }
    };
    const handlePasteImport = () => {
        if (!text.trim()) { Alert.alert('Empty Input', 'Please paste your CSV data first.'); return; }
        onImport(text.trim()); setText('');
    };
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
            <View style={styles.modalRoot}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Import from CSV</Text>
                    <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}><Ionicons name="close" size={22} color={GRAY} /></TouchableOpacity>
                </View>
                <View style={styles.modalInstructions}>
                    <Ionicons name="information-circle-outline" size={18} color={BLUE} />
                    <Text style={styles.modalInstructionText}>Pick your exported CSV file directly, or paste the CSV text below to restore your profile.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={handlePickFile} activeOpacity={0.85} disabled={isPicking}>
                    <Ionicons name="folder-open-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{isPicking ? 'Opening…' : 'Pick CSV File'}</Text>
                </TouchableOpacity>
                <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OR PASTE</Text><View style={styles.orLine} /></View>
                <TextInput style={styles.csvTextArea} value={text} onChangeText={setText} placeholder="Paste your exported CSV text here..." placeholderTextColor={GRAY} multiline autoCorrect={false} autoCapitalize="none" spellCheck={false} textAlignVertical="top" maxLength={1000} />
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GRAY }]} onPress={handlePasteImport} activeOpacity={0.85}>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" /><Text style={styles.actionBtnText}>Import Pasted Text</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}><Text style={styles.modalCancelBtnText}>Cancel</Text></TouchableOpacity>
            </View>
        </Modal>
    );
}

export default function FitnessProfileContent() {
    const user = getAuth().currentUser;
    const [authToken,    setAuthToken]    = useState();
    const [isSaving,     setIsSaving]     = useState(false);
    const [dirty,        setDirty]        = useState({ personal: false, measurements: false, rest: false });
    const [collapsed,    setCollapsed]    = useState({ personal: false, measurements: true, goals: true, pictures: true, rest: true, export: true });
    const [name,         setName]         = useState('');
    const [dob,          setDob]          = useState('');
    const [useMetric,    setUseMetric]    = useState(false);
    const [measurements,        setMeasurements]        = useState({});
    const [displayMeasurements, setDisplayMeasurements] = useState({});
    const [daily,   setDaily]   = useState([]);
    const [monthly, setMonthly] = useState([]);
    const [yearly,  setYearly]  = useState([]);
    const [pictures,      setPictures]      = useState([]);
    const [defaultRest,   setDefaultRest]   = useState(90);
    const [customRest,    setCustomRest]    = useState('');
    const [importVisible, setImportVisible] = useState(false);
    const [previewPic,    setPreviewPic]    = useState(null);
    const [previewIndex,  setPreviewIndex]  = useState(null);

    const weightUnit    = useMetric ? 'kg' : 'lbs';
    const sizeUnit      = useMetric ? 'cm' : 'in';
    const isAnyDirty    = dirty.personal || dirty.measurements || dirty.rest;
    const markDirty     = (s) => setDirty((p) => ({ ...p, [s]: true }));
    const toggleSection = (k) => setCollapsed((p) => ({ ...p, [k]: !p[k] }));
    const sectionProps  = { collapsed, toggleSection };
    const authHeader    = { Authorization: `Bearer ${authToken}` };

    const uploadPicture = async (launchFn, permFn, permMsg) => {
        const { status } = await permFn();
        if (status !== 'granted') { Alert.alert('Permission needed', permMsg); return; }
        const result = await launchFn({ quality: 0.8 });
        if (result.canceled) return;
        const { uri, fileName, fileSize } = result.assets[0];
        const ext = fileName.split('.').pop();
        const formData = new FormData();
        formData.append('progressPicture', { uri, name: `progress_${Date.now()}.${ext}`, size: fileSize, type: `image/${ext}` });
        fetch(`${API}/api/profile/upload-progress-picture`, { method: 'POST', headers: { Authorization: `Bearer ${await user.getIdToken()}` }, body: formData })
            .catch((err) => Alert.alert('Error', err.message));
        setPictures((prev) => [...prev, { uri, date: new Date().toLocaleDateString() }]);
    };

    const handlePickPicture = () => uploadPicture(ImagePicker.launchImageLibraryAsync, ImagePicker.requestMediaLibraryPermissionsAsync, 'Please allow photo library access in Settings.').catch((e) => Alert.alert('Error', e.message));
    const handleTakePicture = () => uploadPicture(ImagePicker.launchCameraAsync, ImagePicker.requestCameraPermissionsAsync, 'Please allow camera access in Settings.').catch((e) => Alert.alert('Error', e.message));
    const openPreview = (pic, i) => { setPreviewPic({ ...pic, headers: authHeader }); setPreviewIndex(i); };

    const removePicture = () => {
        const i = previewIndex, pic = pictures[i];
        if (!pic?.uri) { Alert.alert('Error', 'Could not find the selected photo.'); return; }
        Alert.alert('Remove Photo', 'Delete this progress photo?', [
            { text: 'Delete', style: 'destructive', onPress: () =>
                fetch(`${API}/api/profile/delete-progress-picture?pictureUrl=${encodeURIComponent(pic.uri)}&pictureId=${encodeURIComponent(pic.id)}`,
                    { method: 'delete', headers: authHeader }
                ).then(() => { setPictures((prev) => prev.filter((_, idx) => idx !== i)); setPreviewPic(null); setPreviewIndex(null); })
                 .catch((err) => Alert.alert('Error', err.message)),
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const makeGoalHandlers = (setter, addFn, toggleFn, deleteFn) => ({
        add: (text) => {
            const g = { id: null, text, done: false };
            setter((prev) => [...prev, g]);
            addFn(user, text)
                .then((goalId) => setter((prev) => prev.map((x) => x === g ? { ...x, id: goalId } : x)))
                .catch(() => { setter((prev) => prev.filter((x) => x !== g)); Alert.alert('Error', 'Failed to save goal.'); });
        },
        toggle: (i) => setter((prev) => {
            const u = prev.map((g, idx) => idx === i ? { ...g, done: !g.done } : g);
            toggleFn(user, u[i]).catch(() => { setter((p) => p.map((g, idx) => idx === i ? { ...g, done: !g.done } : g)); Alert.alert('Error', 'Failed to update goal.'); });
            return u;
        }),
        delete: (i) => setter((prev) => {
            const removed = prev[i], updated = prev.filter((_, idx) => idx !== i);
            deleteFn(user, removed.id, setter).catch(() => { setter((p) => [...p.slice(0, i), removed, ...p.slice(i)]); Alert.alert('Error', 'Failed to delete goal.'); });
            return updated;
        }),
    });

    const dailyH   = makeGoalHandlers(setDaily,   addDailyGoal,   toggleDailyGoal,   deleteDailyGoal);
    const monthlyH = makeGoalHandlers(setMonthly, addMonthlyGoal, toggleMonthlyGoal, deleteMonthlyGoal);
    const yearlyH  = makeGoalHandlers(setYearly,  addYearlyGoal,  toggleYearlyGoal,  deleteYearlyGoal);

    const handleExport = async () => {
        const rows = [
            ['Field', 'Value'], ['Name', name], ['Date of Birth', dob], ['Units', useMetric ? 'Metric' : 'Imperial'],
            ...MEASUREMENT_FIELDS.map((f) => [f.label, measurements[f.key] ? `${measurements[f.key]} ${f.type === 'weight' ? weightUnit : sizeUnit}` : '']),
            ['Default Rest Timer', formatRest(defaultRest)], ['Rest Timer Seconds', String(defaultRest)],
            ['Daily Goals', daily.map((g) => g.text).join(' | ')],
            ['Monthly Goals', monthly.map((g) => g.text).join(' | ')],
            ['Yearly Resolutions', yearly.map((g) => g.text).join(' | ')],
        ];
        try {
            const csv = buildCSV(rows);
            const fileUri = `${FileSystem.cacheDirectory}fitness_profile.csv`;
            await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
            await Share.share(Platform.OS === 'ios' ? { url: fileUri, title: 'Fitness Profile CSV' } : { message: csv, title: 'Fitness Profile CSV' });
        } catch (e) { Alert.alert('Export Failed', e.message); }
    };

    const handleImport = (text) => {
        try {
            const m = parseCSV(text);
            if (!Object.keys(m).length) { Alert.alert('Invalid Data', 'Could not parse the CSV. Make sure you selected or pasted the correct file.'); return; }
            if (m['Name']          != null) setName(m['Name']);
            if (m['Date of Birth'] != null) setDob(m['Date of Birth']);
            if (m['Units']         != null) setUseMetric(m['Units'] === 'Metric');
            const mu = Object.fromEntries(MEASUREMENT_FIELDS.filter((f) => m[f.label] != null).map((f) => [f.key, m[f.label].replace(/\s*(kg|lbs|cm|in)$/, '').trim()]));
            if (Object.keys(mu).length) setMeasurements((prev) => ({ ...prev, ...mu }));
            if (m['Rest Timer Seconds']) { const v = parseInt(m['Rest Timer Seconds'], 10); if (!isNaN(v) && v > 0) setDefaultRest(v); }
            if (m['Daily Goals']        != null) setDaily(goalsFromPipe(m['Daily Goals']));
            if (m['Monthly Goals']      != null) setMonthly(goalsFromPipe(m['Monthly Goals']));
            if (m['Yearly Resolutions'] != null) setYearly(goalsFromPipe(m['Yearly Resolutions']));
            setCollapsed({ personal: false, measurements: false, goals: false, pictures: false, rest: false, data: false });
            setDirty({ personal: true, measurements: true, rest: true });
            setImportVisible(false);
            Alert.alert('Import Successful', 'Review your data and tap "Apply Changes" to save.');
        } catch (e) { Alert.alert('Import Failed', e.message); }
    };

    const validateInputs = () => {
        if (dirty.personal) {
            if (!name.trim()) {
                Alert.alert('Invalid Name', 'Full name cannot be empty.');
                return false;
            }
            if (dob.trim()) {
                const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
                if (!dobRegex.test(dob.trim())) {
                    Alert.alert('Invalid Date', 'Date of Birth must be in MM/DD/YYYY format.');
                    return false;
                }
                const [month, day, year] = dob.trim().split('/').map(Number);
                const parsed = new Date(year, month - 1, day);
                if (parsed.getMonth() !== month - 1 || parsed.getDate() !== day || parsed.getFullYear() !== year) {
                    Alert.alert('Invalid Date', 'Please enter a valid calendar date.');
                    return false;
                }
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (parsed >= today) {
                    Alert.alert('Invalid Date', 'Date of birth must be in the past.');
                    return false;
                }
            }
        }
        if (dirty.measurements) {
            for (const f of MEASUREMENT_FIELDS) {
                const raw = measurements[f.key];
                if (!raw) continue;
                const val = parseFloat(raw);
                if (isNaN(val) || val <= 0) {
                    Alert.alert('Invalid Measurement', `${f.label} must be a positive number.`);
                    return false;
                }
                const max = f.type === 'weight' ? 9999 : 999;
                if (val > max) {
                    Alert.alert('Invalid Measurement', `${f.label} value seems too large. Please double-check.`);
                    return false;
                }
            }
        }
        return true;
    };

    const handleApplyChanges = async () => {
        if (!isAnyDirty) return;
        if (!validateInputs()) return;
        setIsSaving(true);
        try {
            const saves = [];
            if (dirty.personal) { saves.push(saveFullName(user, name)); saves.push(saveDob(user, dob)); }
            if (dirty.measurements) saves.push(saveMeasurements(user, Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, measurements[f.key] ?? '']))));
            if (dirty.rest) {
                const custom = parseInt(customRest, 10);
                saves.push(saveDefaultRestTimer(user, !isNaN(custom) && custom > 0 ? (setDefaultRest(custom), setCustomRest(''), custom) : defaultRest));
            }
            await Promise.all(saves);
            setDirty({ personal: false, measurements: false, rest: false });
            Toast.show({ type: 'success', text1: 'Profile saved', text2: 'All changes have been applied.' });
        } catch (err) {
            console.error(err);
            Toast.show({ type: 'error', text1: 'Save failed', text2: 'Could not save some changes. Please try again.' });
        } finally { setIsSaving(false); }
    };

    useEffect(() => {
        async function loadFullProfile() {
            const token = await user.getIdToken();
            setAuthToken(token);
            fetch(`${API}/api/profile/full-profile`, { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => res.json())
                .then((data) => {
                    setName(data.fullName);
                    setDob(data.dateOfBirth ? (() => { const [y, mo, d] = data.dateOfBirth.split('T')[0].split('-'); return `${mo}/${d}/${y}`; })() : '');
                    setMeasurements(Object.fromEntries(data.bodyMeasurements.map((m) => [m.bodyType, m.measurementValue !== null ? m.measurementValue.toString() : ''])));
                    [[data.dailyGoals, setDaily], [data.monthlyGoals, setMonthly], [data.yearlyGoals, setYearly]]
                        .forEach(([goals, setter]) => setter(goals.map((g) => ({ id: g._id, text: g.title, done: g.achieved }))));
                    setPictures(data.progressPictures.map((p) => {
                        const [y, mo, d] = (p.date ?? '').split('T')[0].split('-');
                        const formatted = y && mo && d ? `${mo}/${d}/${y}` : p.date ?? '';
                        return { id: p._id, uri: `${API}/api/profile/download-progress-picture?pictureUrl=${p.url}`, date: formatted };
                    }));
                    setDefaultRest(data.defaultRestTimer);
                })
                .catch((err) => console.error('Failed to load full profile:', err));
        }
        loadFullProfile();
    }, []);

    return (
        <>
            <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {isAnyDirty && (
                    <TouchableOpacity style={[styles.applyBanner, isSaving && { opacity: 0.65 }]} onPress={handleApplyChanges} activeOpacity={0.85} disabled={isSaving}>
                        <Ionicons name={isSaving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color="#fff" />
                        <Text style={styles.applyBannerText}>{isSaving ? 'Saving…' : 'Apply Changes'}</Text>
                    </TouchableOpacity>
                )}
                <Section id="personal" icon="person-circle-outline" title="Personal Info" {...sectionProps} isDirty={dirty.personal}>
                    <LabeledInput label="Full Name"     value={name} onChangeText={(v) => { setName(v); markDirty('personal'); }} placeholder="Your name" maxLength={50} />
                    <LabeledInput label="Date of Birth" value={dob}  onChangeText={(v) => { setDob(v);  markDirty('personal'); }} placeholder="MM/DD/YYYY" maxLength={10} keyboardType="numbers-and-punctuation" />
                </Section>
                <Section id="measurements" icon="body-outline" title="Body Measurements" {...sectionProps} isDirty={dirty.measurements}>
                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.switchLabel}>{useMetric ? 'Metric (kg, cm, km)' : 'Imperial (lbs, in, mi)'}</Text>
                            <Text style={styles.switchSub}>Affects all measurements & distances</Text>
                        </View>
                        <Switch value={useMetric} onValueChange={(v) => { setUseMetric(v); setDisplayMeasurements({}); }} trackColor={{ false: BORDER, true: BLUE }} thumbColor="#fff" />
                    </View>
                    <View style={styles.unitBadgeRow}>
                        {[['Weight', weightUnit], ['Size', sizeUnit], ['Distance', useMetric ? 'km' : 'mi']].map(([l, v]) => (
                            <View key={l} style={styles.unitBadge}>
                                <Text style={styles.unitBadgeLabel}>{l}</Text>
                                <Text style={styles.unitBadgeValue}>{v}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={[styles.divider, { marginTop: 16 }]} />
                    {MEASUREMENT_FIELDS.map((f) => (
                        <LabeledInput key={f.key} label={f.label}
                            value={!useMetric ? (measurements[f.key] ?? '') : (displayMeasurements[f.key] ?? convertMeasurement(measurements[f.key], f.type, true) ?? '')}
                            onChangeText={(v) => {
                                if (useMetric) {
                                    setDisplayMeasurements((prev) => ({ ...prev, [f.key]: v }));
                                    const imp = convertMeasurement(v, f.type, false);
                                    if (imp) setMeasurements((prev) => ({ ...prev, [f.key]: imp }));
                                } else { setMeasurements((prev) => ({ ...prev, [f.key]: v })); }
                                markDirty('measurements');
                            }}
                            onEndEditing={(e) => {
                                if (!useMetric) return;
                                const imp = convertMeasurement(e.nativeEvent.text, f.type, false);
                                setMeasurements((prev) => ({ ...prev, [f.key]: imp }));
                                setDisplayMeasurements((prev) => ({ ...prev, [f.key]: convertMeasurement(imp, f.type, true) }));
                            }}
                            maxLength={5}
                            keyboardType="decimal-pad" suffix={f.type === 'weight' ? weightUnit : sizeUnit}
                        />
                    ))}
                </Section>
                <Section id="goals" icon="flag-outline" title="Goals & Resolutions" {...sectionProps} isDirty={false}>
                    <GoalGroup label="Daily Goals"        goals={daily}   onAdd={dailyH.add}   onToggle={dailyH.toggle}   onDelete={dailyH.delete} />
                    <View style={styles.divider} />
                    <GoalGroup label="Monthly Goals"      goals={monthly} onAdd={monthlyH.add} onToggle={monthlyH.toggle} onDelete={monthlyH.delete} />
                    <View style={styles.divider} />
                    <GoalGroup label="Yearly Resolutions" goals={yearly}  onAdd={yearlyH.add}  onToggle={yearlyH.toggle}  onDelete={yearlyH.delete} />
                </Section>
                <Section id="pictures" icon="camera-outline" title="Progress Pictures" {...sectionProps} isDirty={false}>
                    <Text style={styles.hintText}>Document your transformation over time. Photos are stored locally.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                        <TouchableOpacity style={styles.addPictureBox} onPress={() => Alert.alert('Add Progress Photo', 'Choose a source', [{ text: 'Take Photo', onPress: handleTakePicture }, { text: 'Choose from Library', onPress: handlePickPicture }, { text: 'Cancel', style: 'cancel' }])} activeOpacity={0.8}>
                            <Ionicons name="add-circle-outline" size={32} color={BLUE} />
                            <Text style={styles.addPictureLabel}>Add Photo</Text>
                        </TouchableOpacity>
                        {pictures.map((pic, i) => (
                            <TouchableOpacity key={i} onPress={() => openPreview(pic, i)} activeOpacity={0.85} style={{ marginRight: 10 }}>
                                <Image source={{ uri: pic.uri, headers: authHeader }} style={styles.pictureThumbnail} resizeMode="cover" />
                                <View style={styles.picDateBadge}><Text style={styles.picDateText}>{pic.date}</Text></View>
                                <View style={styles.picRemoveBadge}><Ionicons name="expand-outline" size={20} color="#fff" /></View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {pictures.length > 0 && <Text style={styles.hintTextSm}>{pictures.length} photo{pictures.length !== 1 ? 's' : ''} — tap to view</Text>}
                </Section>
                <Section id="rest" icon="timer-outline" title="Default Rest Timer" {...sectionProps} isDirty={dirty.rest}>
                    <Text style={styles.hintText}>Select a preset or enter a custom duration applied between sets.</Text>
                    <View style={styles.presetRow}>
                        {REST_PRESETS.map((s) => (
                            <TouchableOpacity key={s} style={[styles.chip, defaultRest === s && styles.chipActive]} onPress={() => { setDefaultRest(s); markDirty('rest'); }} activeOpacity={0.8}>
                                <Text style={[styles.chipText, defaultRest === s && styles.chipTextActive]}>{formatRest(s)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.customRestRow}>
                        <TextInput style={styles.customRestInput} value={customRest} onChangeText={(v) => { setCustomRest(v); markDirty('rest'); }} maxLength={5} placeholder="Custom (sec)" placeholderTextColor={GRAY} keyboardType="number-pad" />
                        <TouchableOpacity style={styles.customRestBtn} onPress={() => { const val = parseInt(customRest, 10); if (!isNaN(val) && val > 0 && val <= 3600) { setDefaultRest(val); setCustomRest(''); markDirty('rest'); } else if (!isNaN(val) && val > 3600) { Alert.alert('Invalid Duration', 'Rest timer cannot exceed 3600 seconds (1 hour).'); } }} activeOpacity={0.85}>
                            <Text style={styles.customRestBtnText}>Set</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.currentRestBadge}>
                        <Ionicons name="time-outline" size={18} color={BLUE} />
                        <Text style={styles.currentRestText}>Current default: <Text style={{ fontWeight: '700', color: BLUE }}>{formatRest(defaultRest)}</Text></Text>
                    </View>
                </Section>
                <Section id="data" icon="swap-vertical-outline" title="Export & Import Data" {...sectionProps} isDirty={false}>
                    <Text style={styles.hintText}>Export your profile data as CSV to back it up, or import a previously exported file to restore everything.</Text>
                    <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85}>
                        <Ionicons name="document-text-outline" size={22} color="#fff" />
                        <Text style={styles.exportBtnText}>Export as CSV</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintTextSm}>Opens your device share sheet — copy, email, or save the CSV text.</Text>
                    <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OR</Text><View style={styles.orLine} /></View>
                    <TouchableOpacity style={styles.importBtn} onPress={() => setImportVisible(true)} activeOpacity={0.85}>
                        <Ionicons name="cloud-upload-outline" size={22} color={BLUE} />
                        <Text style={styles.importBtnText}>Import from CSV</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintTextSm}>Pick a CSV file or paste exported text to restore your full profile.</Text>
                </Section>
            </ScrollView>
            <ImportModal visible={importVisible} onClose={() => setImportVisible(false)} onImport={handleImport} />
            <PhotoPreviewModal visible={previewPic !== null} pic={previewPic} onClose={() => { setPreviewPic(null); setPreviewIndex(null); }} onDelete={removePicture} />
        </>
    );
}

const styles = StyleSheet.create({
    root:          { flex: 1, backgroundColor: '#f9fafb' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    applyBanner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: GREEN, paddingVertical: 14, borderRadius: 14, marginBottom: 14, shadowColor: GREEN, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
    applyBannerText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    dirtyDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, marginLeft: 6 },
    card:            { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    sectionToggle:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionTitle:    { fontSize: 16, fontWeight: '700', color: '#111827' },
    sectionBody:     { paddingHorizontal: 16, paddingBottom: 16 },
    labeledInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    inputLabel:      { fontSize: 15, color: '#374151', fontWeight: '500', flex: 1 },
    inputWithSuffix: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    inlineInput:     { fontSize: 15, color: '#111', textAlign: 'right', minWidth: 80, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: LIGHT_GRAY, borderRadius: 8 },
    inputSuffix:     { fontSize: 13, color: GRAY, minWidth: 24 },
    switchRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
    switchLabel:     { fontSize: 15, fontWeight: '600', color: '#111827' },
    switchSub:       { fontSize: 12, color: GRAY, marginTop: 2 },
    unitBadgeRow:    { flexDirection: 'row', gap: 10, marginTop: 14 },
    unitBadge:       { flex: 1, backgroundColor: LIGHT_BLUE, borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
    unitBadgeLabel:  { fontSize: 11, color: GRAY, marginBottom: 2 },
    unitBadgeValue:  { fontSize: 16, fontWeight: '700', color: BLUE },
    divider:         { borderTopWidth: 1, borderTopColor: BORDER, marginVertical: 12 },
    goalGroup:       { marginBottom: 4 },
    goalGroupTitle:  { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6 },
    goalRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    goalText:        { flex: 1, fontSize: 14, color: '#111827' },
    goalDone:        { textDecorationLine: 'line-through', color: '#9ca3af' },
    goalInputRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    goalInput:       { flex: 1, backgroundColor: LIGHT_GRAY, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111', borderWidth: 1, borderColor: BORDER },
    goalSaveBtn:     { backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
    goalSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    goalCancelBtn:   { padding: 10, backgroundColor: LIGHT_GRAY, borderRadius: 10 },
    addGoalBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
    addGoalText:     { fontSize: 14, color: BLUE, fontWeight: '600' },
    emptyText:       { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', paddingVertical: 6 },
    addPictureBox:   { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderColor: BLUE, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    addPictureLabel: { fontSize: 11, color: BLUE, marginTop: 4, fontWeight: '600' },
    pictureThumbnail: { width: 90, height: 90, borderRadius: 12, backgroundColor: LIGHT_GRAY, marginRight: 10 },
    picDateBadge:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingVertical: 3, alignItems: 'center' },
    picDateText:     { fontSize: 9, color: '#fff', fontWeight: '600' },
    picRemoveBadge:  { position: 'absolute', top: 4, right: 4 },
    previewOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
    previewContainer:  { flex: 1, paddingTop: 50 },
    previewHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
    previewDate:       { fontSize: 14, color: '#fff', fontWeight: '600' },
    previewCloseBtn:   { padding: 8 },
    previewImage:      { flex: 1, width: '100%' },
    previewDeleteBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ef4444', marginHorizontal: 20, marginVertical: 20, paddingVertical: 14, borderRadius: 14 },
    previewDeleteText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    presetRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip:              { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: LIGHT_GRAY, borderWidth: 1, borderColor: BORDER },
    chipActive:        { backgroundColor: BLUE, borderColor: BLUE },
    chipText:          { fontSize: 13, fontWeight: '600', color: '#374151' },
    chipTextActive:    { color: '#fff' },
    customRestRow:     { flexDirection: 'row', gap: 10, marginTop: 14 },
    customRestInput:   { flex: 1, backgroundColor: LIGHT_GRAY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111', borderWidth: 1, borderColor: BORDER },
    customRestBtn:     { backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 22, justifyContent: 'center' },
    customRestBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    currentRestBadge:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, backgroundColor: LIGHT_BLUE, borderRadius: 10, padding: 12 },
    currentRestText:   { fontSize: 14, color: '#374151' },
    exportBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, marginTop: 12 },
    exportBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff' },
    orRow:             { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
    orLine:            { flex: 1, height: 1, backgroundColor: BORDER },
    orText:            { fontSize: 12, color: GRAY, fontWeight: '600' },
    importBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: BLUE },
    importBtnText:     { fontSize: 16, fontWeight: '700', color: BLUE },
    hintText:          { fontSize: 13, color: GRAY, lineHeight: 18 },
    hintTextSm:        { marginTop: 8, fontSize: 12, color: '#9ca3af' },
    modalRoot:            { flex: 1, backgroundColor: '#f9fafb', padding: 20, paddingTop: 40 },
    modalHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle:           { fontSize: 18, fontWeight: '700', color: '#111827' },
    modalInstructions:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: LIGHT_BLUE, borderRadius: 12, padding: 12, marginBottom: 16 },
    modalInstructionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
    csvTextArea:          { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, fontSize: 13, color: '#111', fontFamily: 'monospace', marginBottom: 14, minHeight: 150 },
    actionBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, marginBottom: 10 },
    actionBtnText:        { fontSize: 16, fontWeight: '700', color: '#fff' },
    modalCancelBtn:       { alignItems: 'center', paddingVertical: 14 },
    modalCancelBtnText:   { fontSize: 15, color: GRAY, fontWeight: '600' },
});