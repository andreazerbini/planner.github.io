import { useRouter } from 'expo-router';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import AddItemForm from '../src/features/kanban/components/AddItemForm';
import ItemCard from '../src/features/kanban/components/ItemCard';
import KanbanHeader from '../src/features/kanban/components/KanbanHeader';
import SummaryCards from '../src/features/kanban/components/SummaryCards';
import TabBar from '../src/features/kanban/components/TabBar';
import { usePlannerModel } from '../src/features/kanban/hooks/usePlannerModel';

const ItemList = React.memo(function ItemList({ items, onDelete }) {
  return (
    <View style={styles.listContainer}>
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </View>
  );
});

ItemList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  onDelete: PropTypes.func.isRequired
};

export default function KanbanScreen() {
  const router = useRouter();
  const { isReady, model, activeTab, setActiveTabId, addItem, deleteItem, resetModel } =
    usePlannerModel();

  const handleTabPress = useCallback((tabId) => setActiveTabId(tabId), [setActiveTabId]);

  const handleAddItem = useCallback(
    (item) => {
      addItem(activeTab.id, {
        ...item,
        id: `${activeTab.id}-${Date.now()}`
      });
    },
    [activeTab.id, addItem]
  );

  const handleDeleteItem = useCallback(
    (itemId) => {
      deleteItem(activeTab.id, itemId);
    },
    [activeTab.id, deleteItem]
  );

  const handleReset = useCallback(() => {
    Alert.alert('Ripristina dati', 'Vuoi davvero ripristinare il modello iniziale?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Ripristina', style: 'destructive', onPress: resetModel }
    ]);
  }, [resetModel]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: JSON.stringify(model, null, 2)
      });
    } catch (error) {
      Alert.alert('Errore condivisione', error.message);
    }
  }, [model]);

  const handleOpenSettings = useCallback(() => {
    router.push({ pathname: '/settings' });
  }, [router]);

  const tabItems = useMemo(() => model.tabs ?? [], [model.tabs]);

  if (!isReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Caricamento in corso…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <KanbanHeader onReset={handleReset} onShare={handleShare} onOpenSettings={handleOpenSettings} />
      <TabBar tabs={tabItems} activeTabId={activeTab.id} onTabPress={handleTabPress} />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <SummaryCards tabs={tabItems} />
        <AddItemForm onSubmit={handleAddItem} />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{activeTab.title}</Text>
          <Text style={styles.sectionSubtitle}>{activeTab.description}</Text>
        </View>
        <ItemList items={activeTab.items} onDelete={handleDeleteItem} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0f16'
  },
  contentContainer: {
    padding: 20
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#e6edf3'
  },
  listContainer: {
    paddingBottom: 32
  },
  sectionHeader: {
    marginBottom: 12
  },
  sectionTitle: {
    color: '#e6edf3',
    fontSize: 18,
    fontWeight: '700'
  },
  sectionSubtitle: {
    color: '#9aa4b2',
    marginTop: 4
  }
});
