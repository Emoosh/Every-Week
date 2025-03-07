import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { isAuthenticated, user, logout } = useAuth();
    
    // Debug için kullanıcı bilgilerini konsola yaz
    console.log("Navbar render - User:", user);
    console.log("Navbar render - isAuthenticated:", isAuthenticated);
    console.log("User role:", user?.role);
    console.log("Role check:", user && user.role === 'admin');

    // Define navigation based on authentication status and role
    const navigation = [
        { name: 'Ana Sayfa', to: '/' },
        { name: 'Turnuvalar', to: '/#tournaments' },
    ];

    if (isAuthenticated) {
        navigation.push({ name: 'Okul Turnuvaları', to: '/tournaments' });
        navigation.push({ name: 'Profil', to: '/profile' });
        
        // Admin specific links - daha esnek kontrol
        const isAdmin = user && 
                       (user.role === 'admin' || 
                        user.role === 'Admin' || 
                        (typeof user.role === 'string' && user.role.toLowerCase() === 'admin'));
        
        console.log("Is admin check:", isAdmin);
        
        if (isAdmin) {
            console.log("Admin menüleri ekleniyor");
            navigation.push({ name: 'Okul Yetkilileri', to: '/admin/school-agents' });
            navigation.push({ name: 'Öğrenci Yönetimi', to: '/admin/students' });
        }
    }

    const handleLogout = async () => {
        await logout();
        setMobileMenuOpen(false);
    };

    return (
        <header className="fixed inset-x-0 top-0 z-50">
            <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8 backdrop-blur-md">
                <div className="flex lg:flex-1">
                    <Link to="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">E-SPORT ARENA</span>
                        <img
                            alt="E-SPORT ARENA"
                            src="/vite.svg"
                            className="h-8 w-auto"
                        />
                    </Link>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="h-6 w-6" />
                    </button>
                </div>
                <div className="hidden lg:flex lg:gap-x-12">
                    {navigation.map((item) => (
                        <Link 
                            key={item.name} 
                            to={item.to} 
                            className="text-xl font-semibold leading-6 navbar_text_color hover:text-indigo-400 transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    {isAuthenticated ? (
                        <button 
                            onClick={handleLogout}
                            className="text-xl font-semibold leading-6 navbar_text_color hover:text-red-400 transition-colors"
                        >
                            Çıkış Yap
                        </button>
                    ) : (
                        <Link 
                            to="/login" 
                            className="text-xl font-semibold leading-6 navbar_text_color hover:text-indigo-400 transition-colors"
                        >
                            Oturum Aç
                        </Link>
                    )}
                </div>
            </nav>
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-50" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-800">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
                            <span className="sr-only">E-SPORT ARENA</span>
                            <img
                                alt="E-SPORT ARENA"
                                src="/vite.svg"
                                className="h-8 w-auto"
                            />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-300"
                        >
                            <span className="sr-only">Menüyü kapat</span>
                            <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-700">
                            <div className="space-y-2 py-6">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        to={item.to}
                                        className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 navbar_text_color hover:bg-gray-800"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                            <div className="py-6">
                                {isAuthenticated ? (
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-400 hover:bg-gray-800 w-full text-left"
                                    >
                                        Çıkış Yap
                                    </button>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 navbar_text_color hover:bg-gray-800"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Oturum Aç
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}