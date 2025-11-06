import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const ItemCard = React.memo(function ItemCard({ item, onDelete }) {
  const handleDelete = useCallback(() => onDelete(item.id), [item.id, onDelete]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{item.name}</Text>
        <Pressable accessibilityRole="button" onPress={handleDelete}>
          <Text style={styles.delete}>Elimina</Text>
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{item.priority}</Text>
        </View>
        <Text style={styles.owner}>{item.owner}</Text>
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </View>
  );
});

ItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    owner: PropTypes.string,
    priority: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  onDelete: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#263046',
    padding: 16,
    marginBottom: 12
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  name: {
    color: '#e6edf3',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12
  },
  delete: {
    color: '#ef4444',
    fontWeight: '600'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    marginTop: 12
  },
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#33405e',
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  badgeLabel: {
    color: '#9aa4b2',
    fontSize: 12,
    fontWeight: '600'
  },
  owner: {
    color: '#9aa4b2',
    fontSize: 14,
    flex: 1
  },
  notes: {
    marginTop: 12,
    color: '#cbd5f5',
    lineHeight: 20
  }
});

export default ItemCard;
