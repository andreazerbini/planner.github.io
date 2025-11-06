import PropTypes from 'prop-types';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

const variantStyles = {
  default: {
    borderColor: '#33405e',
    backgroundColor: '#121826',
    textColor: '#e6edf3'
  },
  danger: {
    borderColor: '#ef4444',
    backgroundColor: '#2b100f',
    textColor: '#f59e0b'
  }
};

const ActionButton = React.memo(function ActionButton({ label, onPress, variant }) {
  const styles = variantStyles[variant] ?? variantStyles.default;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[baseStyles.button, { borderColor: styles.borderColor, backgroundColor: styles.backgroundColor }]}
    >
      <Text style={[baseStyles.text, { color: styles.textColor }]}>{label}</Text>
    </Pressable>
  );
});

ActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'danger'])
};

ActionButton.defaultProps = {
  variant: 'default'
};

const baseStyles = StyleSheet.create({
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1
  },
  text: {
    fontSize: 14,
    fontWeight: '600'
  }
});

export default ActionButton;
