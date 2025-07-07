import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Form, InputGroup, Alert, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useServers } from '../context/ServerContext';
import AppNavbar from '../components/AppNavbar';
import LogView from '../components/LogView';
import apiClient from '../api/axiosConfig';
import './Dashboard.css'; // Import CSS tambahan

const WEBSOCKET_BASE_URL = (process.env.REACT_APP_API_URL || 'wss://bemc.nggo.site').replace(/^https/, 'wss');

function Dashboard() {
    const { serverId } = useParams();
    const navigate = useNavigate();
    const { activeServer, selectServer } = useServers();

    const [serverDetails, setServerDetails] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [serverStatus, setServerStatus] = useState({ running: false });
    const [tunnelStatus, setTunnelStatus] = useState({ running: false, url: null });
    const [logs, setLogs] = useState([]);
    const ws = useRef(null);

    const [loading, setLoading] = useState({ action: false, tunnel: false });
    const [error, setError] = useState('');
    const [tunnelPort, setTunnelPort] = useState('25565');
    const [command, setCommand] = useState('');
    const [quickActionModal, setQuickActionModal] = useState({ show: false, title: '', commandPrefix: '' });
    const [quickActionInput, setQuickActionInput] = useState('');

    const fetchServerStatus = useCallback(async () => {
        if (!serverId) return;
        try {
            const response = await apiClient.get(`/servers/${serverId}/status`);
            setServerStatus(response.data);
        } catch (err) {
            console.error('Gagal mengambil status server:', err);
        }
    }, [serverId]);
    
    const fetchTunnelStatus = useCallback(async () => {
        try {
            const response = await apiClient.get('/tunnel/status');
            setTunnelStatus(response.data);
        } catch (err) {
            console.error('Gagal mengambil status tunnel:', err);
        }
    }, []);

    useEffect(() => {
        const validateAndLoad = () => {
            let serverData = activeServer;
            if (!serverData || serverData.id !== parseInt(serverId)) {
                const savedServer = sessionStorage.getItem('activeServer');
                if (savedServer) serverData = JSON.parse(savedServer);
            }
            if (serverData && serverData.id === parseInt(serverId)) {
                setServerDetails(serverData);
                if (!activeServer) selectServer(serverData);
                setPageLoading(false);
            } else { navigate('/'); }
        };
        validateAndLoad();
    }, [serverId, activeServer, navigate, selectServer]);

    useEffect(() => {
        if (pageLoading) return;
        fetchServerStatus();
        fetchTunnelStatus();
        const serverInterval = setInterval(fetchServerStatus, 7000);
        const tunnelInterval = setInterval(fetchTunnelStatus, 10000);
        return () => {
            clearInterval(serverInterval);
            clearInterval(tunnelInterval);
        };
    }, [pageLoading, fetchServerStatus, fetchTunnelStatus]);

    useEffect(() => {
        if (serverStatus.running) {
            if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
                const token = localStorage.getItem('authToken');
                const websocketUrl = `${WEBSOCKET_BASE_URL}ws/log/${serverId}?token=${token}`;
                ws.current = new WebSocket(websocketUrl);
                setLogs(['--- Mencoba menyambungkan log... ---\n']);
                ws.current.onopen = () => setLogs(prev => [...prev, '--- Koneksi log berhasil ---\n']);
                ws.current.onmessage = (event) => setLogs(prev => [...prev, event.data]);
                ws.current.onerror = () => setLogs(prev => [...prev, '--- Koneksi log error ---\n']);
                ws.current.onclose = () => setLogs(prev => [...prev, '--- Koneksi log terputus ---\n']);
            }
        } else {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.close();
            }
        }
        return () => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.close();
            }
        };
    }, [serverStatus.running, serverId]);

    const handleServerAction = async (action) => {
        setLoading(prev => ({ ...prev, action: true }));
        try {
            await apiClient.post(`/servers/${serverId}/${action}`);
            setTimeout(fetchServerStatus, 1500);
        } catch (err) { setError(`Gagal melakukan aksi: ${action}`); }
        finally { setLoading(prev => ({ ...prev, action: false })); }
    };

    const handleSendCommand = async (cmd) => {
        if (!cmd) return;
        try {
            await apiClient.post(`/servers/${serverId}/command`, { command: cmd });
            setCommand('');
        } catch (err) { setError('Gagal mengirim perintah.'); }
    };
    
    const handleTunnelAction = async (action) => {
        setLoading(prev => ({ ...prev, tunnel: true }));
        try {
            if (action === 'start') {
                await apiClient.post('/tunnel/start', { port_data: { port: parseInt(tunnelPort) } });
            } else {
                await apiClient.post('/tunnel/stop');
            }
            setTimeout(fetchTunnelStatus, 2500);
        } catch (err) {
            setError(`Gagal melakukan aksi tunnel: ${action}`);
        } finally {
            setLoading(prev => ({ ...prev, tunnel: false }));
        }
    };

    const openQuickActionModal = (title, commandPrefix) => {
        setQuickActionModal({ show: true, title, commandPrefix });
        setQuickActionInput('');
    };

    const handleQuickActionSubmit = (e) => {
        e.preventDefault();
        handleSendCommand(`${quickActionModal.commandPrefix} ${quickActionInput}`.trim());
        setQuickActionModal({ show: false, title: '', commandPrefix: '' });
    };

    if (pageLoading) {
        return (
            <>
                <AppNavbar />
                <div className="loading-container">
                    <div className="loading-spinner">
                        <Spinner animation="border" className="mb-3" />
                        <p>Memuat dashboard...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <AppNavbar />
            <div className="dashboard-container">
                <Container fluid className="px-4">
                    {/* Header dengan animasi */}
                    <div className="dashboard-header">
                        <div className="server-title">
                            <h1 className="mb-0">
                                <span className="server-icon">🎮</span>
                                {serverDetails?.name}
                            </h1>
                            <div className="server-status-badge">
                                <Badge 
                                    bg={serverStatus.running ? 'success' : 'danger'} 
                                    className={`status-pulse ${serverStatus.running ? 'running' : 'stopped'}`}
                                >
                                    <span className="status-dot"></span>
                                    {serverStatus.running ? 'Online' : 'Offline'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="danger" onClose={() => setError('')} dismissible className="error-alert">
                            <Alert.Heading>⚠️ Error</Alert.Heading>
                            {error}
                        </Alert>
                    )}

                    <Row className="g-4">
                        <Col lg={8}>
                            {/* Server Control Card */}
                            <Card className="glass-card server-control-card">
                                <Card.Header className="glass-header">
                                    <div className="d-flex align-items-center">
                                        <span className="card-icon">⚡</span>
                                        <h5 className="mb-0">Server Control</h5>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <div className="control-buttons">
                                        <Button 
                                            variant="success" 
                                            className="control-btn start-btn" 
                                            onClick={() => handleServerAction('start')} 
                                            disabled={loading.action || serverStatus.running}
                                        >
                                            {loading.action ? (
                                                <Spinner as="span" animation="border" size="sm" />
                                            ) : (
                                                <>
                                                    <span className="btn-icon">▶️</span>
                                                    Start Server
                                                </>
                                            )}
                                        </Button>
                                        
                                        <Button 
                                            variant="danger" 
                                            className="control-btn stop-btn" 
                                            onClick={() => handleServerAction('stop')} 
                                            disabled={loading.action || !serverStatus.running}
                                        >
                                            {loading.action ? (
                                                <Spinner as="span" animation="border" size="sm" />
                                            ) : (
                                                <>
                                                    <span className="btn-icon">⏹️</span>
                                                    Stop Server
                                                </>
                                            )}
                                        </Button>
                                        
                                        <Button 
                                            variant="warning" 
                                            className="control-btn restart-btn" 
                                            onClick={() => { 
                                                handleServerAction('stop'); 
                                                setTimeout(() => handleServerAction('start'), 2500); 
                                            }} 
                                            disabled={loading.action}
                                        >
                                            {loading.action ? (
                                                <Spinner as="span" animation="border" size="sm" />
                                            ) : (
                                                <>
                                                    <span className="btn-icon">🔄</span>
                                                    Restart Server
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Quick Actions Card */}
                            <Card className="glass-card quick-actions-card">
                                <Card.Header className="glass-header">
                                    <div className="d-flex align-items-center">
                                        <span className="card-icon">⚡</span>
                                        <h5 className="mb-0">Quick Actions</h5>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Row className="g-3">
                                        <Col md={4}>
                                            <Button 
                                                variant="outline-primary" 
                                                className="quick-action-btn w-100" 
                                                onClick={() => handleSendCommand('list')}
                                            >
                                                <span className="quick-icon">👥</span>
                                                Check Players
                                            </Button>
                                        </Col>
                                        <Col md={4}>
                                            <Button 
                                                variant="outline-warning" 
                                                className="quick-action-btn w-100" 
                                                onClick={() => openQuickActionModal('Make Operator', 'op')}
                                            >
                                                <span className="quick-icon">👑</span>
                                                OP Player
                                            </Button>
                                        </Col>
                                        <Col md={4}>
                                            <Button 
                                                variant="outline-danger" 
                                                className="quick-action-btn w-100" 
                                                onClick={() => openQuickActionModal('Kick Player', 'kick')}
                                            >
                                                <span className="quick-icon">👢</span>
                                                Kick Player
                                            </Button>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Logs Card */}
                            <Card className="glass-card logs-card">
                                <Card.Header className="glass-header">
                                    <div className="d-flex align-items-center">
                                        <span className="card-icon">📜</span>
                                        <h5 className="mb-0">Server Logs</h5>
                                        <div className="log-status ms-auto">
                                            <Badge bg={serverStatus.running ? 'success' : 'secondary'} className="log-badge">
                                                {serverStatus.running ? 'Live' : 'Offline'}
                                            </Badge>
                                        </div>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <LogView logs={logs} />
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col lg={4}>
                            {/* Tunnel Manager Card */}
                            <Card className="glass-card tunnel-card">
                                <Card.Header className="glass-header">
                                    <div className="d-flex align-items-center">
                                        <span className="card-icon">🌐</span>
                                        <h5 className="mb-0">Tunnel Manager</h5>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <div className="tunnel-port-input">
                                        <label className="form-label">Port Configuration</label>
                                        <InputGroup className="mb-3">
                                            <InputGroup.Text>
                                                <span className="port-icon">🔌</span>
                                            </InputGroup.Text>
                                            <Form.Control 
                                                type="number"
                                                value={tunnelPort} 
                                                onChange={(e) => setTunnelPort(e.target.value)}
                                                placeholder="25565"
                                                className="tunnel-port"
                                            />
                                        </InputGroup>
                                    </div>
                                    
                                    <div className="tunnel-controls">
                                        <Button 
                                            variant="primary" 
                                            className="tunnel-btn start-tunnel w-100 mb-2" 
                                            onClick={() => handleTunnelAction('start')} 
                                            disabled={loading.tunnel || tunnelStatus.running}
                                        >
                                            {loading.tunnel ? (
                                                <Spinner as="span" animation="border" size="sm" />
                                            ) : (
                                                <>
                                                    <span className="btn-icon">🚀</span>
                                                    Start Tunnel
                                                </>
                                            )}
                                        </Button>
                                        
                                        <Button 
                                            variant="outline-danger" 
                                            className="tunnel-btn stop-tunnel w-100" 
                                            onClick={() => handleTunnelAction('stop')} 
                                            disabled={loading.tunnel || !tunnelStatus.running}
                                        >
                                            {loading.tunnel ? (
                                                <Spinner as="span" animation="border" size="sm" />
                                            ) : (
                                                <>
                                                    <span className="btn-icon">🛑</span>
                                                    Stop Tunnel
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    
                                    <div className="tunnel-status">
                                        <div className="status-row">
                                            <span className="status-label">Status:</span>
                                            <Badge 
                                                bg={tunnelStatus.running ? 'success' : 'secondary'} 
                                                className={`tunnel-status-badge ${tunnelStatus.running ? 'active' : 'inactive'}`}
                                            >
                                                {loading.tunnel ? 'Processing...' : (tunnelStatus.running ? 'Active' : 'Inactive')}
                                            </Badge>
                                        </div>
                                        
                                        {tunnelStatus.url && (
                                            <div className="tunnel-url">
                                                <span className="url-label">Public URL:</span>
                                                <a 
                                                    href={tunnelStatus.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="tunnel-link"
                                                >
                                                    {tunnelStatus.url}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>

                            {/* Command Console Card */}
                            <Card className="glass-card command-card">
                                <Card.Header className="glass-header">
                                    <div className="d-flex align-items-center">
                                        <span className="card-icon">⌨️</span>
                                        <h5 className="mb-0">Command Console</h5>
                                    </div>
                                </Card.Header>
                                <Card.Body className="p-4">
                                    <Form onSubmit={(e) => { e.preventDefault(); handleSendCommand(command); }}>
                                        <div className="command-input">
                                            <Form.Control 
                                                type="text" 
                                                placeholder="Enter command (e.g., help, op player, list)" 
                                                value={command} 
                                                onChange={(e) => setCommand(e.target.value)} 
                                                className="command-field"
                                            />
                                            <Button type="submit" className="send-btn" disabled={!command.trim()}>
                                                <span className="btn-icon">📤</span>
                                                Send
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* Enhanced Modal */}
            <Modal 
                show={quickActionModal.show} 
                onHide={() => setQuickActionModal({ show: false, title: '', commandPrefix: '' })} 
                centered
                className="quick-action-modal"
            >
                <Modal.Header closeButton className="modal-header-custom">
                    <Modal.Title>
                        <span className="modal-icon">⚡</span>
                        {quickActionModal.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-body-custom">
                    <Form onSubmit={handleQuickActionSubmit}>
                        <Form.Group>
                            <Form.Label>Player Username</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={quickActionInput} 
                                onChange={(e) => setQuickActionInput(e.target.value)} 
                                placeholder="Enter player name..." 
                                autoFocus 
                                className="modal-input"
                            />
                        </Form.Group>
                        <Button type="submit" className="modal-submit-btn mt-3" disabled={!quickActionInput.trim()}>
                            <span className="btn-icon">🚀</span>
                            Execute Command
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

export default Dashboard;