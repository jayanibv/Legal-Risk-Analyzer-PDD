const TOKEN_KEY = 'user_token';

export const saveToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('cached_profile');
    sessionStorage.removeItem('chat_messages');
};

export const isAuthenticated = () => {
    const token = getToken();
    return !!token;
};
