import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { ServerProvider } from './context/ServerContext';

// Components and Pages
import PrivateRoute from './components/PrivateRoute';
import AuthPage from './pages/AuthPage';
import ServerSelectionPage from './pages/ServerSelectionPage';
import Dashboard from './pages/Dashboard';
import FileManager from './pages/FileManager';
import SettingsPage from './pages/SettingsPage';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <AuthProvider>
      <ServerProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<ServerSelectionPage />} />
              <Route path="/dashboard/:serverId" element={<Dashboard />} />
              <Route path="/files/:serverId" element={<FileManager />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<h2 className="text-center mt-5">404: Page Not Found</h2>} />
          </Routes>
        </Router>
      </ServerProvider>
    </AuthProvider>
  );
}

export default App;