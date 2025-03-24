import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Navbar from './sections/Navbar'
import Hero from './sections/Hero'
import About from "./sections/About.jsx";
import TournamentBracket from "./sections/Tournements.jsx";
import LoginRegisterPage from "./sections/Login.jsx";
import Profile from "./sections/Profile.jsx";
import TournamentCreate from "./components/TournamentCreate.jsx";
import TournamentList from "./components/TournamentList.jsx";
import SchoolAgentsList from "./components/SchoolAgentsList.jsx";
import StudentsList from "./components/StudentsList.jsx";
import UserProfileView from "./components/UserProfileView.jsx";
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

// User profile wrapper to extract userId from URL params
const UserProfileWrapper = () => {
  const { userId } = useParams();
  return <UserProfileView userId={userId} />;
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
                        <Route 
                          path="/tournaments" 
                          element={
                            <ProtectedRoute>
                              <TournamentList />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/tournament/create" 
                          element={
                            <ProtectedRoute>
                              <TournamentCreate />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/school-agents" 
                          element={
                            <ProtectedRoute>
                              <SchoolAgentsList />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/admin/students" 
                          element={
                            <ProtectedRoute>
                              <StudentsList />
                            </ProtectedRoute>
                          } 
                        />
                        {/* User Profile View - accessible when authenticated */}
                        <Route 
                          path="/user/:userId" 
                          element={
                            <ProtectedRoute>
                              <UserProfileWrapper />
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
