import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.text}>Impostazioni in arrivo</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0f16'
  },
  text: {
    color: '#e6edf3'
  }
});
