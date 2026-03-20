import React, { useState, useEffect } from 'react'; // Load React and two built-in tools: useState (stores values that can change on screen) and useEffect (runs code when the screen first loads)
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, Share, Modal, Image, Platform } from 'react-native'; // Import all the visual building blocks: containers, text, inputs, buttons, scrolling, toggles, alerts, sharing, popups, images, and OS detection
import { Ionicons } from '@expo/vector-icons'; // Import the icon library that provides icons like trash, checkmark, camera, etc.
import * as ImagePicker from 'expo-image-picker'; // Import the tool for opening the camera or photo library to let the user pick a photo
import * as DocumentPicker from 'expo-document-picker'; // Import the tool for letting the user pick a file from their phone (used for CSV import)
import * as FileSystem from 'expo-file-system/legacy'; // Import the file system tool so the app can write the exported CSV to the phone temporarily before sharing
import { getAuth } from '@react-native-firebase/auth'; // Import Firebase Auth to get the currently logged-in user and their security token
import Toast from 'react-native-toast-message'; // Import the small pop-up notification bar shown after saving or on errors
import { saveFullName, saveDob, saveMeasurements, saveDefaultRestTimer, addDailyGoal, toggleDailyGoal, deleteDailyGoal, addMonthlyGoal, toggleMonthlyGoal, deleteMonthlyGoal, addYearlyGoal, toggleYearlyGoal, deleteYearlyGoal } from '../../services/profileService'; // Import all the functions that send data to the server — one for each type of profile data (name, DOB, measurements, rest timer, and all three goal types)

const BLUE = '#00b4d8', GRAY = '#9ca3af', LIGHT_BLUE = '#e0f7fc', BORDER = '#e5e7eb', LIGHT_GRAY = '#f3f4f6', GREEN = '#22c55e'; // Named colour constants so the same colours are used consistently without copy-pasting hex codes everywhere
const API = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL; // The server's base URL, loaded from the environment config so it can be changed without touching the code
const REST_PRESETS = [30, 60, 90, 120, 180, 300]; // The six preset rest durations (in seconds) shown as quick-tap buttons in the rest timer section
const formatRest = (s) => s >= 60 ? `${Math.floor(s / 60)}m${s % 60 > 0 ? ` ${s % 60}s` : ''}` : `${s}s`; // Converts seconds into a readable label — e.g. 90 → "1m 30s", 45 → "45s"
const mf = (key, label, type = 'size') => ({ key, label, type }); // Shortcut that builds a measurement field object so we don't repeat the same structure 11 times in the list below
const MEASUREMENT_FIELDS = [
    mf('weight', 'Weight', 'weight'), // Weight uses a different conversion (lbs ↔ kg) so it gets type 'weight' instead of 'size'
    mf('height', 'Height'), mf('chest', 'Chest'),   mf('waist', 'Waist'), // These all use size conversion (inches ↔ cm)
    mf('hips',   'Hips'),   mf('neck',  'Neck'),    mf('shoulders', 'Shoulders'), // Same — size conversion
    mf('biceps', 'Biceps'), mf('forearms', 'Forearms'), mf('thighs', 'Thighs'), mf('calves', 'Calves'), // Same — size conversion
];

const buildCSV = (rows) => rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'); // Converts a 2D array into a CSV string — wraps each value in quotes (escaping any quotes already inside the value) then joins columns with commas and rows with newlines
const parseCSV = (text) => {
    const map = {}; // Will hold all key→value pairs found in the CSV (e.g. "Name" → "John")
    for (const line of text.trim().split(/\r?\n/)) { // Split the CSV into individual lines, handling both Windows and Mac/Linux line endings
        const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)"$/); // Check if the line matches the expected "key","value" format
        if (m) map[m[1].replace(/""/g, '"')] = m[2].replace(/""/g, '"'); // If it matches, unescape any double-quotes and store the key→value pair
    }
    return map; // Return the finished lookup object, used to restore profile data during import
};
const goalsFromPipe = (str) => str?.trim() ? str.split(' | ').filter(Boolean).map((text) => ({ text, done: false })) : []; // Splits a pipe-separated goals string like "Run 5k | Sleep 8h" into an array of goal objects each starting as not done; returns empty array if the string is blank
const convertMeasurement = (value, type, toMetric) => {
    if (!value) return ''; // If the value is empty, return empty — no conversion needed
    const n = parseFloat(value); // Parse the string to a number so we can do the math
    if (type === 'weight') return (toMetric ? n * 0.453592 : n * 2.20462).toFixed(1); // Weight: lbs→kg multiply by 0.453592, kg→lbs multiply by 2.20462; round to 1 decimal
    if (type === 'size')   return (toMetric ? n * 2.54     : n * 0.393701).toFixed(1); // Size: inches→cm multiply by 2.54, cm→inches multiply by 0.393701; round to 1 decimal
    return value; // If it's neither weight nor size, return the original value unchanged
};

function LabeledInput({ label, value, onChangeText, onEndEditing, placeholder, keyboardType = 'default', suffix }) { // Reusable input row — a field name on the left and a text box (+ optional unit label like "kg") on the right; used for name, DOB, and all measurements
    return (
        <View style={styles.labeledInputRow}> {/* Row that stretches the label and input across the full width */}
            <Text style={styles.inputLabel}>{label}</Text> {/* The field name shown on the left (e.g. "Weight") */}
            <View style={styles.inputWithSuffix}> {/* Small wrapper that keeps the text box and unit label side by side */}
                <TextInput style={styles.inlineInput} value={value} onChangeText={onChangeText} onEndEditing={onEndEditing} placeholder={placeholder ?? '—'} placeholderTextColor={GRAY} keyboardType={keyboardType} /> {/* The actual text box — calls onChangeText on every keystroke and onEndEditing when the keyboard closes (used to finalize unit conversion) */}
                {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null} {/* Shows the unit label (e.g. "kg" or "in") only when one was provided */}
            </View>
        </View>
    );
}

