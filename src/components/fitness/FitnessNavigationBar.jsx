import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BLUE = '#00b4d8';
const GRAY = '#9ca3af';

export default function FitnessNavBar({ activeTab, setActiveTab }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: 12 + Math.max(insets.bottom, 12) }]}>
      <Pressable style={styles.navItem} onPress={() => setActiveTab('home')}>
        <Ionicons name="home" size={24} color={activeTab === 'home' ? BLUE : GRAY} />
        <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>Home</Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => setActiveTab('templates')}>
        <Ionicons name="barbell-outline" size={24} color={activeTab === 'templates' ? BLUE : GRAY} />
        <Text style={[styles.navLabel, activeTab === 'templates' && styles.navLabelActive]}>Templates</Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => setActiveTab('history')}>
        <Ionicons name="trending-up-outline" size={24} color={activeTab === 'history' ? BLUE : GRAY} />
        <Text style={[styles.navLabel, activeTab === 'history' && styles.navLabelActive]}>History</Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => setActiveTab('analytics')}>
        <Ionicons name="bar-chart-outline" size={24} color={activeTab === 'analytics' ? BLUE : GRAY} />
        <Text style={[styles.navLabel, activeTab === 'analytics' && styles.navLabelActive]}>Analytics</Text>
      </Pressable>

      <Pressable style={styles.navItem} onPress={() => setActiveTab('profile')}>
        <Ionicons name="person-outline" size={24} color={activeTab === 'profile' ? BLUE : GRAY} />
        <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>Profile</Text>
      </Pressable>
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
