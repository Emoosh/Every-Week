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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Oyun hesabı form state'leri
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    league: { gameName: '', tagLine: '' },
    valorant: { gameName: '', tagLine: '' }
  });

  // Maç geçmişini manuel olarak güncelleme
  const handleRefreshMatchHistory = async () => {
    if (!gameAccounts?.league?.gameName || !gameAccounts?.league?.tagLine) {
      setError("Oyun hesap bilgileri eksik. Önce hesap bilgilerinizi ekleyin.");
      return;
    }
    
    setRefreshing(true);
    setError(null);
    
    try {
      // Riot API'den maç geçmişini güncelle
      const result = await riotService.updateMatchHistory(
        gameAccounts.league.gameName,
        gameAccounts.league.tagLine
      );
      
      if (result.success) {
        // Güncellenen maç geçmişini al
        const historyData = await gameAccountsService.getMatchHistory();
        setMatchHistory(historyData.matches || []);
        setLastUpdated(result.lastUpdated || new Date());
      } else {
        setError("Maç geçmişi güncellenirken bir hata oluştu: " + (result.error || ""));
      }
    } catch (err) {
      setError("Maç geçmişi güncellenemedi");
      console.error("Match history refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch data when authenticated
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isAuthenticated) return;
      
      setLoading(true);
      try {
        // Fetch all data concurrently with Promise.all
        const [riotData, accountsData, historyData] = await Promise.all([
          riotService.getRiotInfo().catch(err => {
            console.log('No Riot info found', err);
            return null;
          }),
          gameAccountsService.getGameAccounts().catch(err => {
            console.log('No game accounts found', err);
            return { accounts: null };
          }),
          gameAccountsService.getMatchHistory().catch(err => {
            console.error('Maç geçmişi alınamadı:', err);
            return { matches: [] };
          })
        ]);
        
        // Only update state if component is still mounted
        if (!isMounted) return;
        
        // Update state with the fetched data
        if (riotData) {
          setRiotInfo(riotData);
          setLastUpdated(riotData.lastUpdated || null);
        }
        
        if (accountsData?.accounts) {
          setGameAccounts(accountsData.accounts);
          
          // Populate form with existing data if available
          setAccountFormData({
            league: accountsData.accounts.league || { gameName: '', tagLine: '' },
            valorant: accountsData.accounts.valorant || { gameName: '', tagLine: '' }
          });
        }
        
        if (historyData?.matches) {
          setMatchHistory(historyData.matches || []);
          if (historyData.lastUpdated) {
            setLastUpdated(historyData.lastUpdated);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load profile data');
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
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
    <div className="min-h-screen py-12 px-4 text-gray-100">
      <div className="max-w-4xl mx-auto arcade-card">
        {/* Profile Header */}
        <div className="animated-gradient bg-gradient-to-r from-purple-800 via-violet-700 to-indigo-800 p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold arcade-text neon-text mb-2">{user?.username || 'PLAYER_1'}</h1>
              <div className="flex items-center mt-2">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse mr-2"></div>
                <p className="text-cyan-200 font-medium">{user?.email}</p>
              </div>
              {user?.schoolName && (
                <div className="flex items-center mt-2">
                  <div className="h-6 w-6 mr-2 text-indigo-300">🏫</div>
                  <p className="text-indigo-300 font-medium">{user?.schoolName}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="arcade-button bg-gradient-to-r from-red-600 to-pink-600"
            >
              LOG OUT
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8">
          {error && (
            <div className="p-4 rounded mb-6 retro-border bg-red-900 bg-opacity-30">
              <div className="flex items-center">
                <div className="text-2xl mr-2">⚠️</div>
                <p className="text-red-200 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Game Accounts Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold arcade-text text-cyan-400 text-shadow">GAME ACCOUNTS</h2>
              <button 
                onClick={() => setShowAccountForm(!showAccountForm)}
                className="arcade-button text-sm"
              >
                {showAccountForm ? 'CANCEL' : gameAccounts ? 'EDIT' : 'ADD ACCOUNT'}
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="loading-animation h-16 w-16"></div>
              </div>
            ) : showAccountForm ? (
              <div className="arcade-card p-6">
                <form onSubmit={handleSaveGameAccounts}>
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <div className="text-xl mr-2">🎮</div>
                      <h3 className="text-lg font-semibold text-cyan-300">League of Legends</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-indigo-200 mb-2 text-sm">Game Name</label>
                        <input
                          type="text"
                          value={accountFormData.league.gameName}
                          onChange={(e) => handleAccountFormChange('league', 'gameName', e.target.value)}
                          placeholder="YourGameName"
                          className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-indigo-600 focus:border-cyan-400 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-indigo-200 mb-2 text-sm">Tag</label>
                        <input
                          type="text"
                          value={accountFormData.league.tagLine}
                          onChange={(e) => handleAccountFormChange('league', 'tagLine', e.target.value)}
                          placeholder="TR1"
                          className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-indigo-600 focus:border-cyan-400 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <div className="text-xl mr-2">🎯</div>
                      <h3 className="text-lg font-semibold text-pink-300">Valorant</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-indigo-200 mb-2 text-sm">Game Name</label>
                        <input
                          type="text"
                          value={accountFormData.valorant.gameName}
                          onChange={(e) => handleAccountFormChange('valorant', 'gameName', e.target.value)}
                          placeholder="YourGameName"
                          className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-pink-600 focus:border-cyan-400 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-indigo-200 mb-2 text-sm">Tag</label>
                        <input
                          type="text"
                          value={accountFormData.valorant.tagLine}
                          onChange={(e) => handleAccountFormChange('valorant', 'tagLine', e.target.value)}
                          placeholder="TR1"
                          className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-pink-600 focus:border-cyan-400 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={loading}
                    className="arcade-button bg-gradient-to-r from-green-600 to-emerald-500"
                  >
                    {loading ? 'SAVING...' : 'SAVE ACCOUNTS'}
                  </button>
                </form>
              </div>
            ) : gameAccounts ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gameAccounts.league && (
                  <div className="game-card bg-gradient-to-br from-slate-800 to-indigo-950 p-5">
                    <div className="flex items-center mb-3">
                      <img src="https://universe.leagueoflegends.com/images/LOL_LOGO.png" alt="League of Legends" className="h-8 w-auto mr-3" />
                      <h3 className="text-lg font-semibold neon-text text-blue-300">League of Legends</h3>
                    </div>
                    <div className="bg-slate-900 bg-opacity-50 p-4 rounded-md">
                      {gameAccounts.league.gameName && (
                        <div className="mb-2">
                          <span className="text-indigo-400 text-sm">SUMMONER NAME:</span>
                          <p className="text-cyan-100 font-semibold">{gameAccounts.league.gameName}</p>
                        </div>
                      )}
                      {gameAccounts.league.tagLine && (
                        <div className="mb-2">
                          <span className="text-indigo-400 text-sm">TAG:</span>
                          <p className="text-cyan-100 font-semibold">#{gameAccounts.league.tagLine}</p>
                        </div>
                      )}
                      {(!gameAccounts.league.gameName && !gameAccounts.league.tagLine) && (
                        <p className="text-gray-400 italic">No information provided</p>
                      )}
                    </div>
                  </div>
                )}
                
                {gameAccounts.valorant && (
                  <div className="game-card bg-gradient-to-br from-slate-800 to-rose-950 p-5">
                    <div className="flex items-center mb-3">
                      <img src="https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8e4c0863e119e2f3/634ef3e5dfb2b25a75493f5c/Val_Ep5A3_Social_Twitter_Profile.jpg" alt="Valorant" className="h-8 w-auto mr-3 rounded" />
                      <h3 className="text-lg font-semibold neon-text text-red-300">Valorant</h3>
                    </div>
                    <div className="bg-slate-900 bg-opacity-50 p-4 rounded-md">
                      {gameAccounts.valorant.gameName && (
                        <div className="mb-2">
                          <span className="text-pink-400 text-sm">AGENT NAME:</span>
                          <p className="text-pink-100 font-semibold">{gameAccounts.valorant.gameName}</p>
                        </div>
                      )}
                      {gameAccounts.valorant.tagLine && (
                        <div className="mb-2">
                          <span className="text-pink-400 text-sm">TAG:</span>
                          <p className="text-pink-100 font-semibold">#{gameAccounts.valorant.tagLine}</p>
                        </div>
                      )}
                      {(!gameAccounts.valorant.gameName && !gameAccounts.valorant.tagLine) && (
                        <p className="text-gray-400 italic">No information provided</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="arcade-card p-8 text-center">
                <div className="text-5xl mb-4">🎮</div>
                <h3 className="text-xl font-bold text-cyan-300 mb-3">No Game Accounts Yet!</h3>
                <p className="text-indigo-200 mb-6">Link your game accounts to participate in tournaments.</p>
                <button 
                  onClick={() => setShowAccountForm(true)}
                  className="arcade-button text-sm"
                >
                  ADD GAME ACCOUNT
                </button>
              </div>
            )}
          </div>
          
          {/* Player Stats Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold arcade-text text-cyan-400 text-shadow mb-6">PLAYER STATS</h2>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="loading-animation h-16 w-16"></div>
              </div>
            ) : riotInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="arcade-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 0C8.059 0 0 8.059 0 18s8.059 18 18 18 18-8.059 18-18S27.941 0 18 0zm0 30c-6.627 0-12-5.373-12-12S11.373 6 18 6s12 5.373 12 12-5.373 12-12 12z" fill="currentColor" className="text-cyan-400"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-4 text-cyan-300 arcade-text">RIOT ACCOUNT</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-baseline">
                      <span className="text-indigo-400 text-sm w-1/3">USERNAME:</span>
                      <span className="text-cyan-100 font-semibold">{riotInfo.gameName || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-baseline">
                      <span className="text-indigo-400 text-sm w-1/3">TAG:</span>
                      <span className="text-cyan-100 font-semibold">{riotInfo.tagLine ? `#${riotInfo.tagLine}` : 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-baseline">
                      <span className="text-indigo-400 text-sm w-1/3">LEVEL:</span>
                      <span className="text-cyan-100 font-semibold">{riotInfo.summonerLevel || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="arcade-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
                    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M33 6h-6V3c0-1.657-1.343-3-3-3H12C10.343 0 9 1.343 9 3v3H3C1.343 6 0 7.343 0 9v24c0 1.657 1.343 3 3 3h30c1.657 0 3-1.343 3-3V9c0-1.657-1.343-3-3-3zM12 3h12v3H12V3zm21 30H3V9h6h18h6v24z" fill="currentColor" className="text-pink-400"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-4 text-pink-300 arcade-text">RANKING</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-baseline">
                      <span className="text-indigo-400 text-sm w-1/3">SOLO/DUO:</span>
                      <div className="flex items-center">
                        {riotInfo.rank?.soloRank ? (
                          <>
                            <div className="bg-gradient-to-r from-yellow-500 to-amber-600 w-4 h-4 rounded-full mr-2"></div>
                            <span className="text-cyan-100 font-semibold">{riotInfo.rank.soloRank}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">Unranked</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-baseline">
                      <span className="text-indigo-400 text-sm w-1/3">FLEX:</span>
                      <div className="flex items-center">
                        {riotInfo.rank?.flexRank ? (
                          <>
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 w-4 h-4 rounded-full mr-2"></div>
                            <span className="text-cyan-100 font-semibold">{riotInfo.rank.flexRank}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">Unranked</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-baseline">
                      <span className="text-indigo-400 text-sm w-1/3">LP:</span>
                      <span className="text-cyan-100 font-semibold">{riotInfo.rank?.leaguePoints || '0'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="arcade-card p-8 text-center">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-cyan-300 mb-3">No Stats Available</h3>
                <p className="text-indigo-200">Add your game accounts to see your stats here.</p>
              </div>
            )}
          </div>
          
          {/* Match History Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold arcade-text text-cyan-400 text-shadow">MATCH HISTORY</h2>
              {gameAccounts && gameAccounts.league && (
                <button 
                  onClick={handleRefreshMatchHistory}
                  disabled={loading || refreshing}
                  className="arcade-button text-sm flex items-center"
                >
                  {refreshing ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
                      UPDATING...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      REFRESH MATCHES
                    </>
                  )}
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="loading-animation h-16 w-16"></div>
              </div>
            ) : matchHistory && matchHistory.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {matchHistory.map((match, index) => (
                    <div 
                      key={index} 
                      className={`game-card p-4 relative overflow-hidden ${match.matchData?.win ? 'bg-gradient-to-br from-slate-800 to-green-950' : 'bg-gradient-to-br from-slate-800 to-red-950'}`}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          {match.gameType === 'league' && (
                            <img 
                              src={`https://ddragon.leagueoflegends.com/cdn/13.9.1/img/champion/${match.matchData?.champion || 'Aatrox'}.png`} 
                              alt={match.matchData?.champion} 
                              className="h-10 w-10 rounded-full mr-3 bg-indigo-900 p-0.5"
                              onError={(e) => { e.target.src = 'https://ddragon.leagueoflegends.com/cdn/13.9.1/img/champion/Aatrox.png'; }}
                            />
                          )}
                          <h3 className="font-semibold">
                            {match.matchData?.champion || 'Champion'}
                          </h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${match.matchData?.win ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'}`}>
                          {match.matchData?.win ? 'VICTORY' : 'DEFEAT'}
                        </div>
                      </div>
                      
                      <div className="bg-slate-900 bg-opacity-50 p-3 rounded-md mb-2">
                        <div className="flex justify-between items-center">
                          <div className="text-center px-2 py-1">
                            <div className="text-lg font-bold text-cyan-300">{match.matchData?.kills || 0}</div>
                            <div className="text-xs text-cyan-500">KILLS</div>
                          </div>
                          <div className="text-center px-2 py-1">
                            <div className="text-lg font-bold text-red-300">{match.matchData?.deaths || 0}</div>
                            <div className="text-xs text-red-500">DEATHS</div>
                          </div>
                          <div className="text-center px-2 py-1">
                            <div className="text-lg font-bold text-yellow-300">{match.matchData?.assists || 0}</div>
                            <div className="text-xs text-yellow-500">ASSISTS</div>
                          </div>
                          <div className="text-center px-2 py-1">
                            <div className="text-lg font-bold text-indigo-300">{match.matchData?.cs || 0}</div>
                            <div className="text-xs text-indigo-500">CS</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-400">
                          {match.matchData?.gameMode || 'Classic'}
                        </div>
                        <div className="text-gray-400">
                          {match.matchData?.gameDuration || '00:00'}
                        </div>
                      </div>
                      
                      <div className="absolute bottom-0 right-0 text-xs text-gray-500 p-1 bg-black bg-opacity-30 rounded-tl-md">
                        {new Date(match.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-end mt-3 text-xs text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleString()}` : 'No update info available'}
                </div>
              </>
            ) : (
              <div className="arcade-card p-8 text-center">
                <div className="text-5xl mb-4">🏅</div>
                <h3 className="text-xl font-bold text-cyan-300 mb-3">
                  {refreshing ? "Fetching Match History..." : "No Match History Found"}
                </h3>
                <p className="text-indigo-200 mb-6">
                  {refreshing 
                    ? "Please wait while we analyze your recent games..." 
                    : "We don't have any match data for you yet."}
                </p>
                {!refreshing && gameAccounts && gameAccounts.league && (
                  <button
                    onClick={handleRefreshMatchHistory}
                    className="arcade-button text-sm"
                  >
                    LOAD MATCH HISTORY
                  </button>
                )}
                {refreshing && (
                  <div className="flex justify-center">
                    <div className="loading-animation h-8 w-8"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tournament History */}
          <div>
            <h2 className="text-2xl font-bold arcade-text text-cyan-400 text-shadow mb-6">TOURNAMENTS</h2>
            
            <div className="arcade-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-pink-300 arcade-text">RECENT TOURNAMENTS</h3>
                <button className="arcade-button text-sm">
                  JOIN TOURNAMENT
                </button>
              </div>
              
              <div className="overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        Tournament
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-900 divide-y divide-slate-800">
                    {/* Example data - replace with actual tournament history */}
                    <tr className="transition-all hover:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 mr-3">
                            <img className="h-8 w-8 rounded" src="https://universe.leagueoflegends.com/images/LOL_LOGO.png" alt="League of Legends" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Weekly League Tournament</div>
                            <div className="text-xs text-gray-400">5v5 Tournament</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">10 February 2025</div>
                        <div className="text-xs text-gray-400">15:00 - 20:00</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-lg mr-2">🏫</div>
                          <div>
                            <div className="text-sm text-white">TED University</div>
                            <div className="text-xs text-gray-400">Ankara</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400 text-yellow-900">
                          🏆 1ST PLACE
                        </span>
                      </td>
                    </tr>
                    <tr className="transition-all hover:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 mr-3">
                            <img className="h-8 w-8 rounded" src="https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8e4c0863e119e2f3/634ef3e5dfb2b25a75493f5c/Val_Ep5A3_Social_Twitter_Profile.jpg" alt="Valorant" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">Valorant Championship</div>
                            <div className="text-xs text-gray-400">University Finals</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">15 January 2025</div>
                        <div className="text-xs text-gray-400">12:00 - 18:00</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-lg mr-2">🏢</div>
                          <div>
                            <div className="text-sm text-white">METU University</div>
                            <div className="text-xs text-gray-400">Ankara</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-amber-300 text-amber-900">
                          🥉 3RD PLACE
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 border-2 border-indigo-600 rounded-lg bg-indigo-900 bg-opacity-20">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">🎮</div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-300 mb-1">UPCOMING TOURNAMENT</h4>
                    <p className="text-md font-semibold text-cyan-100">Inter-University League of Legends Spring Cup</p>
                    <p className="text-sm text-gray-300 mt-1">Registration deadline: March 30, 2025</p>
                    <div className="mt-3">
                      <button className="arcade-button text-sm bg-gradient-to-r from-indigo-600 to-purple-600">
                        REGISTER NOW
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;