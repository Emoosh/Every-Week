import React, { useEffect, useState } from 'react';
import { profileService } from '../services/api';
import { useNavigate } from 'react-router-dom';
// Debugging için console.log eklemeleri yapıyoruz

const UserProfileView = ({ userId }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        setError('Kullanıcı ID\'si belirtilmedi');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Profil verisi isteniyor, userId:', userId);
        const response = await profileService.getPublicProfile(userId);
        console.log('API Yanıtı:', response);
        
        if (response.success && response.profile) {
          setProfileData(response.profile);
          console.log('Maç geçmişi:', 
            response.profile.recentMatches?.league?.length || 0, 'LoL maçı,',
            response.profile.recentMatches?.valorant?.length || 0, 'Valorant maçı');
        } else {
          console.error('Profil verisi boş veya başarısız:', response);
          setError('Profil bilgileri bulunamadı');
        }
      } catch (err) {
        console.error('Profile view error:', err);
        setError('Profil bilgileri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  // Navigate to home on back button click
  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-100 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-3">Hata</h2>
          <p>{error}</p>
          <button
            onClick={handleBackClick}
            className="mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
        <div className="bg-gray-800 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-3">Kullanıcı Bulunamadı</h2>
          <p>Aradığınız kullanıcı profili bulunamadı.</p>
          <button
            onClick={handleBackClick}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const { user, gameAccounts, riotInfo, recentMatches } = profileData;
  const leagueMatches = recentMatches?.league || [];
  const valorantMatches = recentMatches?.valorant || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Profile Header with Back Button */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleBackClick}
                className="mr-4 bg-gray-700 bg-opacity-50 hover:bg-opacity-70 p-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold">{user?.username || 'Gamer'}</h1>
                <p className="text-indigo-200">{user?.schoolName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {/* Game Accounts Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-indigo-300">Oyun Hesapları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gameAccounts?.league && (
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
              
              {gameAccounts?.valorant && (
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
              
              {(!gameAccounts?.league && !gameAccounts?.valorant) && (
                <div className="bg-gray-700 p-4 rounded-lg col-span-2">
                  <p className="text-gray-400 italic">Oyun hesabı bilgisi bulunamadı</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Player Stats Section */}
          {riotInfo && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-indigo-300">Oyuncu İstatistikleri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-200">Riot Hesabı</h3>
                  <p>Kullanıcı Adı: {riotInfo.gameName || 'N/A'}</p>
                  <p>Tag: {riotInfo.tagLine || 'N/A'}</p>
                  <p>Seviye: {riotInfo.summonerLevel || 'N/A'}</p>
                </div>
                
                {riotInfo.rank && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2 text-indigo-200">Sıralama</h3>
                    <p>Solo/Duo: {riotInfo.rank?.soloRank || 'Unranked'}</p>
                    <p>Flex: {riotInfo.rank?.flexRank || 'Unranked'}</p>
                    <p>LP: {riotInfo.rank?.leaguePoints || '0'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* League of Legends Match History */}
          {leagueMatches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-indigo-300">League of Legends Son Maçlar</h2>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {leagueMatches.map((match, index) => (
                    <div 
                      key={`league-${index}`} 
                      className={`border-l-4 ${match.matchData?.win ? 'border-green-500' : 'border-red-500'} p-4 bg-gray-800 rounded-lg shadow`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">League of Legends</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${match.matchData?.win ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                          {match.matchData?.win ? 'Zafer' : 'Mağlubiyet'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-400">Şampiyon:</p>
                          <p>{match.matchData?.champion || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">KDA:</p>
                          <p>{match.matchData?.kills || 0}/{match.matchData?.deaths || 0}/{match.matchData?.assists || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">CS:</p>
                          <p>{match.matchData?.cs || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Süre:</p>
                          <p>{match.matchData?.gameDuration ? `${Math.floor(match.matchData.gameDuration / 60)}:${(match.matchData.gameDuration % 60).toString().padStart(2, '0')}` : 'N/A'}</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(match.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Valorant Match History */}
          {valorantMatches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-indigo-300">Valorant Son Maçlar</h2>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {valorantMatches.map((match, index) => (
                    <div 
                      key={`valorant-${index}`} 
                      className={`border-l-4 ${match.matchData?.win ? 'border-green-500' : 'border-red-500'} p-4 bg-gray-800 rounded-lg shadow`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Valorant</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${match.matchData?.win ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                          {match.matchData?.win ? 'Zafer' : 'Mağlubiyet'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-gray-400">Ajan:</p>
                          <p>{match.matchData?.agent || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">KDA:</p>
                          <p>{match.matchData?.kills || 0}/{match.matchData?.deaths || 0}/{match.matchData?.assists || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Skor:</p>
                          <p>{match.matchData?.score || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Harita:</p>
                          <p>{match.matchData?.map || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(match.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* No Matches Message */}
          {leagueMatches.length === 0 && valorantMatches.length === 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-indigo-300">Son Maçlar</h2>
              <p className="text-gray-400 bg-gray-700 p-4 rounded-lg">Bu kullanıcı için kaydedilmiş maç geçmişi bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;