import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#00b4d8';

export default function Settings({ visible, onClose, onSignOut }) {
    const handleSignOut = () => {
        onClose();
        if (onSignOut) onSignOut();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Settings</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="close" size={22} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <TouchableOpacity
                            style={styles.signOutButton}
                            onPress={handleSignOut}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="log-out-outline" size={22} color="#fff" />
                            <Text style={styles.signOutText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '85%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        gap: 12,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#dc2626',
        paddingVertical: 16,
        borderRadius: 14,
    },
    signOutText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#fff',
    },
});
