import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { riotService, gameAccountsService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [riotInfo, setRiotInfo] = useState(null);
  const [gameAccounts, setGameAccounts] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Oyun hesabı form state'leri
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    league: { gameName: '', tagLine: '' },
    valorant: { gameName: '', tagLine: '' }
  });

  useEffect(() => {
    // Fetch data when authenticated
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Riot information
        const riotData = await riotService.getRiotInfo();
        setRiotInfo(riotData);
        
        // Fetch user's game accounts
        try {
          const accountsData = await gameAccountsService.getGameAccounts();
          setGameAccounts(accountsData.accounts);
          
          // Populate form with existing data if available
          if (accountsData.accounts) {
            setAccountFormData({
              league: accountsData.accounts.league || { gameName: '', tagLine: '' },
              valorant: accountsData.accounts.valorant || { gameName: '', tagLine: '' }
            });
          }
        } catch (accountsErr) {
          console.log('No game accounts found', accountsErr);
          // Not setting error since this might be a first-time user
        }
        
        // Fetch match history
        try {
          const historyData = await gameAccountsService.getMatchHistory();
          setMatchHistory(historyData.matches || []);
        } catch (historyErr) {
          console.log('No match history found', historyErr);
          // Not setting error since this might be a first-time user
        }
      } catch (err) {
        setError('Failed to load profile data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
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
  
  // Oyun hesapları form işlemleri
  const handleAccountFormChange = (game, field, value) => {
    setAccountFormData({
      ...accountFormData,
      [game]: {
        ...accountFormData[game],
        [field]: value
      }
    });
  };
  
  const handleSaveGameAccounts = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Filter out completely empty accounts
      const accountsToSave = {};
      
      if (accountFormData.league.gameName || accountFormData.league.tagLine) {
        accountsToSave.league = accountFormData.league;
      }
      
      if (accountFormData.valorant.gameName || accountFormData.valorant.tagLine) {
        accountsToSave.valorant = accountFormData.valorant;
      }
      
      // Save accounts
      const result = await gameAccountsService.saveGameAccounts(accountsToSave);
      
      if (result.success) {
        setGameAccounts(result.accounts);
        setShowAccountForm(false);
      } else {
        setError(result.message || 'Failed to save game accounts');
      }
    } catch (err) {
      setError('Failed to save game accounts');
      console.error(err);
    } finally {
      setLoading(false);
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

          {/* Game Accounts Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-indigo-300">Oyun Hesaplarım</h2>
              <button 
                onClick={() => setShowAccountForm(!showAccountForm)}
                className="bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-md text-white"
              >
                {showAccountForm ? 'İptal' : gameAccounts ? 'Düzenle' : 'Hesap Ekle'}
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : showAccountForm ? (
              <div className="bg-gray-700 p-6 rounded-lg">
                <form onSubmit={handleSaveGameAccounts}>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-indigo-200">League of Legends</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-1">Oyun Adı</label>
                        <input
                          type="text"
                          value={accountFormData.league.gameName}
                          onChange={(e) => handleAccountFormChange('league', 'gameName', e.target.value)}
                          placeholder="BenimHesabım"
                          className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Tag</label>
                        <input
                          type="text"
                          value={accountFormData.league.tagLine}
                          onChange={(e) => handleAccountFormChange('league', 'tagLine', e.target.value)}
                          placeholder="TR1"
                          className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-indigo-200">Valorant</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-1">Oyun Adı</label>
                        <input
                          type="text"
                          value={accountFormData.valorant.gameName}
                          onChange={(e) => handleAccountFormChange('valorant', 'gameName', e.target.value)}
                          placeholder="BenimHesabım"
                          className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Tag</label>
                        <input
                          type="text"
                          value={accountFormData.valorant.tagLine}
                          onChange={(e) => handleAccountFormChange('valorant', 'tagLine', e.target.value)}
                          placeholder="TR1"
                          className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 transition-colors px-6 py-2 rounded-md text-white font-semibold"
                  >
                    {loading ? 'Kaydediliyor...' : 'Hesapları Kaydet'}
                  </button>
                </form>
              </div>
            ) : gameAccounts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gameAccounts.league && (
                  <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-lg font-semibold mb-2 text-indigo-200">League of Legends</h3>
                    {gameAccounts.league.gameName && (
                      <p><span className="text-gray-400">Oyun Adı:</span> {gameAccounts.league.gameName}</p>
                    )}
                    {gameAccounts.league.tagLine && (
                      <p><span className="text-gray-400">Tag:</span> {gameAccounts.league.tagLine}</p>
                    )}
                    {(!gameAccounts.league.gameName && !gameAccounts.league.tagLine) && (
                      <p className="text-gray-400 italic">Bilgi girilmemiş</p>
                    )}
                  </div>
                )}
                
                {gameAccounts.valorant && (
                  <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-red-500">
                    <h3 className="text-lg font-semibold mb-2 text-indigo-200">Valorant</h3>
                    {gameAccounts.valorant.gameName && (
                      <p><span className="text-gray-400">Oyun Adı:</span> {gameAccounts.valorant.gameName}</p>
                    )}
                    {gameAccounts.valorant.tagLine && (
                      <p><span className="text-gray-400">Tag:</span> {gameAccounts.valorant.tagLine}</p>
                    )}
                    {(!gameAccounts.valorant.gameName && !gameAccounts.valorant.tagLine) && (
                      <p className="text-gray-400 italic">Bilgi girilmemiş</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-300 mb-4">Henüz oyun hesabı eklenmemiş.</p>
                <p className="text-gray-400 mb-2">Turnuvalara katılmak için oyun hesaplarınızı eklemeniz gerekiyor.</p>
              </div>
            )}
          </div>
          
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