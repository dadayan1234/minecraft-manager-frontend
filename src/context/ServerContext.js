import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import apiClient from '../api/axiosConfig';

const ServerContext = createContext(null);

export const ServerProvider = ({ children }) => {
    const [servers, setServers] = useState([]);
    const [activeServer, setActiveServer] = useState(() => {
        try {
            const saved = sessionStorage.getItem('activeServer');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    const fetchServers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/servers');
            setServers(response.data);
        } catch (error) {
            console.error("Gagal mengambil daftar server:", error);
            setServers([]);
        } finally {
            setLoading(false);
        }
    }, []); // Dependency array kosong di sini sudah benar

    const selectServer = useCallback((server) => {
        sessionStorage.setItem('activeServer', JSON.stringify(server));
        setActiveServer(server);
    }, []);

    const clearActiveServer = useCallback(() => {
        sessionStorage.removeItem('activeServer');
        setActiveServer(null);
    }, []);

    // --- PERBAIKAN UTAMA ADA DI SINI ---
    // Bungkus objek 'value' dengan useMemo.
    // Ini memastikan bahwa objek dan fungsi di dalamnya (seperti fetchServers)
    // hanya akan dibuat ulang jika state yang menjadi dependensinya (seperti servers atau activeServer)
    // benar-benar berubah. Ini akan memutus lingkaran setan render.
    const value = useMemo(() => ({
        servers,
        activeServer,
        loading,
        fetchServers,
        selectServer,
        clearActiveServer,
    }), [servers, activeServer, loading, fetchServers, selectServer, clearActiveServer]);

    return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>;
};

export const useServers = () => {
    const context = useContext(ServerContext);
    if (context === null) {
        throw new Error("useServers harus digunakan di dalam ServerProvider");
    }
    return context;
};