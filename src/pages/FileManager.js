import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, ListGroup, Button, Spinner, Alert, Modal, Form, Row, Col, Card, ProgressBar, InputGroup } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import FileItem from '../components/FileManager/FileItem';
import FileBreadcrumb from '../components/FileManager/Breadcrumb';
import apiClient from '../api/axiosConfig';

function FileManager() {
    const { serverId } = useParams();
    const [path, setPath] = useState('');
    const [files, setFiles] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const [modal, setModal] = useState({ type: null, data: null });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchMode, setIsSearchMode] = useState(false); // State baru untuk menandai mode pencarian

    // --- DATA FETCHING ---
    const fetchFiles = useCallback(async (currentPath) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await apiClient.get(`/files/${serverId}`, { params: { path: currentPath } });
            setFiles(response.data.files || []);
            setSelectedFiles(new Set());
        } catch (err) {
            setError('Gagal memuat file. Pastikan server berjalan dan path benar.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [serverId]);

    useEffect(() => {
        // Hanya panggil fetchFiles jika tidak dalam mode pencarian
        if (!isSearchMode) {
            fetchFiles(path);
        }
    }, [path, fetchFiles, isSearchMode]);

    // --- EVENT HANDLERS ---
    const handleNavigate = (newPath) => {
        setIsSearchMode(false); // Keluar dari mode pencarian saat navigasi
        setSearchTerm('');
        setPath(newPath);
    };

    const handleSelect = (filePath) => {
        const newSelection = new Set(selectedFiles);
        newSelection.has(filePath) ? newSelection.delete(filePath) : newSelection.add(filePath);
        setSelectedFiles(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedFiles.size === files.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(files.map(f => f.path)));
        }
    };
    
    const openModal = (type, data = null) => setModal({ type, data });

    const handlePreview = async (filePath) => {
        try {
            const res = await apiClient.get(`/files/${serverId}/preview`, { params: { path: filePath } });
            openModal('preview', { title: filePath, content: res.data.content });
        } catch (err) {
            alert('Tidak dapat menampilkan pratinjau file ini.');
        }
    };

    const handleUpload = async (e) => {
        const filesToUpload = e.target.files;
        if (filesToUpload.length === 0) return;
        const formData = new FormData();
        formData.append('path', path);
        for (const file of filesToUpload) {
            formData.append('file', file);
        }
        try {
            setUploadProgress(1);
            await apiClient.post(`/files/${serverId}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                }
            });
            setTimeout(() => setUploadProgress(0), 1500);
            fetchFiles(path);
        } catch(err) {
            alert('Gagal mengunggah file.');
            setUploadProgress(0);
        }
    };
    
    const handleRename = async (e) => {
        e.preventDefault();
        const { oldPath, newName } = modal.data;
        const formData = new FormData();
        formData.append('old_path', oldPath);
        formData.append('new_name', newName);

        try {
            await apiClient.post(`/files/${serverId}/rename`, formData);
            openModal(null);
            fetchFiles(path);
        } catch(err) { alert('Gagal mengganti nama file.'); }
    };
    
    const handleDelete = async (filePaths) => {
        const pathsToDelete = Array.isArray(filePaths) ? filePaths : [filePaths];
        if (pathsToDelete.length === 0) return alert('Pilih file untuk dihapus.');
        
        if (window.confirm(`Yakin ingin menghapus ${pathsToDelete.length} item?`)) {
            try {
                for (const p of pathsToDelete) {
                    const formData = new FormData();
                    formData.append('path', p);
                    await apiClient.post(`/files/${serverId}/delete`, formData);
                }
                fetchFiles(path);
            } catch (err) {
                alert('Gagal menghapus file.');
            }
        }
    };

    // --- PERBAIKAN FUNGSI PENCARIAN ---
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            // Jika input pencarian kosong, kembali ke tampilan normal
            setIsSearchMode(false);
            fetchFiles(path);
            return;
        }
        setIsLoading(true);
        setIsSearchMode(true); // Masuk ke mode pencarian
        try {
            const formData = new FormData();
            formData.append('query', searchTerm);
            formData.append('path', path); // Cari di dalam path saat ini
            const response = await apiClient.post(`/files/${serverId}/search`, formData);
            setFiles(response.data.results || []);
        } catch (err) {
            setError('Pencarian gagal.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <AppNavbar />
            <Container fluid>
                <Row className="align-items-center mb-3">
                    <Col><h1>File Manager</h1></Col>
                    <Col className="d-flex justify-content-end gap-2">
                        <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} multiple />
                        <Button variant="primary" onClick={() => fileInputRef.current.click()}>📤 Upload</Button>
                        <Button variant="danger" onClick={() => handleDelete(Array.from(selectedFiles))} disabled={selectedFiles.size === 0}>🗑️ Hapus Pilihan</Button>
                    </Col>
                </Row>

                {uploadProgress > 0 && <ProgressBar animated now={uploadProgress} label={`${uploadProgress}%`} className="mb-3" />}

                <Card className="shadow-sm">
                    <Card.Header>
                        <Row className="align-items-center">
                            <Col md={6}><FileBreadcrumb path={path} onNavigate={handleNavigate} /></Col>
                            <Col md={6}>
                                <Form onSubmit={handleSearch} className="d-flex">
                                    <Form.Control 
                                        type="search" 
                                        placeholder="Cari file di direktori ini..." 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Button type="submit" variant="outline-primary" className="ms-2">Cari</Button>
                                </Form>
                            </Col>
                        </Row>
                    </Card.Header>
                    <Card.Body>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {isLoading ? (
                            <div className="text-center p-5"><Spinner animation="border" /></div>
                        ) : (
                            <ListGroup>
                                <ListGroup.Item className="d-flex align-items-center bg-light">
                                    <Form.Check inline type="checkbox" onChange={handleSelectAll} checked={files.length > 0 && selectedFiles.size === files.length} />
                                    <span>Pilih Semua</span>
                                </ListGroup.Item>
                                {files.length === 0 ? <p className="text-muted text-center p-3">Tidak ada file ditemukan.</p> :
                                files.map((item) => (
                                    <FileItem 
                                        key={item.path} 
                                        item={item}
                                        isSelected={selectedFiles.has(item.path)}
                                        onSelect={handleSelect}
                                        onNavigate={handleNavigate}
                                        onPreview={handlePreview}
                                        onDelete={handleDelete}
                                        onRename={(p, n) => openModal('rename', { oldPath: p, newName: n, name: n })}
                                    />
                                ))}
                            </ListGroup>
                        )}
                    </Card.Body>
                </Card>
            </Container>

            <Modal show={modal.type === 'rename'} onHide={() => openModal(null)} centered>
                <Modal.Header closeButton><Modal.Title>Ganti Nama</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleRename}>
                        <Form.Group>
                            <Form.Label>Nama baru untuk: <strong>{modal.data?.name}</strong></Form.Label>
                            <Form.Control 
                                type="text"
                                defaultValue={modal.data?.name}
                                onChange={(e) => setModal(prev => ({ ...prev, data: { ...prev.data, newName: e.target.value } }))}
                                autoFocus required
                            />
                        </Form.Group>
                        <Button type="submit" className="mt-3">Simpan</Button>
                    </Form>
                </Modal.Body>
            </Modal>
            
            <Modal show={modal.type === 'preview'} onHide={() => openModal(null)} size="lg" centered>
                <Modal.Header closeButton><Modal.Title>{modal.data?.title}</Modal.Title></Modal.Header>
                <Modal.Body><pre style={{ maxHeight: '60vh', overflowY: 'auto' }}>{modal.data?.content}</pre></Modal.Body>
            </Modal>
        </>
    );
}

export default FileManager;