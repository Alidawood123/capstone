import React from 'react';

import { StyleSheet, View, Text, Pressable } from 'react-native';

export default function FitnessAnalyticsContent() {
    return (
        <View style={styles.container}>
            <Text>FitnessAnalyticsContent Page</Text>
            <Text>Analytics coming soon!</Text>
            
        </View>
    );
}

const styles = StyleSheet.create({ 
    container: {
        flex: 1
    }
});
