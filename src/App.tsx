import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import { AppStateProvider } from './context/AppStateContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { PageTransition } from './components/PageTransition';

// Page components
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import ValidationMapping from './pages/ValidationMapping';
import DataCleaning from './pages/DataCleaning';
import Preview from './pages/Preview';
import Export from './pages/Export';
import History from './pages/History';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import { LoginRegisterScreen } from './pages/LoginRegister';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  return (
    <AuthProvider>
      <AppStateProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth routes outside Layout */}
              <Route
                path="/login"
                element={
                  <PageTransition>
                    <LoginRegisterScreen />
                  </PageTransition>
                }
              />
              <Route
                path="/verifyemail"
                element={
                  <PageTransition>
                    <VerifyEmail />
                  </PageTransition>
                }
              />

              {/* Protected routes wrapped in Layout */}
              <Route element={<Layout />}>
                {/* Main routes */}
                <Route
                  path="/"
                  element={
                    <PageTransition>
                      <Dashboard />
                    </PageTransition>
                  }
                />
                <Route
                  path="/upload"
                  element={
                    <PageTransition>
                      <Upload />
                    </PageTransition>
                  }
                />
                <Route
                  path="/validationMapping"
                  element={
                    <PageTransition>
                      <ValidationMapping />
                    </PageTransition>
                  }
                />
                <Route
                  path="/dataCleaning"
                  element={
                    <PageTransition>
                      <DataCleaning />
                    </PageTransition>
                  }
                />
                <Route
                  path="/preview"
                  element={
                    <PageTransition>
                      <Preview />
                    </PageTransition>
                  }
                />
                <Route
                  path="/export"
                  element={
                    <PageTransition>
                      <Export />
                    </PageTransition>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <PageTransition>
                      <History />
                    </PageTransition>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PageTransition>
                      <Settings />
                    </PageTransition>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <PageTransition>
                      <Billing />
                    </PageTransition>
                  }
                />

                {/* Catch any unmatched routes and redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AppStateProvider>
    </AuthProvider>
  );
}

export default App;
