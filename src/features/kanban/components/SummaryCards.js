import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const SummaryCards = React.memo(function SummaryCards({ tabs }) {
  const metrics = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        title: tab.title,
        count: tab.items.length,
        highlight: tab.items.filter((item) => item.priority?.toLowerCase() === 'alta').length
      })),
    [tabs]
  );

  return (
    <View style={styles.grid}>
      {metrics.map((metric) => (
        <View key={metric.id} style={styles.card}>
          <Text style={styles.badge}>{metric.highlight} priorità alta</Text>
          <Text style={styles.title}>{metric.title}</Text>
          <Text style={styles.meta}>{metric.count} elementi</Text>
        </View>
      ))}
    </View>
  );
});

SummaryCards.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(PropTypes.object).isRequired
    })
  ).isRequired
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    columnGap: 12,
    marginBottom: 16
  },
  card: {
    flexBasis: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#263046',
    padding: 16
  },
  badge: {
    alignSelf: 'flex-start',
    borderColor: '#33405e',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#9aa4b2',
    fontSize: 12,
    marginBottom: 12
  },
  title: {
    color: '#e6edf3',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4
  },
  meta: {
    color: '#9aa4b2'
  }
});

export default SummaryCards;
