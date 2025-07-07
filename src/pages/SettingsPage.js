import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Alert, Spinner, InputGroup, Tabs, Tab } from 'react-bootstrap';
import AppNavbar from '../components/AppNavbar';
import apiClient from '../api/axiosConfig';
import { useServers } from '../context/ServerContext';

// Komponen baru untuk mengelola server.properties
function PropertiesEditor({ serverId }) {
    const [properties, setProperties] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProperties = useCallback(async () => {
        if (!serverId) return;
        setLoading(true);
        setError('');
        try {
            const res = await apiClient.get(`/config/${serverId}`);
            setProperties(res.data || {});
        } catch (err) {
            setError('Gagal memuat properties.');
        } finally {
            setLoading(false);
        }
    }, [serverId]);

    useEffect(() => {
        fetchProperties();
    }, [fetchProperties]);

    const handlePropertyChange = (key, value) => {
        setProperties(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        try {
            await apiClient.post(`/config/${serverId}`, properties);
            alert('Properties berhasil disimpan! Restart server agar perubahan diterapkan.');
        } catch (err) {
            alert('Gagal menyimpan properties.');
        }
    };

    if (loading) return <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (properties === null || Object.keys(properties).length === 0) {
        return <p className="text-muted">File <code>server.properties</code> tidak ditemukan atau kosong. Mulai server setidaknya sekali untuk membuatnya.</p>;
    }

    return (
        <>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '0.25rem', padding: '1rem' }}>
                {Object.entries(properties).map(([key, value]) => (
                    <InputGroup className="mb-2" key={key}>
                        <InputGroup.Text style={{ minWidth: '180px', fontSize: '0.9rem' }}>{key}</InputGroup.Text>
                        <Form.Control
                            value={value}
                            onChange={(e) => handlePropertyChange(key, e.target.value)}
                        />
                    </InputGroup>
                ))}
            </div>
            <Button className="mt-3" onClick={handleSave}>Simpan Properties</Button>
        </>
    );
}

