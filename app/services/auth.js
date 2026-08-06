import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'user_token';

// Fallback for Web since SecureStore is native only
const isWeb = Platform.OS === 'web';

export const saveToken = async (token) => {
    if (isWeb) {
        localStorage.setItem(TOKEN_KEY, token);
    } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
};

export const getToken = async () => {
    if (isWeb) {
        return localStorage.getItem(TOKEN_KEY);
    } else {
        return await SecureStore.getItemAsync(TOKEN_KEY);
    }
};

export const removeToken = async () => {
    if (isWeb) {
        localStorage.removeItem(TOKEN_KEY);
    } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
};

export const isAuthenticated = async () => {
    const token = await getToken();
    return !!token;
};
