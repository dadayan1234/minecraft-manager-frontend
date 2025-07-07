import React from 'react';
import { ListGroup, Button, Col, Row, Form } from 'react-bootstrap';

function FileItem({ item, isSelected, onSelect, onNavigate, onPreview, onDelete, onRename }) {
    const isFolder = item.type === 'folder';

    const handleItemClick = (e) => {
        if (e.target.closest('button, input')) return; // Abaikan klik pada tombol atau input
        if (isFolder) onNavigate(item.path);
        else onPreview(item.path);
    };

    return (
        <ListGroup.Item as="div" action className={isSelected ? 'active' : ''} onClick={handleItemClick} style={{ cursor: 'pointer' }}>
            <Row className="align-items-center">
                <Col xs="auto" onClick={(e) => e.stopPropagation()}>
                    <Form.Check
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(item.path)}
                    />
                </Col>
                <Col>
                    <span className="me-2">{item.icon}</span>
                    <span className="fw-bold">{item.name}</span>
                </Col>
                <Col md="auto" className="d-none d-md-block">
                    <small className="text-muted">{item.modified ? new Date(item.modified).toLocaleString() : ''}</small>
                </Col>
                <Col md="auto" className="d-none d-md-block">
                    <small>{!isFolder && item.size_formatted}</small>
                </Col>
                <Col xs="auto" onClick={(e) => e.stopPropagation()}>
                    {!isFolder && <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => onPreview(item.path)}>👁️</Button>}
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => onRename(item.path, item.name)}>✏️</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => onDelete(item.path)}>🗑️</Button>
                </Col>
            </Row>
        </ListGroup.Item>
    );
}

export default FileItem;