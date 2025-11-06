import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ActionButton from './buttons/ActionButton';
import GradientButton from './buttons/GradientButton';

const KanbanHeader = React.memo(function KanbanHeader({
  onReset,
  onShare,
  onOpenSettings
}) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>Kanban Covey</Text>
        <Text style={styles.subtitle}>Ruoli → LT → BT → Attività</Text>
      </View>
      <View style={styles.actions}>
        <GradientButton label="Condividi" onPress={onShare} />
        <ActionButton label="Impostazioni" onPress={onOpenSettings} />
        <ActionButton label="Reset" variant="danger" onPress={onReset} />
      </View>
    </View>
  );
});

KanbanHeader.propTypes = {
  onReset: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
  onOpenSettings: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(11, 15, 22, 0.92)',
    borderBottomColor: '#263046',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    color: '#e6edf3',
    fontSize: 20,
    fontWeight: '700'
  },
  subtitle: {
    color: '#9aa4b2',
    fontSize: 14,
    marginTop: 4
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12
  }
});

export default KanbanHeader;
