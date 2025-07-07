import React, { useEffect, useRef } from 'react';

function LogView({ logs }) {
    const logContainerRef = useRef(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <pre 
            ref={logContainerRef} 
            className="bg-dark text-white p-3" 
            style={{ 
                height: '400px', 
                overflowY: 'scroll', 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-all',
                fontSize: '0.8rem',
                backgroundColor: '#1a1a1a',
                borderRadius: '0.25rem'
            }}
        >
            {logs.map((log, index) => (
                <span key={index}>{log}</span>
            ))}
        </pre>
    );
}

export default LogView;