function GoalGroup({ label, goals, onAdd, onToggle, onDelete }) { // Renders one goal category (Daily / Monthly / Yearly) — shows the list, lets the user add new goals, check them off, or delete them
    const [input, setInput] = useState(''); // Tracks what the user is typing in the new goal text box
    const [adding, setAdding] = useState(false); // Controls whether the "type a new goal" row is currently visible
    const save = () => { if (input.trim()) { onAdd(input.trim()); setInput(''); setAdding(false); } }; // Saves the new goal only if the user typed something, then clears the input and hides the row
    return (
        <View style={styles.goalGroup}>
            <Text style={styles.goalGroupTitle}>{label}</Text> {/* The section heading, e.g. "Daily Goals" */}
            {goals.length === 0 && !adding && <Text style={styles.emptyText}>No goals yet.</Text>} {/* Shown only when the list is empty and the user isn't currently adding a goal */}
            {goals.map((g, i) => ( // Loop through every goal and render a row for each one
                <View key={i} style={styles.goalRow}>
                    <TouchableOpacity onPress={() => onToggle(i)} style={{ padding: 2 }}><Ionicons name={g.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={g.done ? BLUE : GRAY} /></TouchableOpacity> {/* Checkbox — filled blue circle when done, gray outline when pending; tapping calls onToggle to flip the done state */}
                    <Text style={[styles.goalText, g.done && styles.goalDone]}>{g.text}</Text> {/* Goal text — gets a strikethrough and turns gray when the goal is marked done */}
                    <TouchableOpacity onPress={() => onDelete(i)} style={{ padding: 4 }}><Ionicons name="trash-outline" size={18} color="#ef4444" /></TouchableOpacity> {/* Red trash icon — tapping permanently removes this goal by calling onDelete */}
                </View>
            ))}
            {adding ? ( // If the user tapped "Add goal", show the input row; otherwise show the "Add goal" button
                <View style={styles.goalInputRow}>
                    <TextInput autoFocus style={styles.goalInput} value={input} onChangeText={setInput} placeholder="Describe your goal..." placeholderTextColor={GRAY} onSubmitEditing={save} /> {/* Auto-focuses the keyboard when the row appears; pressing the return key also triggers save */}
                    <TouchableOpacity style={styles.goalSaveBtn} onPress={save}><Text style={styles.goalSaveBtnText}>Save</Text></TouchableOpacity> {/* Saves the new goal to the list */}
                    <TouchableOpacity style={styles.goalCancelBtn} onPress={() => setAdding(false)}><Ionicons name="close" size={18} color={GRAY} /></TouchableOpacity> {/* Hides the input row without saving anything */}
                </View>
            ) : (
                <TouchableOpacity style={styles.addGoalBtn} onPress={() => setAdding(true)}> {/* Shows the input row so the user can type a new goal */}
                    <Ionicons name="add" size={18} color={BLUE} /><Text style={styles.addGoalText}>Add goal</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

function Section({ id, icon, title, collapsed, toggleSection, isDirty, children }) { // Collapsible card that groups related profile fields — shows a green dot when the section has unsaved changes; tapping the header opens or closes it
    return (
        <View style={[styles.card, { marginBottom: 14 }]}>
            <TouchableOpacity style={styles.sectionToggle} onPress={() => toggleSection(id)} activeOpacity={0.7}> {/* Tapping anywhere on the header row opens or closes the section */}
                <View style={styles.sectionHeader}>
                    <Ionicons name={icon} size={20} color={BLUE} /> {/* The section's icon */}
                    <Text style={styles.sectionTitle}>{title}</Text> {/* The section's title */}
                    {isDirty && <View style={styles.dirtyDot} />} {/* Small green dot that appears when this section has changes that haven't been saved yet */}
                </View>
                <Ionicons name={collapsed[id] ? 'chevron-down' : 'chevron-up'} size={20} color={GRAY} /> {/* Arrow pointing down when closed, up when open */}
            </TouchableOpacity>
            {!collapsed[id] && <View style={styles.sectionBody}>{children}</View>} {/* Only renders the section's content when it is open */}
        </View>
    );
}

function PhotoPreviewModal({ visible, pic, onClose, onDelete }) { // Full-screen overlay that shows a progress photo large — includes the date, a close button, and a delete button
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}> {/* Fades in over the screen; onRequestClose handles the Android back button */}
            <View style={styles.previewOverlay}> {/* Near-black background covering the whole screen */}
                <View style={styles.previewContainer}>
                    <View style={styles.previewHeader}>
                        <Text style={styles.previewDate}>{pic?.date ?? ''}</Text> {/* Shows the date the photo was added; empty if the date is missing */}
                        <TouchableOpacity onPress={onClose} style={styles.previewCloseBtn}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity> {/* Closes the viewer without deleting the photo */}
                    </View>
                    {pic && <Image source={{ uri: pic.uri, headers: pic.headers }} style={styles.previewImage} resizeMode="contain" />} {/* Shows the photo at full size — the headers include the user's login token so the server allows the download */}
                    <TouchableOpacity style={styles.previewDeleteBtn} onPress={onDelete}>
                        <Ionicons name="trash-outline" size={20} color="#fff" /><Text style={styles.previewDeleteText}>Delete Photo</Text> {/* Triggers the delete confirmation; actual deletion logic lives in removePicture in the main component */}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function ImportModal({ visible, onClose, onImport }) { // Slide-up screen for restoring a profile from a CSV backup — supports either picking a file from the phone or pasting the CSV text directly
    const [text, setText] = useState(''); // Stores whatever the user pastes into the text area
    const [isPicking, setIsPicking] = useState(false); // Prevents tapping the "Pick File" button twice while the file browser is already open
    const handleClose = () => { setText(''); onClose(); }; // Clears any pasted text and closes the screen so it's clean next time it opens
    const handlePickFile = async () => {
        try {
            setIsPicking(true); // Marks the picker as busy so the button shows "Opening…" and can't be tapped again
            const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain', '*/*'], copyToCacheDirectory: true }); // Opens the phone's file browser; copies the chosen file to a temp location so the app can read it
            if (result.canceled) { setIsPicking(false); return; } // User closed the file browser without picking anything — reset and do nothing
            onImport((await (await fetch(result.assets[0].uri)).text()).trim()); // Reads the file contents as text, trims whitespace, and passes it to the parent's import handler
        } catch (e) { Alert.alert('File Import Failed', e.message); } // Shows the error message if reading the file failed
        finally { setIsPicking(false); } // Always re-enables the button whether the import worked or not
    };
    const handlePasteImport = () => {
        if (!text.trim()) { Alert.alert('Empty Input', 'Please paste your CSV data first.'); return; } // Stops the import if the text area is empty
        onImport(text.trim()); setText(''); // Passes the pasted CSV text to the parent's import handler and clears the text area
    };
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}> {/* Slides up from the bottom; on iOS it looks like a card you can swipe down to dismiss */}
            <View style={styles.modalRoot}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Import from CSV</Text>
                    <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}><Ionicons name="close" size={22} color={GRAY} /></TouchableOpacity> {/* Closes the screen and wipes any pasted text */}
                </View>
                <View style={styles.modalInstructions}>
                    <Ionicons name="information-circle-outline" size={18} color={BLUE} />
                    <Text style={styles.modalInstructionText}>Pick your exported CSV file directly, or paste the CSV text below to restore your profile.</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={handlePickFile} activeOpacity={0.85} disabled={isPicking}> {/* Disabled while the file browser is open to prevent double-tapping */}
                    <Ionicons name="folder-open-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>{isPicking ? 'Opening…' : 'Pick CSV File'}</Text> {/* Label changes to "Opening…" while the file browser is loading */}
                </TouchableOpacity>
                <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OR PASTE</Text><View style={styles.orLine} /></View> {/* Visual divider separating the two import methods */}
                <TextInput style={styles.csvTextArea} value={text} onChangeText={setText} placeholder="Paste your exported CSV text here..." placeholderTextColor={GRAY} multiline autoCorrect={false} autoCapitalize="none" spellCheck={false} textAlignVertical="top" /> {/* Multi-line paste area — autocorrect and spellcheck are off so they don't corrupt the CSV data */}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: GRAY }]} onPress={handlePasteImport} activeOpacity={0.85}>
                    <Ionicons name="cloud-upload-outline" size={20} color="#fff" /><Text style={styles.actionBtnText}>Import Pasted Text</Text> {/* Reads the pasted text and triggers the import */}
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={handleClose}><Text style={styles.modalCancelBtnText}>Cancel</Text></TouchableOpacity> {/* Closes the screen without importing anything */}
            </View>
        </Modal>
    );
}

export default function FitnessProfileContent() {
    const user = getAuth().currentUser; // The currently logged-in Firebase user — needed to attach auth tokens to every server request
    const [authToken,    setAuthToken]    = useState(); // Stores the user's login token after it's fetched on load — reused for all image and API requests during the session
    const [isSaving,     setIsSaving]     = useState(false); // True while a save is in progress — disables the "Apply Changes" banner and shows "Saving…"
    const [dirty,        setDirty]        = useState({ personal: false, measurements: false, rest: false }); // Tracks which sections have unsaved changes — when any is true, the green "Apply Changes" banner appears
    const [collapsed,    setCollapsed]    = useState({ personal: false, measurements: true, goals: true, pictures: true, rest: true, export: true }); // Tracks which section cards are open or closed — Personal Info starts open, everything else starts collapsed
    const [name,         setName]         = useState(''); // The user's full name from the Personal Info section
    const [dob,          setDob]          = useState(''); // The user's date of birth as a display string, e.g. "01/15/1990"
    const [useMetric,    setUseMetric]    = useState(false); // Whether the user is in metric mode (kg/cm) — false = imperial (lbs/in), true = metric
    const [measurements,        setMeasurements]        = useState({}); // The real stored measurement values, always kept in imperial units internally even when metric is displayed
    const [displayMeasurements, setDisplayMeasurements] = useState({}); // Temporary converted values shown on screen when metric mode is on — kept separate from stored values to avoid losing precision when switching back
    const [daily,   setDaily]   = useState([]); // The list of daily goals — each item is { id, text, done }
    const [monthly, setMonthly] = useState([]); // The list of monthly goals — same shape as daily
    const [yearly,  setYearly]  = useState([]); // The list of yearly resolutions — same shape as daily
    const [pictures,      setPictures]      = useState([]); // The list of progress photos — each item holds { id, uri, date }
    const [defaultRest,   setDefaultRest]   = useState(90); // The currently selected rest timer duration in seconds — starts at 90s (1m 30s)
    const [customRest,    setCustomRest]    = useState(''); // What the user has typed in the "Custom (sec)" input — stored as a string until they tap "Set"
    const [importVisible, setImportVisible] = useState(false); // Controls whether the Import CSV screen is visible
    const [previewPic,    setPreviewPic]    = useState(null); // The photo currently open in the full-screen viewer — null means the viewer is closed
    const [previewIndex,  setPreviewIndex]  = useState(null); // The position of the viewed photo in the pictures array — needed to identify which one to delete

    const weightUnit    = useMetric ? 'kg' : 'lbs'; // The weight unit label for display, derived from the metric toggle
    const sizeUnit      = useMetric ? 'cm' : 'in'; // The length unit label for display, derived from the metric toggle
    const isAnyDirty    = dirty.personal || dirty.measurements || dirty.rest; // True if any saveable section has unsaved changes — drives the "Apply Changes" banner visibility
    const markDirty     = (s) => setDirty((p) => ({ ...p, [s]: true })); // Marks a specific section (e.g. 'personal') as having unsaved changes without resetting the others
    const toggleSection = (k) => setCollapsed((p) => ({ ...p, [k]: !p[k] })); // Flips a section open if closed, or closed if open
    const sectionProps  = { collapsed, toggleSection }; // Bundled so it can be spread onto every <Section> without repeating both props each time
    const authHeader    = { Authorization: `Bearer ${authToken}` }; // The auth header attached to API and image requests to prove the user is logged in

    const uploadPicture = async (launchFn, permFn, permMsg) => { // Generic photo upload handler used by both camera and library — requests permission, opens the picker, uploads to the server, and immediately adds the photo to the screen without waiting for the server to confirm
        const { status } = await permFn(); // Ask the OS for the required permission (camera or photo library)
        if (status !== 'granted') { Alert.alert('Permission needed', permMsg); return; } // Permission denied — tell the user and stop
        const result = await launchFn({ quality: 0.8 }); // Open the camera or library at 80% quality to balance file size and clarity
        if (result.canceled) return; // User closed the picker without selecting a photo — do nothing
        const { uri, fileName, fileSize } = result.assets[0]; // Get the selected photo's local file path, original filename, and file size
        const ext = fileName.split('.').pop(); // Extract the file extension (e.g. "jpg") to set the correct file type when uploading
        const formData = new FormData(); // Create a file upload package — required format for sending files to a server
        formData.append('progressPicture', { uri, name: `progress_${Date.now()}.${ext}`, size: fileSize, type: `image/${ext}` }); // Add the photo with a unique timestamped filename to avoid collisions on the server
        fetch(`${API}/api/profile/upload-progress-picture`, { method: 'POST', headers: { Authorization: `Bearer ${await user.getIdToken()}` }, body: formData }) // Send the photo to the server — fetches a fresh token in case the stored one expired
            .catch((err) => Alert.alert('Error', err.message)); // Show an error if the upload fails
        setPictures((prev) => [...prev, { uri, date: new Date().toLocaleDateString() }]); // Add the photo to the on-screen list immediately so the user sees it right away, before the server responds
    };

    const handlePickPicture = () => uploadPicture(ImagePicker.launchImageLibraryAsync, ImagePicker.requestMediaLibraryPermissionsAsync, 'Please allow photo library access in Settings.').catch((e) => Alert.alert('Error', e.message)); // Calls uploadPicture using the photo library launcher and its matching permission request
    const handleTakePicture = () => uploadPicture(ImagePicker.launchCameraAsync, ImagePicker.requestCameraPermissionsAsync, 'Please allow camera access in Settings.').catch((e) => Alert.alert('Error', e.message)); // Calls uploadPicture using the camera launcher and its matching permission request
    const openPreview = (pic, i) => { setPreviewPic({ ...pic, headers: authHeader }); setPreviewIndex(i); }; // Opens the full-screen photo viewer, attaches the auth headers so the image can load from the server, and remembers which position in the list this photo is at

    const removePicture = () => {
        const i = previewIndex, pic = pictures[i]; // Look up the currently viewed photo and its position in the list
        if (!pic?.uri) { Alert.alert('Error', 'Could not find the selected photo.'); return; } // Safety check — bail out if the photo reference is somehow missing
        Alert.alert('Remove Photo', 'Delete this progress photo?', [
            { text: 'Delete', style: 'destructive', onPress: () =>
                fetch(`${API}/api/profile/delete-progress-picture?pictureUrl=${encodeURIComponent(pic.uri)}&pictureId=${encodeURIComponent(pic.id)}`, // Ask the server to delete this photo, sending its URL and ID as query parameters
                    { method: 'delete', headers: authHeader }
                ).then(() => { setPictures((prev) => prev.filter((_, idx) => idx !== i)); setPreviewPic(null); setPreviewIndex(null); }) // On success: remove from the on-screen list and close the viewer
                 .catch((err) => Alert.alert('Error', err.message)), // Show an error if the server-side delete fails
            },
            { text: 'Cancel', style: 'cancel' }, // Closes the confirmation dialog without doing anything
        ]);
    };

    const makeGoalHandlers = (setter, addFn, toggleFn, deleteFn) => ({ // Factory that builds the add/toggle/delete logic for a goal list — updates the screen immediately and automatically reverts if the server call fails
        add: (text) => {
            const g = { id: null, text, done: false }; // Create the new goal — id is null until the server responds with the real one
            setter((prev) => [...prev, g]); // Add it to the list on screen right away so the user doesn't wait
            addFn(user, text, setter).catch(() => { setter((prev) => prev.filter((x) => x !== g)); Alert.alert('Error', 'Failed to save goal.'); }); // Save to server; if it fails, remove the goal from the list and show an error
        },
        toggle: (i) => setter((prev) => {
            const u = prev.map((g, idx) => idx === i ? { ...g, done: !g.done } : g); // Flip the done/not-done status of the goal at position i
            toggleFn(user, u[i]).catch(() => { setter((p) => p.map((g, idx) => idx === i ? { ...g, done: !g.done } : g)); Alert.alert('Error', 'Failed to update goal.'); }); // Save to server; if it fails, flip the status back
            return u; // Return the updated list so the screen refreshes immediately
        }),
        delete: (i) => setter((prev) => {
            const removed = prev[i], updated = prev.filter((_, idx) => idx !== i); // Keep a copy of the removed goal in case the server rejects the deletion
            deleteFn(user, removed.id, setter).catch(() => { setter((p) => [...p.slice(0, i), removed, ...p.slice(i)]); Alert.alert('Error', 'Failed to delete goal.'); }); // Delete from server; if it fails, put the goal back in its original position
            return updated; // Return the updated list so the goal disappears from the screen immediately
        }),
    });

    const dailyH   = makeGoalHandlers(setDaily,   addDailyGoal,   toggleDailyGoal,   deleteDailyGoal); // Add/toggle/delete handlers wired to the daily goals list and its server functions
    const monthlyH = makeGoalHandlers(setMonthly, addMonthlyGoal, toggleMonthlyGoal, deleteMonthlyGoal); // Same for monthly goals
    const yearlyH  = makeGoalHandlers(setYearly,  addYearlyGoal,  toggleYearlyGoal,  deleteYearlyGoal); // Same for yearly resolutions

    const handleExport = async () => {
        const rows = [
            ['Field', 'Value'], ['Name', name], ['Date of Birth', dob], ['Units', useMetric ? 'Metric' : 'Imperial'], // Header row followed by the basic personal info fields
            ...MEASUREMENT_FIELDS.map((f) => [f.label, measurements[f.key] ? `${measurements[f.key]} ${f.type === 'weight' ? weightUnit : sizeUnit}` : '']), // One row per measurement — value includes the unit so the exported file is human-readable
            ['Default Rest Timer', formatRest(defaultRest)], ['Rest Timer Seconds', String(defaultRest)], // Two rows: one human-readable (e.g. "1m 30s") and one raw seconds value used when re-importing
            ['Daily Goals', daily.map((g) => g.text).join(' | ')], // All daily goals joined into one cell separated by " | " so the whole list fits in a single CSV cell
            ['Monthly Goals', monthly.map((g) => g.text).join(' | ')], // Same for monthly goals
            ['Yearly Resolutions', yearly.map((g) => g.text).join(' | ')], // Same for yearly resolutions
        ];
        try {
            const csv = buildCSV(rows); // Convert the data table into a properly formatted CSV string
            const fileUri = `${FileSystem.cacheDirectory}fitness_profile.csv`; // Temporary file path on the phone where the CSV will be written before sharing
            await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 }); // Write the CSV string to the temp file
            await Share.share(Platform.OS === 'ios' ? { url: fileUri, title: 'Fitness Profile CSV' } : { message: csv, title: 'Fitness Profile CSV' }); // On iOS share the actual file; on Android share the raw text — both open the phone's share sheet
        } catch (e) { Alert.alert('Export Failed', e.message); } // Show the error if writing or sharing failed
    };

    const handleImport = (text) => { // Parses a CSV string and restores all profile fields from it — called by ImportModal after the user picks a file or pastes text
        try {
            const m = parseCSV(text); // Parse the CSV into a key→value lookup map
            if (!Object.keys(m).length) { Alert.alert('Invalid Data', 'Could not parse the CSV. Make sure you selected or pasted the correct file.'); return; } // If parsing produced nothing, the CSV was invalid — stop and tell the user
            if (m['Name']          != null) setName(m['Name']); // Restore name if it exists in the CSV
            if (m['Date of Birth'] != null) setDob(m['Date of Birth']); // Restore DOB if it exists
            if (m['Units']         != null) setUseMetric(m['Units'] === 'Metric'); // Restore the unit setting — "Metric" becomes true, anything else becomes false
            const mu = Object.fromEntries(MEASUREMENT_FIELDS.filter((f) => m[f.label] != null).map((f) => [f.key, m[f.label].replace(/\s*(kg|lbs|cm|in)$/, '').trim()])); // Build the measurements object: only include fields found in the CSV, strip the unit suffix off each value (e.g. "75 kg" → "75")
            if (Object.keys(mu).length) setMeasurements((prev) => ({ ...prev, ...mu })); // Merge the imported measurements, only overwriting fields that were actually in the CSV
            if (m['Rest Timer Seconds']) { const v = parseInt(m['Rest Timer Seconds'], 10); if (!isNaN(v) && v > 0) setDefaultRest(v); } // Restore the rest timer only if the value is a valid positive number
            if (m['Daily Goals']        != null) setDaily(goalsFromPipe(m['Daily Goals'])); // Split the pipe-separated string back into a list of goal objects
            if (m['Monthly Goals']      != null) setMonthly(goalsFromPipe(m['Monthly Goals'])); // Same for monthly
            if (m['Yearly Resolutions'] != null) setYearly(goalsFromPipe(m['Yearly Resolutions'])); // Same for yearly
            setCollapsed({ personal: false, measurements: false, goals: false, pictures: false, rest: false, data: false }); // Open all sections so the user can immediately review the imported data
            setDirty({ personal: true, measurements: true, rest: true }); // Mark everything as unsaved so the "Apply Changes" banner appears — the user still needs to tap it to send the data to the server
            setImportVisible(false); // Close the import screen
            Alert.alert('Import Successful', 'Review your data and tap "Apply Changes" to save.'); // Prompt the user to review and save
        } catch (e) { Alert.alert('Import Failed', e.message); } // Show the error if parsing or applying the data failed
    };

    const handleApplyChanges = async () => { // Saves all unsaved sections to the server at the same time — called when the user taps the green "Apply Changes" banner
        if (!isAnyDirty) return; // Nothing has changed — no need to save
        setIsSaving(true); // Disable the banner and show "Saving…"
        try {
            const saves = []; // Collect all the save tasks so they can run at the same time instead of one after another
            if (dirty.personal) { saves.push(saveFullName(user, name)); saves.push(saveDob(user, dob)); } // Queue name and DOB saves if the personal section was changed
            if (dirty.measurements) saves.push(saveMeasurements(user, Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, measurements[f.key] ?? ''])))); // Queue all measurements — empty string for any field that wasn't filled in
            if (dirty.rest) {
                const custom = parseInt(customRest, 10); // Try to parse what the user typed in the custom rest input as a whole number
                saves.push(saveDefaultRestTimer(user, !isNaN(custom) && custom > 0 ? (setDefaultRest(custom), setCustomRest(''), custom) : defaultRest)); // If the custom value is valid, apply it and clear the input; otherwise save the currently selected preset
            }
            await Promise.all(saves); // Run all save tasks simultaneously and wait until every one finishes
            setDirty({ personal: false, measurements: false, rest: false }); // Clear the unsaved flags — hides the banner
            Toast.show({ type: 'success', text1: 'Profile saved', text2: 'All changes have been applied.' }); // Brief success notification
        } catch (err) {
            console.error(err); // Log the full error for debugging
            Toast.show({ type: 'error', text1: 'Save failed', text2: 'Could not save some changes. Please try again.' }); // Brief error notification
        } finally { setIsSaving(false); } // Always re-enable the banner whether saving succeeded or failed
    };

    useEffect(() => { // Runs once when the screen first opens — fetches the user's complete saved profile from the server and populates all the fields
        async function loadFullProfile() {
            const token = await user.getIdToken(); // Get a fresh login token from Firebase (auto-refreshed if expired)
            setAuthToken(token); // Store the token so it can be reused for image requests throughout the session without fetching a new one each time
            fetch(`${API}/api/profile/full-profile`, { headers: { Authorization: `Bearer ${token}` } }) // Fetch the full profile from the server
                .then((res) => res.json()) // Parse the response as JSON
                .then((data) => {
                    setName(data.fullName); // Fill in the name field
                    setDob(data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : ''); // Convert the server's date format to a readable local date, or blank if none was saved
                    setMeasurements(Object.fromEntries(data.bodyMeasurements.map((m) => [m.bodyType, m.measurementValue !== null ? m.measurementValue.toString() : '']))); // Convert the measurements array into a key→value object; null values become empty strings
                    [[data.dailyGoals, setDaily], [data.monthlyGoals, setMonthly], [data.yearlyGoals, setYearly]]
                        .forEach(([goals, setter]) => setter(goals.map((g) => ({ id: g._id, text: g.title, done: g.achieved })))); // Populate all three goal lists in one loop — maps server goal objects to the simpler shape used by the app
                    setPictures(data.progressPictures.map((p) => ({ id: p._id, uri: `${API}/api/profile/download-progress-picture?pictureUrl=${p.url}`, date: p.date }))); // Build the photos list — constructs the full download URL for each photo from the server's stored path
                    setDefaultRest(data.defaultRestTimer); // Restore the saved rest timer duration
                })
                .catch((err) => console.error('Failed to load full profile:', err)); // Log any fetch or parsing errors for debugging
        }
        loadFullProfile(); // Kick off the profile load
    }, []); // Empty array means this only runs once on mount — not on every re-render

    return (
        <>
            <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"> {/* Main scrollable area — hides the scroll bar and ensures button taps still register when the keyboard is open */}
                {isAnyDirty && ( // Only show the save banner when at least one section has unsaved changes
                    <TouchableOpacity style={[styles.applyBanner, isSaving && { opacity: 0.65 }]} onPress={handleApplyChanges} activeOpacity={0.85} disabled={isSaving}> {/* Dims and disables itself while saving is in progress to prevent double-tapping */}
                        <Ionicons name={isSaving ? 'hourglass-outline' : 'checkmark-circle-outline'} size={20} color="#fff" /> {/* Hourglass while saving, checkmark when idle */}
                        <Text style={styles.applyBannerText}>{isSaving ? 'Saving…' : 'Apply Changes'}</Text> {/* Label updates based on whether saving is in progress */}
                    </TouchableOpacity>
                )}
                <Section id="personal" icon="person-circle-outline" title="Personal Info" {...sectionProps} isDirty={dirty.personal}> {/* Personal Info card — green dot appears when name or DOB has been edited but not saved */}
                    <LabeledInput label="Full Name"     value={name} onChangeText={(v) => { setName(v); markDirty('personal'); }} placeholder="Your name" /> {/* Updates name and marks the section unsaved on every keystroke */}
                    <LabeledInput label="Date of Birth" value={dob}  onChangeText={(v) => { setDob(v);  markDirty('personal'); }} placeholder="MM/DD/YYYY" keyboardType="numbers-and-punctuation" /> {/* Uses numbers-and-punctuation keyboard for easier date entry */}
                </Section>
                <Section id="measurements" icon="body-outline" title="Body Measurements" {...sectionProps} isDirty={dirty.measurements}> {/* Body Measurements card — green dot when any measurement has been edited but not saved */}
                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.switchLabel}>{useMetric ? 'Metric (kg, cm, km)' : 'Imperial (lbs, in, mi)'}</Text> {/* Shows whichever unit system is currently active */}
                            <Text style={styles.switchSub}>Affects all measurements & distances</Text>
                        </View>
                        <Switch value={useMetric} onValueChange={(v) => { setUseMetric(v); setDisplayMeasurements({}); }} trackColor={{ false: BORDER, true: BLUE }} thumbColor="#fff" /> {/* Toggling units also clears displayMeasurements so all fields recalculate in the new unit */}
                    </View>
                    <View style={styles.unitBadgeRow}>
                        {[['Weight', weightUnit], ['Size', sizeUnit], ['Distance', useMetric ? 'km' : 'mi']].map(([l, v]) => (
                            <View key={l} style={styles.unitBadge}>
                                <Text style={styles.unitBadgeLabel}>{l}</Text> {/* Category name, e.g. "Weight" */}
                                <Text style={styles.unitBadgeValue}>{v}</Text> {/* Active unit, e.g. "kg" */}
                            </View>
                        ))}
                    </View>
                    <View style={[styles.divider, { marginTop: 16 }]} /> {/* Separator between the unit controls and the measurement input fields */}
                    {MEASUREMENT_FIELDS.map((f) => ( // Render one input row for every body measurement field
                        <LabeledInput key={f.key} label={f.label}
                            value={!useMetric ? (measurements[f.key] ?? '') : (displayMeasurements[f.key] ?? convertMeasurement(measurements[f.key], f.type, true) ?? '')} // Imperial: show stored value directly. Metric: show what the user is typing, falling back to the auto-converted stored value
                            onChangeText={(v) => {
                                if (useMetric) {
                                    setDisplayMeasurements((prev) => ({ ...prev, [f.key]: v })); // Show what the user typed immediately in metric
                                    const imp = convertMeasurement(v, f.type, false);
                                    if (imp) setMeasurements((prev) => ({ ...prev, [f.key]: imp })); // Convert the typed metric value to imperial and store it as the real saved value
                                } else { setMeasurements((prev) => ({ ...prev, [f.key]: v })); } // Imperial: store directly without conversion
                                markDirty('measurements'); // Flag this section as having unsaved changes
                            }}
                            onEndEditing={(e) => {
                                if (!useMetric) return; // Nothing extra to do in imperial mode
                                const imp = convertMeasurement(e.nativeEvent.text, f.type, false); // When the keyboard closes in metric mode: convert the final typed value to imperial for storage
                                setMeasurements((prev) => ({ ...prev, [f.key]: imp })); // Store the imperial value
                                setDisplayMeasurements((prev) => ({ ...prev, [f.key]: convertMeasurement(imp, f.type, true) })); // Recalculate and display the clean rounded metric value
                            }}
                            keyboardType="decimal-pad" suffix={f.type === 'weight' ? weightUnit : sizeUnit} // Decimal number keyboard; shows the relevant unit next to the field
                        />
                    ))}
                </Section>
                <Section id="goals" icon="flag-outline" title="Goals & Resolutions" {...sectionProps} isDirty={false}> {/* Goals card — no dirty dot because goals are saved to the server immediately when added, toggled, or deleted */}
                    <GoalGroup label="Daily Goals"        goals={daily}   onAdd={dailyH.add}   onToggle={dailyH.toggle}   onDelete={dailyH.delete} /> {/* Daily goals list wired to its server handlers */}
                    <View style={styles.divider} />
                    <GoalGroup label="Monthly Goals"      goals={monthly} onAdd={monthlyH.add} onToggle={monthlyH.toggle} onDelete={monthlyH.delete} /> {/* Monthly goals list */}
                    <View style={styles.divider} />
                    <GoalGroup label="Yearly Resolutions" goals={yearly}  onAdd={yearlyH.add}  onToggle={yearlyH.toggle}  onDelete={yearlyH.delete} /> {/* Yearly resolutions list */}
                </Section>
                <Section id="pictures" icon="camera-outline" title="Progress Pictures" {...sectionProps} isDirty={false}> {/* Progress Pictures card — no dirty dot because photos upload immediately */}
                    <Text style={styles.hintText}>Document your transformation over time. Photos are stored locally.</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}> {/* Horizontally scrollable photo strip */}
                        <TouchableOpacity style={styles.addPictureBox} onPress={() => Alert.alert('Add Progress Photo', 'Choose a source', [{ text: 'Take Photo', onPress: handleTakePicture }, { text: 'Choose from Library', onPress: handlePickPicture }, { text: 'Cancel', style: 'cancel' }])} activeOpacity={0.8}> {/* Shows a pop-up asking whether to use the camera or photo library */}
                            <Ionicons name="add-circle-outline" size={32} color={BLUE} />
                            <Text style={styles.addPictureLabel}>Add Photo</Text>
                        </TouchableOpacity>
                        {pictures.map((pic, i) => ( // Render a thumbnail for each saved progress photo
                            <TouchableOpacity key={i} onPress={() => openPreview(pic, i)} activeOpacity={0.85} style={{ marginRight: 10 }}> {/* Tapping opens the full-screen photo viewer */}
                                <Image source={{ uri: pic.uri, headers: authHeader }} style={styles.pictureThumbnail} resizeMode="cover" /> {/* Auth header included so the server allows the image download */}
                                <View style={styles.picDateBadge}><Text style={styles.picDateText}>{pic.date}</Text></View> {/* Date badge overlaid at the bottom of the thumbnail */}
                                <View style={styles.picRemoveBadge}><Ionicons name="expand-outline" size={20} color="#fff" /></View> {/* Expand icon hinting the photo can be tapped */}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {pictures.length > 0 && <Text style={styles.hintTextSm}>{pictures.length} photo{pictures.length !== 1 ? 's' : ''} — tap to view</Text>} {/* Photo count shown only when at least one photo exists; pluralises correctly */}
                </Section>
                <Section id="rest" icon="timer-outline" title="Default Rest Timer" {...sectionProps} isDirty={dirty.rest}> {/* Rest Timer card — green dot when the rest duration has been changed but not saved */}
                    <Text style={styles.hintText}>Select a preset or enter a custom duration applied between sets.</Text>
                    <View style={styles.presetRow}>
                        {REST_PRESETS.map((s) => (
                            <TouchableOpacity key={s} style={[styles.chip, defaultRest === s && styles.chipActive]} onPress={() => { setDefaultRest(s); markDirty('rest'); }} activeOpacity={0.8}> {/* Highlighted in blue when this preset matches the currently selected duration */}
                                <Text style={[styles.chipText, defaultRest === s && styles.chipTextActive]}>{formatRest(s)}</Text> {/* Text turns white when the chip is selected */}
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.customRestRow}>
                        <TextInput style={styles.customRestInput} value={customRest} onChangeText={(v) => { setCustomRest(v); markDirty('rest'); }} placeholder="Custom (sec)" placeholderTextColor={GRAY} keyboardType="number-pad" /> {/* Number-only keyboard for entering a custom duration in seconds */}
                        <TouchableOpacity style={styles.customRestBtn} onPress={() => { const val = parseInt(customRest, 10); if (!isNaN(val) && val > 0) { setDefaultRest(val); setCustomRest(''); markDirty('rest'); } }} activeOpacity={0.85}> {/* Applies the typed value only if it's a valid positive whole number; clears the input after */}
                            <Text style={styles.customRestBtnText}>Set</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.currentRestBadge}>
                        <Ionicons name="time-outline" size={18} color={BLUE} />
                        <Text style={styles.currentRestText}>Current default: <Text style={{ fontWeight: '700', color: BLUE }}>{formatRest(defaultRest)}</Text></Text> {/* Shows the active rest duration — the value itself is bolded and blue for emphasis */}
                    </View>
                </Section>
                <Section id="data" icon="swap-vertical-outline" title="Export & Import Data" {...sectionProps} isDirty={false}> {/* Export & Import card — no dirty dot because these actions don't create local unsaved changes */}
                    <Text style={styles.hintText}>Export your profile data as CSV to back it up, or import a previously exported file to restore everything.</Text>
                    <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.85}> {/* Builds the CSV and opens the phone's share sheet */}
                        <Ionicons name="document-text-outline" size={22} color="#fff" />
                        <Text style={styles.exportBtnText}>Export as CSV</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintTextSm}>Opens your device share sheet — copy, email, or save the CSV text.</Text>
                    <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OR</Text><View style={styles.orLine} /></View>
                    <TouchableOpacity style={styles.importBtn} onPress={() => setImportVisible(true)} activeOpacity={0.85}> {/* Opens the ImportModal screen */}
                        <Ionicons name="cloud-upload-outline" size={22} color={BLUE} />
                        <Text style={styles.importBtnText}>Import from CSV</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintTextSm}>Pick a CSV file or paste exported text to restore your full profile.</Text>
                </Section>
            </ScrollView>
            <ImportModal visible={importVisible} onClose={() => setImportVisible(false)} onImport={handleImport} /> {/* The import screen — shown/hidden via importVisible */}
            <PhotoPreviewModal visible={previewPic !== null} pic={previewPic} onClose={() => { setPreviewPic(null); setPreviewIndex(null); }} onDelete={removePicture} /> {/* Full-screen photo viewer — visible when a photo is tapped; clears both the photo and its list position on close */}
        </>
    );
}

