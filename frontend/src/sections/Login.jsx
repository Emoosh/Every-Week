import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";

// Animation variants
const formVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
};

const LoginRegisterPage = () => {
    const { login, register, isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // Redirect if already authenticated
    if (isAuthenticated && !loading) {
        return <Navigate to="/profile" />;
    }

    const toggleForm = () => {
        setIsRegister(!isRegister);
        setError('');
        setSuccess('');
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isRegister) {
                // Register user
                await register(
                    formData.username,
                    formData.email, 
                    formData.password
                );
                setSuccess('Kayıt başarılı! Giriş yapabilirsiniz.');
                setTimeout(() => {
                    setIsRegister(false);
                }, 1500);
            } else {
                // Login user
                await login(
                    formData.email,
                    formData.password
                );
                setSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
                // Navigate to profile after successful login
                setTimeout(() => {
                    navigate('/profile');
                }, 1000);
            }
        } catch (err) {
            setError(err.message || 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-indigo-900 relative overflow-hidden">
            {/* Arcade style background image */}
            <img
                src="/arcade-bg.png"
                alt="Arcade Background"
                className="absolute inset-0 object-cover opacity-20"
            />

            <div className="relative z-10 bg-gray-800 bg-opacity-75 backdrop-blur-md rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                <h1 className="text-4xl font-extrabold text-white mb-6 tracking-wider drop-shadow-lg">
                    E-SPORT ARENA
                </h1>

                {error && (
                    <div className="bg-red-500 bg-opacity-75 text-white p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500 bg-opacity-75 text-white p-3 rounded mb-4">
                        {success}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {isRegister ? (
                        <motion.div
                            key="register"
                            variants={formVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-4">Kayıt Ol</h2>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Kullanıcı Adı"
                                    className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Şifre"
                                    className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-bold disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'İşleniyor...' : 'Kayıt Ol'}
                                </button>
                            </form>
                            <p className="mt-4 text-gray-300">
                                Hesabınız var mı?{" "}
                                <button
                                    onClick={toggleForm}
                                    className="text-indigo-400 hover:underline"
                                >
                                    Giriş Yap
                                </button>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="login"
                            variants={formVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-4">Giriş Yap</h2>
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Şifre"
                                    className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-bold disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'İşleniyor...' : 'Giriş Yap'}
                                </button>
                            </form>
                            <p className="mt-4 text-gray-300">
                                Hesabınız yok mu?{" "}
                                <button
                                    onClick={toggleForm}
                                    className="text-indigo-400 hover:underline"
                                >
                                    Kayıt Ol
                                </button>
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LoginRegisterPage;
