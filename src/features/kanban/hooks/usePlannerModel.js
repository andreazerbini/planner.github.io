import { useCallback, useEffect, useMemo, useState } from 'react';
import { initialModel } from '../data/initialModel';
import { clearModel, loadModel, saveModel } from '../utils/storage';

export function usePlannerModel() {
  const [model, setModel] = useState(initialModel);
  const [activeTabId, setActiveTabId] = useState(initialModel.tabs[0].id);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const saved = await loadModel();
      if (saved && mounted) {
        setModel(saved);
        setActiveTabId(saved.tabs?.[0]?.id ?? initialModel.tabs[0].id);
      }
      if (mounted) {
        setIsReady(true);
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const persistModel = useCallback((updater) => {
    setModel((currentModel) => {
      const nextModel =
        typeof updater === 'function' ? updater(currentModel) : updater;
      saveModel(nextModel);
      return nextModel;
    });
  }, []);

  const updateItem = useCallback(
    (tabId, itemId, partial) => {
      persistModel((currentModel) => {
        const nextTabs = currentModel.tabs.map((tab) => {
          if (tab.id !== tabId) {
            return tab;
          }
          const nextItems = tab.items.map((item) =>
            item.id === itemId ? { ...item, ...partial } : item
          );
          return { ...tab, items: nextItems };
        });
        return { ...currentModel, tabs: nextTabs };
      });
    },
    [persistModel]
  );

  const addItem = useCallback(
    (tabId, item) => {
      persistModel((currentModel) => {
        const nextTabs = currentModel.tabs.map((tab) => {
          if (tab.id !== tabId) {
            return tab;
          }
          return { ...tab, items: [item, ...tab.items] };
        });
        return { ...currentModel, tabs: nextTabs };
      });
    },
    [persistModel]
  );

  const deleteItem = useCallback(
    (tabId, itemId) => {
      persistModel((currentModel) => {
        const nextTabs = currentModel.tabs.map((tab) => {
          if (tab.id !== tabId) {
            return tab;
          }
          const filteredItems = tab.items.filter((item) => item.id !== itemId);
          return { ...tab, items: filteredItems };
        });
        return { ...currentModel, tabs: nextTabs };
      });
    },
    [persistModel]
  );

  const resetModel = useCallback(() => {
    persistModel(initialModel);
    clearModel();
  }, [persistModel]);

  const activeTab = useMemo(
    () => model.tabs.find((tab) => tab.id === activeTabId) ?? model.tabs[0],
    [activeTabId, model.tabs]
  );

  return {
    isReady,
    model,
    activeTab,
    setActiveTabId,
    updateItem,
    addItem,
    deleteItem,
    resetModel
  };
}