function SettingsPage() {
    const { servers, loading: loadingServers, fetchServers } = useServers();
    
    const [selectedServerId, setSelectedServerId] = useState('');
    const [availableVersions, setAvailableVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState('');
    const [webhooks, setWebhooks] = useState([]);
    const [newWebhook, setNewWebhook] = useState('');
    const [loading, setLoading] = useState({ versions: false, webhooks: true });
    const [message, setMessage] = useState('');

    const fetchWebhooks = useCallback(async () => {
        setLoading(prev => ({ ...prev, webhooks: true }));
        try {
            const res = await apiClient.get('/webhooks');
            setWebhooks(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(prev => ({ ...prev, webhooks: false })); }
    }, []);

    useEffect(() => {
        fetchServers();
        fetchWebhooks();
    }, [fetchServers, fetchWebhooks]);

    useEffect(() => {
        const getVersions = async () => {
            setLoading(prev => ({...prev, versions: true}));
            try {
                const res = await apiClient.get('/server/versions');
                setAvailableVersions(res.data);
            } catch (err) { console.error(err); } 
            finally { setLoading(prev => ({...prev, versions: false})); }
        };
        getVersions();
    }, []);

    const handleVersionSave = async (e) => {
        e.preventDefault();
        if (!selectedServerId || !selectedVersion) {
            setMessage('Pilih server dan versi baru terlebih dahulu.');
            return;
        }
        setMessage('');
        try {
            // Asumsi backend memiliki endpoint ini. Jika belum ada, perlu dibuat.
            await apiClient.post(`/servers/${selectedServerId}/version`, { version: selectedVersion });
            setMessage('Versi server berhasil diperbarui!');
            fetchServers();
        } catch (err) { setMessage('Gagal memperbarui versi.'); }
    };
    
    const handleAddWebhook = async (e) => {
        e.preventDefault();
        if(!newWebhook) return;
        try {
            await apiClient.post('/webhooks', { webhook_url: newWebhook });
            setNewWebhook('');
            fetchWebhooks();
        } catch (err) { setMessage('Gagal menambahkan webhook.'); }
    };
    
    const handleDeleteWebhook = async (id) => {
        try {
            await apiClient.delete(`/webhooks/${id}`);
            fetchWebhooks();
        } catch (err) { setMessage('Gagal menghapus webhook.'); }
    };

    return (
        <>
            <AppNavbar />
            <Container>
                <h1 className="mb-4">Pengaturan Aplikasi & Server</h1>
                {message && <Alert variant="info" onClose={() => setMessage('')} dismissible>{message}</Alert>}
                
                <Tabs defaultActiveKey="server" id="settings-tabs" className="mb-3">
                    <Tab eventKey="server" title="Pengaturan Server">
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Row>
                                    <Col md={5} className="border-end">
                                        <h5 className="mb-3">Ubah Versi Server</h5>
                                        <Form onSubmit={handleVersionSave}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>1. Pilih Server</Form.Label>
                                                <Form.Select value={selectedServerId} onChange={(e) => setSelectedServerId(e.target.value)} disabled={loadingServers}>
                                                    <option value="">-- Pilih Server --</option>
                                                    {servers.map(s => <option key={s.id} value={s.id}>{s.name} (Saat ini: {s.version})</option>)}
                                                </Form.Select>
                                            </Form.Group>
                                            <Form.Group>
                                                <Form.Label>2. Pilih Versi Baru</Form.Label>
                                                <Form.Select value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)} disabled={!selectedServerId || loading.versions}>
                                                    <option value="">-- Pilih versi --</option>
                                                    {availableVersions.map(v => <option key={v.id} value={v.id}>{v.id}</option>)}
                                                </Form.Select>
                                                {loading.versions && <Spinner size="sm" className="ms-2"/>}
                                            </Form.Group>
                                            <Button type="submit" className="mt-3" disabled={!selectedServerId}>Simpan Versi</Button>
                                        </Form>
                                    </Col>
                                    <Col md={7}>
                                        <h5 className="mb-3">Editor <code>server.properties</code></h5>
                                        {selectedServerId ? (
                                            <PropertiesEditor serverId={selectedServerId} />
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 bg-light rounded">
                                                <p className="text-muted">Pilih server di sebelah kiri untuk mengedit propertinya.</p>
                                            </div>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="webhook" title="Pengaturan Notifikasi">
                         <Card className="shadow-sm">
                            <Card.Header><h5>Manajemen Webhook Discord</h5></Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col>
                                        <p className="text-muted">Tambahkan URL webhook dari channel Discord Anda untuk mendapatkan notifikasi saat tunnel aktif.</p>
                                        <Form onSubmit={handleAddWebhook} className="mb-3">
                                            <Form.Control type="url" placeholder="https://discord.com/api/webhooks/..." value={newWebhook} onChange={(e) => setNewWebhook(e.target.value)} required />
                                            <Button type="submit" className="mt-2" size="sm">Tambah Webhook</Button>
                                        </Form>
                                        <hr />
                                        <h6 className="mb-3">Webhook Tersimpan:</h6>
                                        {loading.webhooks ? <Spinner animation="border" /> :
                                        <ListGroup variant="flush">
                                            {webhooks.length > 0 ? webhooks.map(wh => (
                                                <ListGroup.Item key={wh.id} className="d-flex justify-content-between align-items-center px-0">
                                                    <span className="text-muted" style={{fontSize: '0.8rem', wordBreak: 'break-all'}}>{wh.webhook_url}</span>
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteWebhook(wh.id)}>Hapus</Button>
                                                </ListGroup.Item>
                                            )) : <p className="text-muted">Belum ada webhook.</p>}
                                        </ListGroup>
                                        }
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>
            </Container>
        </>
    );
}

export default SettingsPage;