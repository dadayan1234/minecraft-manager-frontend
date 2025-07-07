import React from 'react';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useServers } from '../context/ServerContext';
import './AppNavbar.css'; // Import CSS untuk styling modern

function AppNavbar() {
    const { logout } = useAuth();
    const { activeServer, clearActiveServer } = useServers();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        clearActiveServer();
        navigate('/login');
    };
    
    const handleServerSelection = () => {
        clearActiveServer();
        navigate('/');
    };

    return (
        <Navbar className="modern-navbar" expand="lg">
            <Container fluid className="px-4">
                <Navbar.Brand 
                    onClick={handleServerSelection} 
                    className="modern-brand"
                >
                    <span className="brand-icon">🎮</span>
                    <span className="brand-text">MC Manager</span>
                </Navbar.Brand>
                
                <Navbar.Toggle aria-controls="main-navbar-nav" className="modern-toggle" />
                
                <Navbar.Collapse id="main-navbar-nav">
                    <Nav className="nav-links">
                        {activeServer ? (
                            <>
                                <Nav.Link 
                                    as={NavLink} 
                                    to={`/dashboard/${activeServer.id}`} 
                                    end
                                    className="modern-nav-link"
                                >
                                    <span className="nav-icon">📊</span>
                                    Dashboard
                                </Nav.Link>
                                <Nav.Link 
                                    as={NavLink} 
                                    to={`/files/${activeServer.id}`}
                                    className="modern-nav-link"
                                >
                                    <span className="nav-icon">📁</span>
                                    File Manager
                                </Nav.Link>
                            </>
                        ) : (
                            <Nav.Link 
                                as={NavLink} 
                                to="/" 
                                end
                                className="modern-nav-link"
                            >
                                <span className="nav-icon">🎯</span>
                                Pilih Server
                            </Nav.Link>
                        )}
                        <Nav.Link 
                            as={NavLink} 
                            to="/settings"
                            className="modern-nav-link"
                        >
                            <span className="nav-icon">⚙️</span>
                            Settings
                        </Nav.Link>
                    </Nav>
                    
                    <Nav className="nav-actions">
                        {activeServer && (
                            <div className="server-info">
                                <span className="server-name">{activeServer.name}</span>
                                <span className="server-indicator"></span>
                            </div>
                        )}
                        
                        <Dropdown align="end">
                            <Dropdown.Toggle className="profile-dropdown" id="profile-dropdown">
                                <span className="profile-icon">👤</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="profile-menu">
                                <Dropdown.Item onClick={handleLogout} className="logout-item">
                                    <span className="dropdown-icon">🚪</span>
                                    Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default AppNavbar;