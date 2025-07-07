import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useServers } from '../context/ServerContext';
import apiClient from '../api/axiosConfig';
import AppNavbar from '../components/AppNavbar';

function ServerSelectionPage() {
    const { servers, loading, fetchServers, selectServer, clearActiveServer } = useServers();
    const navigate = useNavigate();
    const [showCreate, setShowCreate] = useState(false);
    const [newServer, setNewServer] = useState({ name: '', version: '' });
    const [availableVersions, setAvailableVersions] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        fetchServers();
        clearActiveServer();
    }, [fetchServers, clearActiveServer]);

    useEffect(() => {
        if (showCreate) {
            const getVersions = async () => {
                setLoadingVersions(true);
                setModalError('');
                try {
                    const response = await apiClient.get('/server/versions');
                    const versions = response.data || [];
                    setAvailableVersions(versions);
                    if (versions.length > 0) {
                        setNewServer(prev => ({ ...prev, version: versions[0].id }));
                    }
                } catch (error) {
                    setModalError("Gagal memuat versi dari Mojang.");
                } finally {
                    setLoadingVersions(false);
                }
            };
            getVersions();
        }
    }, [showCreate]);

    const handleManageServer = (server) => {
        selectServer(server);
        navigate(`/dashboard/${server.id}`);
    };
    
    const handleCreateServer = async (e) => {
        e.preventDefault();
        try {
            await apiClient.post('/servers', newServer);
            setShowCreate(false);
            fetchServers();
        } catch(err) {
            setModalError(err.response?.data?.detail || 'Gagal membuat server.');
        }
    };

    return (
        <>
            <AppNavbar />
            <Container className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Pilih Server</h1>
                    <Button variant="primary" onClick={() => setShowCreate(true)}>+ Server Baru</Button>
                </div>
                {loading ? (
                    <div className="text-center"><Spinner animation="border" /></div>
                ) : (
                    <Row>
                        {servers.length > 0 ? servers.map(server => (
                            <Col md={6} lg={4} key={server.id} className="mb-4">
                                <Card className="h-100 shadow-sm">
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="h5">{server.name}</Card.Title>
                                        <Card.Subtitle className="mb-3 text-muted">Versi: {server.version}</Card.Subtitle>
                                        <Button className="mt-auto" variant="success" onClick={() => handleManageServer(server)}>Kelola Server</Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )) : (
                            <Col><Alert variant="info">Anda belum memiliki server. Silakan buat server baru untuk memulai.</Alert></Col>
                        )}
                    </Row>
                )}
                <Modal show={showCreate} onHide={() => setShowCreate(false)}>
                    <Modal.Header closeButton><Modal.Title>Buat Server Baru</Modal.Title></Modal.Header>
                    <Modal.Body>
                        {modalError && <Alert variant="danger">{modalError}</Alert>}
                        <Form onSubmit={handleCreateServer}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nama Server</Form.Label>
                                <Form.Control type="text" placeholder="Contoh: Survival Bareng" onChange={(e) => setNewServer({...newServer, name: e.target.value})} required/>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Versi Server</Form.Label>
                                {loadingVersions ? <Spinner size="sm" /> :
                                    <Form.Select value={newServer.version} onChange={(e) => setNewServer({...newServer, version: e.target.value})} required>
                                        <option value="" disabled>-- Pilih Versi --</option>
                                        {availableVersions.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
                                    </Form.Select>}
                            </Form.Group>
                            <Button type="submit" disabled={loadingVersions}>{loadingVersions ? 'Memuat...' : 'Buat Server'}</Button>
                        </Form>
                    </Modal.Body>
                </Modal>
            </Container>
        </>
    );
}

export default ServerSelectionPage;