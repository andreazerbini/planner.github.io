import AsyncStorage from '@react-native-async-storage/async-storage';

const MODEL_KEY = 'planner:model:v1';

export async function loadModel() {
  try {
    const value = await AsyncStorage.getItem(MODEL_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('Impossibile leggere il modello da AsyncStorage', error);
    return null;
  }
}

export async function saveModel(model) {
  try {
    await AsyncStorage.setItem(MODEL_KEY, JSON.stringify(model));
  } catch (error) {
    console.warn('Impossibile salvare il modello su AsyncStorage', error);
  }
}

export async function clearModel() {
  try {
    await AsyncStorage.removeItem(MODEL_KEY);
  } catch (error) {
    console.warn('Impossibile eliminare il modello da AsyncStorage', error);
  }
}
