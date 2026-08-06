import { getToken } from './auth';

let BASE_URL = 'https://legal-risk-analyzer-pdd.onrender.com'; // Production URL

if (import.meta.env.DEV) {
    BASE_URL = 'http://localhost:8000';
}
console.log("🚀 API Route configured for:", BASE_URL);

const getHeaders = (isMultipart = false) => {
    const token = getToken();
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

export const login = async (username, password) => {
    const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || "Login failed");
    }
    return data;
};

export const signup = async (name, email, password, isMajor, dob, securityAnswer) => {
    const response = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, is_major: isMajor, dob, security_answer: securityAnswer })
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
        headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Unauthorized");
    return data;
};

export const updateProfile = async (name, dob) => {
    const response = await fetch(`${BASE_URL}/update-profile`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, dob })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to update profile");
    return data;
};

export const resetPassword = async (email, dob, security_answer, new_password) => {
    const response = await fetch(`${BASE_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, dob, security_answer, new_password })
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
        headers: getHeaders(),
        body: JSON.stringify({ text })
    });
    return await response.json();
};

export const analyzePDF = async (fileObjOrUri, fileName) => {
    const formData = new FormData();
    // fileObjOrUri is a native File object on web
    formData.append('file', fileObjOrUri);

    const response = await fetch(`${BASE_URL}/analyze-pdf`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
    });
    return await response.json();
};

export const getHistory = async () => {
    const response = await fetch(`${BASE_URL}/history`, {
        method: 'GET',
        headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to fetch history");
    return data;
};
export const getAnalysisById = async (id) => {
    const response = await fetch(`${BASE_URL}/analysis/${id}`, {
        method: "GET",
        headers: getHeaders()
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Analysis not found");
    return data;
};

export const chatWithBot = async (message) => {
    const response = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ message })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Failed to chat");
    return data.response;
};
