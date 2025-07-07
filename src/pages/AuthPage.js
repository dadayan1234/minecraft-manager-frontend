import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axiosConfig';
import { Form, Button, Container, Alert, Card, Spinner } from 'react-bootstrap';

const AuthPage = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [isTyping, setIsTyping] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    // Validation functions
    const validateUsername = (username) => {
        const errors = [];
        if (username.length < 3) errors.push("Username minimal 3 karakter");
        if (username.length > 20) errors.push("Username maksimal 20 karakter");
        if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.push("Username hanya boleh mengandung huruf, angka, dan underscore");
        if (/^[0-9]/.test(username)) errors.push("Username tidak boleh dimulai dengan angka");
        return errors;
    };

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 6) errors.push("Password minimal 6 karakter");
        if (password.length > 50) errors.push("Password maksimal 50 karakter");
        if (!/(?=.*[a-z])/.test(password)) errors.push("Password harus mengandung huruf kecil");
        if (!/(?=.*[A-Z])/.test(password)) errors.push("Password harus mengandung huruf besar");
        if (!/(?=.*[0-9])/.test(password)) errors.push("Password harus mengandung angka");
        return errors;
    };

    // Real-time validation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isTyping) {
                const errors = {};
                if (username) {
                    const usernameErrors = validateUsername(username);
                    if (usernameErrors.length > 0) errors.username = usernameErrors;
                }
                if (password && !isLoginMode) {
                    const passwordErrors = validatePassword(password);
                    if (passwordErrors.length > 0) errors.password = passwordErrors;
                }
                setValidationErrors(errors);
                setIsTyping(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username, password, isLoginMode, isTyping]);

    const handleLogin = async (e) => {
        e.preventDefault();
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await apiClient.post('/token', formData);
            login(response.data.access_token);
            navigate('/');
        } catch (err) {
            setError('Login gagal. Periksa kembali username dan password.');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validate before submit
        const usernameErrors = validateUsername(username);
        const passwordErrors = validatePassword(password);
        
        if (usernameErrors.length > 0 || passwordErrors.length > 0) {
            setValidationErrors({
                username: usernameErrors,
                password: passwordErrors
            });
            return;
        }

        try {
            await apiClient.post('/register', { username, password });
            setSuccess('Registrasi berhasil! Silakan login.');
            setIsLoginMode(true);
            setError('');
            setValidationErrors({});
        } catch (err) {
            setError(err.response?.data?.detail || 'Registrasi gagal. Coba username lain.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (isLoginMode) {
            handleLogin(e).finally(() => setIsLoading(false));
        } else {
            handleRegister(e).finally(() => setIsLoading(false));
        }
    };

    const switchModeHandler = () => {
        setIsLoginMode(prevMode => !prevMode);
        setError('');
        setSuccess('');
        setUsername('');
        setPassword('');
        setValidationErrors({});
    };

    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
        setIsTyping(true);
    };

    const isFormValid = () => {
        if (isLoginMode) return username && password;
        return username && password && 
               Object.keys(validationErrors).length === 0 && 
               validateUsername(username).length === 0 && 
               validatePassword(password).length === 0;
    };

    return (
        <div className="auth-container">
            <style jsx>{`
                .auth-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    position: relative;
                    overflow: hidden;
                }

                .auth-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="10" cy="80" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                    animation: float 20s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                .auth-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    width: 100%;
                    max-width: 420px;
                    position: relative;
                    overflow: hidden;
                    animation: slideIn 0.6s ease-out;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .auth-header {
                    text-align: center;
                    padding: 30px 0 20px;
                    position: relative;
                }

                .auth-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 0.5rem;
                }

                .auth-subtitle {
                    color: #6c757d;
                    font-size: 1.1rem;
                    margin-bottom: 0;
                }

                .form-floating {
                    position: relative;
                    margin-bottom: 1.5rem;
                }

                .form-control-modern {
                    background: rgba(248, 249, 250, 0.8);
                    border: 2px solid #e9ecef;
                    border-radius: 12px;
                    padding: 15px;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    width: 100%;
                }

                .form-control-modern:focus {
                    background: rgba(255, 255, 255, 0.9);
                    border-color: #667eea;
                    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                    outline: none;
                }

                .form-control-modern.is-invalid {
                    border-color: #dc3545;
                }

                .form-control-modern.is-valid {
                    border-color: #28a745;
                }

                .btn-primary-modern {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 12px;
                    padding: 15px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .btn-primary-modern:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                }

                .btn-primary-modern:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-link-modern {
                    color: #667eea;
                    text-decoration: none;
                    font-weight: 500;
                    padding: 10px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    background: transparent;
                    border: none;
                }

                .btn-link-modern:hover {
                    color: #764ba2;
                    background: rgba(102, 126, 234, 0.1);
                }

                .validation-errors {
                    margin-top: 5px;
                    padding: 8px 12px;
                    background: rgba(220, 53, 69, 0.1);
                    border-radius: 8px;
                    border-left: 3px solid #dc3545;
                }

                .validation-error {
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .validation-error::before {
                    content: "•";
                    color: #dc3545;
                }

                .mode-switch {
                    text-align: center;
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                }

                .spinner-border-sm {
                    width: 1rem;
                    height: 1rem;
                }

                .alert-modern {
                    border: none;
                    border-radius: 12px;
                    padding: 15px;
                    margin-bottom: 20px;
                }

                .alert-danger {
                    background: rgba(220, 53, 69, 0.1);
                    color: #dc3545;
                    border-left: 4px solid #dc3545;
                }

                .alert-success {
                    background: rgba(40, 167, 69, 0.1);
                    color: #28a745;
                    border-left: 4px solid #28a745;
                }

                .input-group {
                    position: relative;
                }

                .input-icon {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6c757d;
                    z-index: 5;
                }

                .form-control-with-icon {
                    padding-left: 45px;
                }
            `}</style>

            <Card className="auth-card">
                <Card.Body className="p-4">
                    <div className="auth-header">
                        <h1 className="auth-title">🎮 CraftPanel</h1>
                        <p className="auth-subtitle">
                            {isLoginMode ? 'Masuk ke panel kontrol Minecraft' : 'Buat akun baru'}
                        </p>
                    </div>
                    
                    {error && (
                        <Alert className="alert-modern alert-danger">
                            <strong>❌ Error:</strong> {error}
                        </Alert>
                    )}
                    
                    {success && (
                        <Alert className="alert-modern alert-success">
                            <strong>✅ Berhasil:</strong> {success}
                        </Alert>
                    )}
                    
                    <Form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <span className="input-icon">👤</span>
                            <Form.Control
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={handleInputChange(setUsername)}
                                className={`form-control-modern form-control-with-icon ${
                                    validationErrors.username ? 'is-invalid' : 
                                    username && !validationErrors.username ? 'is-valid' : ''
                                }`}
                                required
                            />
                        </div>
                        
                        {validationErrors.username && (
                            <div className="validation-errors">
                                {validationErrors.username.map((error, index) => (
                                    <p key={index} className="validation-error">{error}</p>
                                ))}
                            </div>
                        )}

                        <div className="input-group">
                            <span className="input-icon">🔒</span>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={handleInputChange(setPassword)}
                                className={`form-control-modern form-control-with-icon ${
                                    validationErrors.password ? 'is-invalid' : 
                                    password && !isLoginMode && !validationErrors.password ? 'is-valid' : ''
                                }`}
                                required
                            />
                        </div>
                        
                        {validationErrors.password && !isLoginMode && (
                            <div className="validation-errors">
                                {validationErrors.password.map((error, index) => (
                                    <p key={index} className="validation-error">{error}</p>
                                ))}
                            </div>
                        )}

                        <div className="d-grid">
                            <Button
                                type="submit"
                                disabled={isLoading || !isFormValid()}
                                className="btn-primary-modern"
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner as="span" animation="border" size="sm" className="me-2" />
                                        {isLoginMode ? 'Masuk...' : 'Membuat Akun...'}
                                    </>
                                ) : (
                                    <>
                                        {isLoginMode ? '🚀 Masuk' : '✨ Buat Akun'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                    
                    <div className="mode-switch">
                        <Button
                            variant="link"
                            onClick={switchModeHandler}
                            className="btn-link-modern"
                        >
                            {isLoginMode ? 
                                "Belum punya akun? Daftar sekarang" : 
                                "Sudah punya akun? Masuk di sini"
                            }
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default AuthPage;