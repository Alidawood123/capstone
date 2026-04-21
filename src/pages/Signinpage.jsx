import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ActivityIndicator,
    Image,
    Animated,
    Dimensions,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import {
    getAuth,
    signInWithEmailAndPassword,
    signInWithCredential,
    GoogleAuthProvider,
    FacebookAuthProvider,
    AppleAuthProvider,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { appleAuth } from '@invertase/react-native-apple-authentication';

import Toast from 'react-native-toast-message';

const { width: SCREEN_W } = Dimensions.get('window');

const BLUE      = '#00b4d8';
const BLUE_MID  = '#0099bb';
const BLUE_DEEP = '#007a99';
const TEAL_SOFT = '#e0f7fc';

export default function SigninPage({ onNavigateToSignUp, onNavigateToFitness, onNavigateToForgotPassword }) {
    const auth = getAuth();

    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading]       = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [pwFocused, setPwFocused]       = useState(false);

    // Entrance animations — staggered reveal
    const bgAnim     = useRef(new Animated.Value(0)).current;
    const logoAnim   = useRef(new Animated.Value(0)).current;
    const cardAnim   = useRef(new Animated.Value(0)).current;
    const footerAnim = useRef(new Animated.Value(0)).current;

    // Input glow
    const emailGlow = useRef(new Animated.Value(0)).current;
    const pwGlow    = useRef(new Animated.Value(0)).current;

    // Subtle logo pulse
    const logoPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(bgAnim,     { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.spring(logoAnim,   { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
            Animated.spring(cardAnim,   { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
            Animated.timing(footerAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(logoPulse, { toValue: 1.06, duration: 1800, useNativeDriver: true }),
                Animated.timing(logoPulse, { toValue: 1.00, duration: 1800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const focusGlow = (anim, on) =>
        Animated.timing(anim, { toValue: on ? 1 : 0, duration: 200, useNativeDriver: false }).start();

    // ─── Auth handlers ────────────────────────────────────────────────────────

    const handleSignIn = () => {
        if (!email.trim() || !password.trim()) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter both email and password.' });
            return;
        }
        if (!isValidEmail) {
            Toast.show({ type: 'error', text1: 'Invalid Email', text2: 'Please enter a valid email address.' });
            return;
        }
        signInWithEmailAndPassword(auth, email, password)
            .then(({ user }) => {
                Toast.show({ type: 'success', text1: 'Welcome back 👋', text2: user.email });
                if (onNavigateToFitness) onNavigateToFitness();
            })
            .catch(error => Toast.show({ type: 'error', text1: 'Sign-in Failed', text2: error.message }));
    };

    const handleGoogleSignIn = async () => {
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const res = await GoogleSignin.signIn();
            const idToken = res.data?.idToken || res.idToken;
            if (!idToken) throw new Error('No ID token returned');
            await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
            await _ensureProfile();
            if (onNavigateToFitness) onNavigateToFitness();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Google sign-in failed', text2: e.message });
        }
    };

    const handleFacebookSignIn = async () => {
        try {
            const r = await LoginManager.logInWithPermissions(['public_profile', 'email']);
            if (r.isCancelled) throw new Error('Cancelled');
            const data = await AccessToken.getCurrentAccessToken();
            if (!data) throw new Error('No access token');
            await signInWithCredential(auth, FacebookAuthProvider.credential(data.accessToken));
            await _ensureProfile();
            if (onNavigateToFitness) onNavigateToFitness();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Facebook sign-in failed', text2: e.message });
        }
    };

    const handleAppleSignIn = async () => {
        try {
            if (!appleAuth.isSupported) throw new Error('Not supported on this device');
            const { identityToken, nonce } = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
            });
            if (!identityToken) throw new Error('No identity token');
            await signInWithCredential(auth, AppleAuthProvider.credential(identityToken, nonce));
            await _ensureProfile();
            if (onNavigateToFitness) onNavigateToFitness();
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Apple sign-in failed', text2: e.message });
        }
    };

    const _ensureProfile = async () => {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const base = process.env.EXPO_PUBLIC_BACKEND_SERVER_URL;
        const res = await fetch(`${base}/api/profile/basic-profile`, {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
            await fetch(`${base}/api/profile/create-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ fullName: user.displayName || '', email: user.email }),
            });
        }
    };

    // ─── Derived values ───────────────────────────────────────────────────────

    const isValidEmail = email.includes('@') && email.includes('.');

    const emailBorderColor = emailGlow.interpolate({ inputRange: [0, 1], outputRange: ['#dde1e7', BLUE] });
    const emailBgColor     = emailGlow.interpolate({ inputRange: [0, 1], outputRange: ['#f4f6f8', TEAL_SOFT] });
    const pwBorderColor    = pwGlow.interpolate({ inputRange: [0, 1], outputRange: ['#dde1e7', BLUE] });
    const pwBgColor        = pwGlow.interpolate({ inputRange: [0, 1], outputRange: ['#f4f6f8', TEAL_SOFT] });

    const logoEntrance = {
        opacity:   logoAnim,
        transform: [
            { scale:      logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
            { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
        ],
    };
    const cardEntrance = {
        opacity:   cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <View style={styles.root}>
            <LinearGradient
                colors={[BLUE, BLUE_MID, BLUE_DEEP]}
                locations={[0, 0.55, 1]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
            />

            {/* Decorative bubbles */}
            <View style={[styles.bubble, styles.bubbleLg]} />
            <View style={[styles.bubble, styles.bubbleMd]} />
            <View style={[styles.bubble, styles.bubbleSm]} />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Logo block ── */}
                    <Animated.View style={[styles.logoBlock, logoEntrance]}>
                        <Animated.View style={[styles.logoRingOuter, { transform: [{ scale: logoPulse }] }]}>
                            <View style={styles.logoRingInner}>
                                <Image
                                    source={require('../../assets/logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                        </Animated.View>
                        <Text style={styles.appName}>Welcome Back</Text>
                        <Text style={styles.appSub}>Sign in to pick up where you left off</Text>
                    </Animated.View>

                    {/* ── Card ── */}
                    <Animated.View style={[styles.card, cardEntrance]}>
                        <LinearGradient
                            colors={[BLUE, BLUE_MID]}
                            style={styles.cardAccentBar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        />

                        <View style={styles.cardBody}>
                            {/* Email */}
                            <Text style={styles.fieldLabel}>Email</Text>
                            <Animated.View style={[styles.inputWrapper, { borderColor: emailBorderColor, backgroundColor: emailBgColor }]}>
                                <Ionicons
                                    name="mail-outline"
                                    size={19}
                                    color={emailFocused ? BLUE : '#a0aab4'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor="#b0bac4"
                                    value={email}
                                    onChangeText={setEmail}
                                    maxLength={50}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onFocus={() => { setEmailFocused(true);  focusGlow(emailGlow, true); }}
                                    onBlur={()  => { setEmailFocused(false); focusGlow(emailGlow, false); }}
                                />
                                {email.length > 0 && (
                                    <Ionicons
                                        name={isValidEmail ? 'checkmark-circle' : 'close-circle'}
                                        size={19}
                                        color={isValidEmail ? '#22c55e' : '#ef4444'}
                                    />
                                )}
                            </Animated.View>

                            {/* Password */}
                            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Password</Text>
                            <Animated.View style={[styles.inputWrapper, { borderColor: pwBorderColor, backgroundColor: pwBgColor }]}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={19}
                                    color={pwFocused ? BLUE : '#a0aab4'}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#b0bac4"
                                    value={password}
                                    onChangeText={setPassword}
                                    maxLength={128}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => { setPwFocused(true);  focusGlow(pwGlow, true); }}
                                    onBlur={()  => { setPwFocused(false); focusGlow(pwGlow, false); }}
                                />
                                <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={10}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={19}
                                        color="#a0aab4"
                                    />
                                </Pressable>
                            </Animated.View>

                            {/* Forgot password */}
                            <TouchableOpacity onPress={onNavigateToForgotPassword} style={styles.forgotRow}>
                                <Text style={styles.forgotText}>Forgot password?</Text>
                            </TouchableOpacity>

                            {/* Sign In CTA */}
                            <TouchableOpacity
                                onPress={handleSignIn}
                                disabled={isLoading}
                                activeOpacity={0.88}
                                style={styles.ctaOuter}
                            >
                                <LinearGradient
                                    colors={[BLUE, BLUE_DEEP]}
                                    style={styles.ctaGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isLoading ? (
                                        <View style={styles.ctaRow}>
                                            <ActivityIndicator color="#fff" size="small" />
                                            <Text style={styles.ctaText}>Signing in…</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.ctaRow}>
                                            <Text style={styles.ctaText}>Sign In</Text>
                                            <View style={styles.ctaArrow}>
                                                <Ionicons name="arrow-forward" size={17} color="#fff" />
                                            </View>
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.divRow}>
                                <View style={styles.divLine} />
                                <Text style={styles.divText}>or sign in with</Text>
                                <View style={styles.divLine} />
                            </View>

                            {/* Social buttons */}
                            <View style={styles.socialRow}>
                                <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleSignIn} activeOpacity={0.78}>
                                    <Ionicons name="logo-google" size={21} color="#DB4437" />
                                    <Text style={styles.socialLabel}>Google</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialBtn} onPress={handleAppleSignIn} activeOpacity={0.78}>
                                    <Ionicons name="logo-apple" size={21} color="#111" />
                                    <Text style={styles.socialLabel}>Apple</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialBtn} onPress={handleFacebookSignIn} activeOpacity={0.78}>
                                    <Ionicons name="logo-facebook" size={21} color="#4267B2" />
                                    <Text style={styles.socialLabel}>Facebook</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>

                    {/* ── Footer ── */}
                    <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={onNavigateToSignUp} activeOpacity={0.75}>
                            <Text style={styles.footerLink}>Create one</Text>
                        </TouchableOpacity>
                    </Animated.View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root:   { flex: 1 },
    flex:   { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },

    // Decorative background bubbles
    bubble:   { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)' },
    bubbleLg: { width: 320, height: 320, top: -80,    right: -100 },
    bubbleMd: { width: 180, height: 180, top: 160,    left: -60   },
    bubbleSm: { width: 110, height: 110, bottom: 180, right: -20  },

    // Logo
    logoBlock:     { alignItems: 'center', marginBottom: 28 },
    logoRingOuter: {
        width: 96,
        height: 96,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 2.5,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 10,
    },
    logoRingInner: {
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.28)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo:    { width: 48, height: 48 },
    appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
    appSub:  { fontSize: 14, color: 'rgba(255,255,255,0.72)', letterSpacing: 0.1 },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: '#006080',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.18,
        shadowRadius: 28,
        elevation: 14,
        marginBottom: 22,
    },
    cardAccentBar: { height: 5, width: '100%' },
    cardBody:      { padding: 24 },

    // Field label
    fieldLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
    },

    // Inputs
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        paddingHorizontal: 14,
        borderWidth: 1.5,
        height: 54,
    },
    inputIcon: { marginRight: 10 },
    input:     { flex: 1, fontSize: 15, color: '#111827' },

    // Forgot password
    forgotRow:  { alignSelf: 'flex-end', marginTop: 10, marginBottom: 22 },
    forgotText: { color: BLUE, fontSize: 13, fontWeight: '600' },

    // CTA button
    ctaOuter: {
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: BLUE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.38,
        shadowRadius: 14,
        elevation: 8,
        marginBottom: 24,
    },
    ctaGradient: { paddingVertical: 17, alignItems: 'center' },
    ctaRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
    ctaText:     { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
    ctaArrow:    { backgroundColor: 'rgba(255,255,255,0.24)', borderRadius: 20, padding: 5 },

    // Divider
    divRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    divLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
    divText: { color: '#9ca3af', paddingHorizontal: 12, fontSize: 12, fontWeight: '600' },

    // Social
    socialRow: { flexDirection: 'row', gap: 10 },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 48,
        borderRadius: 13,
        backgroundColor: '#f4f6f8',
        borderWidth: 1.5,
        borderColor: '#e5e7eb',
    },
    socialLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

    // Footer
    footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { color: 'rgba(255,255,255,0.72)', fontSize: 14 },
    footerLink: { color: '#fff', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline' },
});