const styles = StyleSheet.create({
    root:          { flex: 1, backgroundColor: '#f9fafb' }, // Fills the whole screen with an off-white background
    scrollContent: { padding: 16, paddingBottom: 40 }, // 16px breathing room around all content; extra bottom space so the last card isn't flush with the screen edge
    applyBanner:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: GREEN, paddingVertical: 14, borderRadius: 14, marginBottom: 14, shadowColor: GREEN, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 }, // Green save banner — centred row, rounded corners, green shadow to make it feel raised off the page
    applyBannerText: { color: '#fff', fontWeight: '700', fontSize: 16 }, // White bold text inside the save banner
    dirtyDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, marginLeft: 6 }, // Tiny green circle shown next to a section title when it has unsaved changes
    card:            { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }, // White card with rounded corners, faint border, and a subtle shadow
    sectionToggle:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }, // Card header row — icon+title on the left, arrow on the right, 16px padding
    sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10 }, // Left side of the header — icon, title, and optional dirty dot in a row with 10px gaps
    sectionTitle:    { fontSize: 16, fontWeight: '700', color: '#111827' }, // Section title — dark, bold, 16px
    sectionBody:     { paddingHorizontal: 16, paddingBottom: 16 }, // Padding inside the card's content area
    labeledInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }, // One input row — label left, input right, with a faint bottom border separating it from the next row
    inputLabel:      { fontSize: 15, color: '#374151', fontWeight: '500', flex: 1 }, // Field name — takes up all available space on the left, medium weight
    inputWithSuffix: { flexDirection: 'row', alignItems: 'center', gap: 4 }, // Keeps the text box and unit label (e.g. "kg") side by side
    inlineInput:     { fontSize: 15, color: '#111', textAlign: 'right', minWidth: 80, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: LIGHT_GRAY, borderRadius: 8 }, // Right-aligned text box — light gray background, rounded, minimum 80px wide so short values don't collapse it
    inputSuffix:     { fontSize: 13, color: GRAY, minWidth: 24 }, // Unit label (e.g. "kg") — muted gray, minimum width so the layout doesn't shift when switching between unit names of different lengths
    switchRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }, // Metric/imperial toggle row — label on the left, switch on the right
    switchLabel:     { fontSize: 15, fontWeight: '600', color: '#111827' }, // Main toggle label — semi-bold, dark
    switchSub:       { fontSize: 12, color: GRAY, marginTop: 2 }, // Sub-label below the main toggle label — smaller, muted
    unitBadgeRow:    { flexDirection: 'row', gap: 10, marginTop: 14 }, // Row of three unit tiles (Weight / Size / Distance) — 10px gaps, sits below the toggle
    unitBadge:       { flex: 1, backgroundColor: LIGHT_BLUE, borderRadius: 10, alignItems: 'center', paddingVertical: 10 }, // One unit tile — equal share of the row width, pale blue, rounded, centred content
    unitBadgeLabel:  { fontSize: 11, color: GRAY, marginBottom: 2 }, // Category label above the unit (e.g. "Weight") — tiny, gray
    unitBadgeValue:  { fontSize: 16, fontWeight: '700', color: BLUE }, // Unit abbreviation (e.g. "kg") — large, bold, brand blue
    divider:         { borderTopWidth: 1, borderTopColor: BORDER, marginVertical: 12 }, // Thin horizontal separator line with 12px space above and below
    goalGroup:       { marginBottom: 4 }, // Small gap below each goal category so they don't run into each other
    goalGroupTitle:  { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 6 }, // Goal group heading (e.g. "Daily Goals") — bold, dark gray
    goalRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }, // One goal row — checkbox, text, delete icon in a row with a faint bottom border
    goalText:        { flex: 1, fontSize: 14, color: '#111827' }, // Goal description text — fills available space between the checkbox and trash icon
    goalDone:        { textDecorationLine: 'line-through', color: '#9ca3af' }, // Applied when a goal is done — draws a strikethrough and fades the text to gray
    goalInputRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, // Row that appears when adding a new goal — text box + Save + Cancel
    goalInput:       { flex: 1, backgroundColor: LIGHT_GRAY, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111', borderWidth: 1, borderColor: BORDER }, // New goal text box — takes all available width, light gray background, rounded, thin border
    goalSaveBtn:     { backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }, // Blue Save button — rounded corners
    goalSaveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 }, // Save button text — white, bold
    goalCancelBtn:   { padding: 10, backgroundColor: LIGHT_GRAY, borderRadius: 10 }, // X Cancel button — light gray, rounded, padded for easy tapping
    addGoalBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 }, // "+ Add goal" row — icon and text side by side
    addGoalText:     { fontSize: 14, color: BLUE, fontWeight: '600' }, // "Add goal" label — blue, semi-bold
    emptyText:       { fontSize: 13, color: '#9ca3af', fontStyle: 'italic', paddingVertical: 6 }, // "No goals yet." placeholder — small, gray, italic
    addPictureBox:   { width: 90, height: 90, borderRadius: 12, borderWidth: 2, borderColor: BLUE, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginRight: 10 }, // Dashed "Add Photo" square — 90×90, blue dashed border, centred content
    addPictureLabel: { fontSize: 11, color: BLUE, marginTop: 4, fontWeight: '600' }, // "Add Photo" label below the plus icon — tiny, blue, semi-bold
    pictureThumbnail: { width: 90, height: 90, borderRadius: 12, backgroundColor: LIGHT_GRAY, marginRight: 10 }, // Photo thumbnail — 90×90, rounded corners, gray placeholder while loading
    picDateBadge:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, paddingVertical: 3, alignItems: 'center' }, // Semi-transparent date strip layered at the bottom of the thumbnail, following its rounded corners
    picDateText:     { fontSize: 9, color: '#fff', fontWeight: '600' }, // Date text inside the badge — tiny, white, bold
    picRemoveBadge:  { position: 'absolute', top: 4, right: 4 }, // Expand icon positioned over the top-right corner of the thumbnail
    previewOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' }, // Near-black background covering the whole screen behind the photo
    previewContainer:  { flex: 1, paddingTop: 50 }, // Inner area — top padding keeps content below the phone's status bar
    previewHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }, // Top bar of the photo viewer — date on left, X button on right
    previewDate:       { fontSize: 14, color: '#fff', fontWeight: '600' }, // Date text in the photo viewer — white, semi-bold
    previewCloseBtn:   { padding: 8 }, // X close button — padded for easy tapping
    previewImage:      { flex: 1, width: '100%' }, // Full-size photo — fills all space between the header and the delete button
    previewDeleteBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ef4444', marginHorizontal: 20, marginVertical: 20, paddingVertical: 14, borderRadius: 14 }, // Red Delete button at the bottom — full width with side margins, rounded corners
    previewDeleteText: { color: '#fff', fontWeight: '700', fontSize: 16 }, // Delete button text — white, bold
    presetRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, // Rest timer preset buttons — wraps to a new line if there are too many to fit in one row
    chip:              { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: LIGHT_GRAY, borderWidth: 1, borderColor: BORDER }, // One preset chip — pill-shaped, light gray with a faint border when not selected
    chipActive:        { backgroundColor: BLUE, borderColor: BLUE }, // Override applied to the selected chip — fills it with brand blue
    chipText:          { fontSize: 13, fontWeight: '600', color: '#374151' }, // Chip label text — semi-bold, dark gray when not selected
    chipTextActive:    { color: '#fff' }, // Override for the selected chip's text — turns white so it's readable on the blue background
    customRestRow:     { flexDirection: 'row', gap: 10, marginTop: 14 }, // Custom rest timer row — text input and "Set" button side by side
    customRestInput:   { flex: 1, backgroundColor: LIGHT_GRAY, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#111', borderWidth: 1, borderColor: BORDER }, // Custom seconds input — takes most of the row width, light gray, rounded, thin border
    customRestBtn:     { backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 22, justifyContent: 'center' }, // "Set" button — blue, rounded, wider side padding
    customRestBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 }, // "Set" button text — white, bold
    currentRestBadge:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, backgroundColor: LIGHT_BLUE, borderRadius: 10, padding: 12 }, // Light blue info box showing the active rest duration — icon and text side by side, rounded, comfortable padding
    currentRestText:   { fontSize: 14, color: '#374151' }, // Description text in the rest badge (e.g. "Current default:") — neutral gray
    exportBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, marginTop: 12 }, // Export button — full width, blue, icon and text centred, rounded corners
    exportBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff' }, // Export button text — white, bold
    orRow:             { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 }, // "OR" divider — a line on each side with "OR" in the middle, 14px space above and below
    orLine:            { flex: 1, height: 1, backgroundColor: BORDER }, // One of the horizontal lines flanking "OR" — 1px tall, stretches to fill available space
    orText:            { fontSize: 12, color: GRAY, fontWeight: '600' }, // "OR" label — small, muted gray, semi-bold
    importBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14, borderWidth: 2, borderColor: BLUE }, // Import button — outlined style: white background with a 2px blue border instead of a filled background
    importBtnText:     { fontSize: 16, fontWeight: '700', color: BLUE }, // Import button text — blue, bold
    hintText:          { fontSize: 13, color: GRAY, lineHeight: 18 }, // Small descriptive text above controls — gray, readable line spacing
    hintTextSm:        { marginTop: 8, fontSize: 12, color: '#9ca3af' }, // Even smaller helper text below buttons — slightly lighter gray, 8px above
    modalRoot:            { flex: 1, backgroundColor: '#f9fafb', padding: 20, paddingTop: 40 }, // Modal screen background — fills the whole view, off-white, generous padding with extra at the top to clear the status bar
    modalHeader:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, // Modal header — title left, X button right, 16px gap below before the content starts
    modalTitle:           { fontSize: 18, fontWeight: '700', color: '#111827' }, // Modal screen title — dark, bold, 18px
    modalInstructions:    { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: LIGHT_BLUE, borderRadius: 12, padding: 12, marginBottom: 16 }, // Light blue info box — icon and text aligned to the top, rounded corners
    modalInstructionText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 }, // Text inside the info box — fills remaining width, small font, comfortable line spacing
    csvTextArea:          { flex: 1, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 14, fontSize: 13, color: '#111', fontFamily: 'monospace', marginBottom: 14, minHeight: 150 }, // CSV paste area — monospace font so data columns line up neatly, white background, bordered, at least 150px tall
    actionBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, marginBottom: 10 }, // Primary action button inside a modal — full width, blue, icon and text centred, rounded
    actionBtnText:        { fontSize: 16, fontWeight: '700', color: '#fff' }, // Action button text — white, bold
    modalCancelBtn:       { alignItems: 'center', paddingVertical: 14 }, // Cancel button at the bottom of a modal — centred, generous vertical padding for easy tapping
    modalCancelBtnText:   { fontSize: 15, color: GRAY, fontWeight: '600' }, // Cancel button text — muted gray, semi-bold
});