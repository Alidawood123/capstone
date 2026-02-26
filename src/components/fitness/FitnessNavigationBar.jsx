import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#00b4d8';
const GRAY = '#9ca3af';

const TABS = [
    { key: 'home', label: 'Home', icon: 'home' },
    { key: 'templates', label: 'Templates', icon: 'barbell-outline' },
    { key: 'history', label: 'History', icon: 'trending-up-outline' },
    { key: 'analytics', label: 'Analytics', icon: 'bar-chart-outline' },
    { key: 'profile', label: 'profile', icon: 'person-outline' },
];

export default function FitnessNavigationBar({ activeTab, onTabChange, insets }) {
    const paddingBottom = 12 + Math.max(insets?.bottom ?? 0, 12);
    return (
        <View style={[styles.bottomNav, { paddingBottom }]}>
            {TABS.map(({ key, label, icon }) => (
                <TouchableOpacity
                    key={key}
                    style={styles.navItem}
                    onPress={() => onTabChange(key)}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={icon}
                        size={24}
                        color={activeTab === key ? BLUE : GRAY}
                    />
                    <Text
                        style={[
                            styles.navLabel,
                            activeTab === key && styles.navLabelActive,
                        ]}
                    >
                        {label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingTop: 12,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    navLabel: {
        fontSize: 11,
        color: GRAY,
        marginTop: 6,
    },
    navLabelActive: {
        color: BLUE,
        fontWeight: '600',
    },
});
