import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './sections/Navbar'
import Hero from './sections/Hero'
import About from "./sections/About.jsx";
import TournamentBracket from "./sections/Tournements.jsx";
import LoginRegisterPage from "./sections/Login.jsx";
import Profile from "./sections/Profile.jsx";
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Home page component that includes all landing page sections
const HomePage = () => {
  return (
    <>
      <Hero/>
      <About/>
      <TournamentBracket/>
    </>
  );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <main className="max-w-9xl mx-auto">
                    <Navbar/>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginRegisterPage />} />
                        <Route 
                          path="/profile" 
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          } 
                        />
                        {/* Fallback route - redirect to home */}
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </Router>
        </AuthProvider>
    )
}
export default App
