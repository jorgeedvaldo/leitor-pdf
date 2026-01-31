import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENTS_KEY = '@pdf_recents';
const FAVORITES_KEY = '@pdf_favorites';

export const getRecents = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(RECENTS_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const addToRecents = async (file) => {
    try {
        const current = await getRecents();
        // Remove if exists to push to top
        const filtered = current.filter(item => item.uri !== file.uri);
        const newRecents = [file, ...filtered].slice(0, 20); // Keep last 20
        await AsyncStorage.setItem(RECENTS_KEY, JSON.stringify(newRecents));
    } catch (e) {
        console.error(e);
    }
};

export const getFavorites = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const toggleFavorite = async (file) => {
    try {
        const current = await getFavorites();
        const exists = current.find(item => item.uri === file.uri);
        let newFavorites;
        if (exists) {
            newFavorites = current.filter(item => item.uri !== file.uri);
        } else {
            newFavorites = [file, ...current];
        }
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
        return !exists; // returns true if now favorite
    } catch (e) {
        console.error(e);
        return false;
    }
};

export const isFavorite = async (uri) => {
    const current = await getFavorites();
    return !!current.find(item => item.uri === uri);
}
