import { getToken } from './auth';
import { Platform } from 'react-native';

// Use localhost for web, and your computer's IP for physical devices
const BASE_URL = Platform.OS === 'web' ? 'http://localhost:8000' : 'https://thinking-sciences-erp-below.trycloudflare.com';

const getHeaders = async (isMultipart = false) => {
    const token = await getToken();
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

export const login = async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Login failed");
    }
    return data;
};

export const signup = async (name, email, password, isMajor, dob) => {
    const response = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, is_major: isMajor, dob })
    });
    const data = await response.json();
    if (!response.ok) {
        let msg = "Signup failed";
        if (typeof data.detail === 'string') msg = data.detail;
        else if (Array.isArray(data.detail)) msg = data.detail[0].msg;
        throw new Error(msg);
    }
    return data;
};

export const getUserProfile = async () => {
    const response = await fetch(`${BASE_URL}/me`, {
        method: 'GET',
        headers: await getHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Unauthorized");
    return data;
};

export const updateProfile = async (name, dob) => {
    const response = await fetch(`${BASE_URL}/update-profile`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ name, dob })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to update profile");
    return data;
};

export const verifyOtp = async (email, code) => {
    const response = await fetch(`${BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Invalid OTP");
    }
    return data;
};

export const forgotPassword = async (email) => {
    const response = await fetch(`${BASE_URL}/forgot-password?email=${email}`, {
        method: 'POST'
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Request failed");
    }
    return data;
};

export const resetPassword = async (email, otp, new_password) => {
    const response = await fetch(`${BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Reset failed");
    }
    return data;
};

export const analyzeText = async (text) => {
    const response = await fetch(`${BASE_URL}/analyze`, {
        method: "POST",
        headers: await getHeaders(),
        body: JSON.stringify({ text })
    });
    return await response.json();
};

export const analyzePDF = async (fileObjOrUri, fileName) => {
    const formData = new FormData();
    if (Platform.OS === 'web') {
        // fileObjOrUri is a native File object on web
        formData.append('file', fileObjOrUri);
    } else {
        formData.append('file', {
            uri: fileObjOrUri,
            name: fileName,
            type: 'application/pdf'
        });
    }

    const response = await fetch(`${BASE_URL}/analyze-pdf`, {
        method: 'POST',
        headers: await getHeaders(true),
        body: formData
    });
    return await response.json();
};

export const getHistory = async () => {
    const response = await fetch(`${BASE_URL}/history`, {
        method: 'GET',
        headers: await getHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to fetch history");
    return data;
};
export const getAnalysisById = async (id) => {
    const response = await fetch(`${BASE_URL}/analysis/${id}`, {
        method: "GET",
        headers: await getHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Analysis not found");
    return data;
};
