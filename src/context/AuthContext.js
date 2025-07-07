import React, { createContext, useState, useContext, useEffect } from 'react';

// Buat Context
const AuthContext = createContext(null);

// Buat Provider
export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));

    // Fungsi untuk login
    const login = (authToken) => {
        localStorage.setItem('authToken', authToken);
        setToken(authToken);
    };

    // Fungsi untuk logout
    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
    };
    
    // Nilai yang akan disediakan untuk semua komponen anak
    const value = {
        token,
        login,
        logout,
        isAuthenticated: !!token // Boolean praktis untuk cek status login
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook kustom untuk mempermudah penggunaan context
export const useAuth = () => {
    return useContext(AuthContext);
};