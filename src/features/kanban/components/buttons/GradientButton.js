import PropTypes from 'prop-types';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';

const GradientButton = React.memo(function GradientButton({ label, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.wrapper}>
      <LinearGradient colors={['#12b3a6', '#6ee7d2']} start={[0, 0]} end={[1, 1]} style={styles.gradient}>
        <Text style={styles.text}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
});

GradientButton.propTypes = {
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  gradient: {
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  text: {
    color: '#061317',
    fontWeight: '700',
    fontSize: 14
  }
});

export default GradientButton;
