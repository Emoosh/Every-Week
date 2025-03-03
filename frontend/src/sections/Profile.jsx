import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { riotService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [riotInfo, setRiotInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch Riot information
    const fetchRiotInfo = async () => {
      setLoading(true);
      try {
        const data = await riotService.getRiotInfo();
        setRiotInfo(data);
      } catch (err) {
        setError('Failed to load Riot information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchRiotInfo();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      setError('Failed to logout');
    }
  };

  if (!isAuthenticated) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{user?.username || 'Gamer'}</h1>
              <p className="text-indigo-200">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 transition-colors px-4 py-2 rounded-md font-semibold text-white"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Player Stats Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-indigo-300">Oyuncu İstatistikleri</h2>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : riotInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-200">Riot Hesabı</h3>
                  <p>Kullanıcı Adı: {riotInfo.gameName || 'N/A'}</p>
                  <p>Tag: {riotInfo.tagLine || 'N/A'}</p>
                  <p>Seviye: {riotInfo.summonerLevel || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-200">Sıralama</h3>
                  <p>Solo/Duo: {riotInfo.rank?.soloRank || 'Unranked'}</p>
                  <p>Flex: {riotInfo.rank?.flexRank || 'Unranked'}</p>
                  <p>LP: {riotInfo.rank?.leaguePoints || '0'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Riot hesap bilgileri bulunamadı.</p>
            )}
          </div>

          {/* Tournament History */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-indigo-300">Turnuva Geçmişi</h2>
            <div className="bg-gray-700 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-600">
                <thead className="bg-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Turnuva
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Konum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Sonuç
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-700 divide-y divide-gray-600">
                  {/* Example data - replace with actual tournament history */}
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Weekly League Tournament</td>
                    <td className="px-6 py-4 whitespace-nowrap">10 Şubat 2025</td>
                    <td className="px-6 py-4 whitespace-nowrap">İstanbul</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        1. Sıra
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">Valorant Championship</td>
                    <td className="px-6 py-4 whitespace-nowrap">15 Ocak 2025</td>
                    <td className="px-6 py-4 whitespace-nowrap">Ankara</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        3. Sıra
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;