import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const TabItem = React.memo(function TabItem({ item, isActive, onTabPress }) {
  const handlePress = useCallback(() => onTabPress(item.id), [item.id, onTabPress]);
  return (
    <Pressable onPress={handlePress} style={[styles.tab, isActive && styles.activeTab]} accessibilityRole="button">
      <Text style={[styles.tabLabel, isActive && styles.activeLabel]}>{item.title}</Text>
    </Pressable>
  );
});

TabItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onTabPress: PropTypes.func.isRequired
};

const TabBar = React.memo(function TabBar({ tabs, activeTabId, onTabPress }) {
  const keyExtractor = useCallback((item) => item.id, []);

  const data = useMemo(
    () =>
      tabs.map((item) => ({
        id: item.id,
        title: item.title
      })),
    [tabs]
  );

  const renderTab = useCallback(
    ({ item }) => (
      <TabItem item={item} isActive={item.id === activeTabId} onTabPress={onTabPress} />
    ),
    [activeTabId, onTabPress]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        horizontal
        keyExtractor={keyExtractor}
        renderItem={renderTab}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
});

const Separator = () => <View style={styles.separator} />;

TabBar.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  ).isRequired,
  activeTabId: PropTypes.string.isRequired,
  onTabPress: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  container: {
    borderBottomColor: '#263046',
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(11, 15, 22, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#263046',
    backgroundColor: '#121826'
  },
  activeTab: {
    borderColor: 'transparent',
    backgroundColor: '#5eead4'
  },
  tabLabel: {
    color: '#9aa4b2',
    fontWeight: '600'
  },
  activeLabel: {
    color: '#061317'
  },
  separator: {
    width: 12
  }
});

export default TabBar;
