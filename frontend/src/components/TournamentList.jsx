import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tournamentService, gameAccountsService } from '../services/api';

// Mock tournament data with HLTV-style format
const mockTeams = [
  { id: 1, name: "TED University", logo: "https://www.hltv.org/img/static/team/logo/9565", rank: 1 },
  { id: 2, name: "Bilkent University", logo: "https://www.hltv.org/img/static/team/logo/4608", rank: 2 },
  { id: 3, name: "METU", logo: "https://www.hltv.org/img/static/team/logo/4411", rank: 3 },
  { id: 4, name: "Hacettepe University", logo: "https://www.hltv.org/img/static/team/logo/4869", rank: 4 },
  { id: 5, name: "Ankara University", logo: "https://www.hltv.org/img/static/team/logo/11595", rank: 5 },
  { id: 6, name: "Gazi University", logo: "https://www.hltv.org/img/static/team/logo/6665", rank: 6 },
  { id: 7, name: "Istanbul Technical University", logo: "https://www.hltv.org/img/static/team/logo/9565", rank: 7 },
  { id: 8, name: "Bogazici University", logo: "https://www.hltv.org/img/static/team/logo/4608", rank: 8 },
];

// Tournament filters
const regions = ["All Regions", "Ankara", "Istanbul", "Izmir", "Other"];
const gameTypes = ["All Games", "League of Legends", "Valorant", "CS:GO", "Dota 2"];

// Tournament statuses
const statusColors = {
  'ongoing': 'bg-green-500',
  'upcoming': 'bg-blue-500',
  'completed': 'bg-gray-500',
  'registration': 'bg-purple-500'
};

// Format date to human-readable format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Prize pool display helper function
const formatPrizePool = (amount) => {
  if (amount >= 1000) {
    return `$${(amount/1000).toFixed(1)}K`;
  }
  return `$${amount}`;
};

const TournamentList = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [filteredTournaments, setFilteredTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [gameAccounts, setGameAccounts] = useState(null);
  
  // Filter states
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedGameType, setSelectedGameType] = useState("All Games");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("date");
  
  // Filter function for tournaments
  const filterTournaments = () => {
    let filtered = [...tournaments];
    
    // Filter by region
    if (selectedRegion !== "All Regions") {
      filtered = filtered.filter(tournament => 
        tournament.location === selectedRegion
      );
    }
    
    // Filter by game type
    if (selectedGameType !== "All Games") {
      filtered = filtered.filter(tournament => 
        tournament.game === selectedGameType
      );
    }
    
    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tournament => 
        tournament.title.toLowerCase().includes(query) ||
        tournament.organizer.toLowerCase().includes(query) ||
        tournament.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortBy === "date") {
      filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    } else if (sortBy === "prize") {
      filtered.sort((a, b) => b.prizePool - a.prizePool);
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    setFilteredTournaments(filtered);
  };
  
  // Effect for filtering
  useEffect(() => {
    filterTournaments();
  }, [selectedRegion, selectedGameType, searchQuery, sortBy, tournaments]);

  useEffect(() => {
    fetchTournaments();
    
    // Fetch game accounts
    const fetchGameAccounts = async () => {
      try {
        const result = await gameAccountsService.getGameAccounts();
        if (result.success) {
          setGameAccounts(result.accounts);
        }
      } catch (err) {
        console.log('No game accounts found', err);
      }
    };
    
    if (user) {
      fetchGameAccounts();
    }
  }, [user]);

  const fetchTournaments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Merge school and available tournaments
      const [schoolData, availableData] = await Promise.all([
        tournamentService.getSchoolTournaments(user.schoolName),
        tournamentService.getAvailableTournaments()
      ]);
      
      const allTournaments = [];
      
      if (schoolData.success && schoolData.tournaments) {
        allTournaments.push(...schoolData.tournaments.map(t => ({
          ...t,
          tournamentType: 'school'
        })));
      }
      
      if (availableData.success && availableData.tournaments) {
        // Add only tournaments that are not already included
        availableData.tournaments.forEach(t => {
          if (!allTournaments.some(st => st._id === t._id)) {
            allTournaments.push({
              ...t,
              tournamentType: 'available'
            });
          }
        });
      }
      
      // Enhance tournament data with HLTV-style fields for each tournament
      const enhancedTournaments = allTournaments.map(tournament => {
        // Determine tournament status
        const now = new Date();
        const startDate = new Date(tournament.startDate);
        const endDate = new Date(tournament.endDate);
        const regDeadline = new Date(tournament.registrationDeadline);
        
        let status;
        if (now < regDeadline) {
          status = 'registration';
        } else if (now < startDate) {
          status = 'upcoming';
        } else if (now > endDate) {
          status = 'completed';
        } else {
          status = 'ongoing';
        }
        
        // Assign random teams to each tournament for display purposes
        const teamCount = Math.floor(Math.random() * 5) + 4; // 4-8 teams
        const shuffledTeams = [...mockTeams].sort(() => 0.5 - Math.random()).slice(0, teamCount);
        
        // Random location if none provided
        const locations = ["Ankara", "Istanbul", "Izmir", "Antalya", "Bursa"];
        const location = tournament.location || locations[Math.floor(Math.random() * locations.length)];
        
        return {
          ...tournament,
          status,
          location,
          teams: shuffledTeams,
          organizer: tournament.organizer || user.schoolName,
          format: tournament.format || "Double Elimination",
          prizePlacement: [
            { place: "1st", amount: Math.round(tournament.prizePool * 0.5) },
            { place: "2nd", amount: Math.round(tournament.prizePool * 0.3) },
            { place: "3rd", amount: Math.round(tournament.prizePool * 0.2) },
          ]
        };
      });
      
      setTournaments(enhancedTournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // Check required game account for tournament
  const checkRequiredGameAccount = (tournament) => {
    if (!gameAccounts) {
      return false;
    }
    
    const gameType = tournament.game.toLowerCase();
    
    if (gameType.includes('league') || gameType.includes('lol')) {
      return !!gameAccounts.league;
    }
    
    if (gameType.includes('valorant') || gameType.includes('valo')) {
      return !!gameAccounts.valorant;
    }
    
    return true;
  };

  // Register for tournament
  const registerForTournament = async (tournamentId, tournament) => {
    if (!checkRequiredGameAccount(tournament)) {
      setError(`You need to add your ${tournament.game} account to your profile to join this tournament.`);
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    setRegistrationStatus(prev => ({
      ...prev,
      [tournamentId]: 'loading'
    }));

    try {
      const data = await tournamentService.registerForTournament(tournamentId);
      
      if (data.success) {
        setRegistrationStatus(prev => ({
          ...prev,
          [tournamentId]: 'success'
        }));
      } else {
        setRegistrationStatus(prev => ({
          ...prev,
          [tournamentId]: 'error'
        }));
        setError(data.message || 'Failed to register for the tournament.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error registering for tournament:', error);
      setRegistrationStatus(prev => ({
        ...prev,
        [tournamentId]: 'error'
      }));
      setError('Connection error when registering.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex justify-center items-center">
        <div className="loading-animation h-16 w-16"></div>
      </div>
    );
  }

  // Error message display
  if (error) {
    return (
      <div className="arcade-card p-8 my-8 max-w-4xl mx-auto">
        <div className="p-4 rounded-md bg-red-900 bg-opacity-40 border-2 border-red-500 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Tournaments</h3>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  // Not logged in or not registered with a school
  if (!user || !user.schoolName) {
    return (
      <div className="arcade-card p-8 my-8 max-w-4xl mx-auto text-center">
        <div className="text-3xl mb-4">🏫</div>
        <h2 className="text-2xl font-bold arcade-text text-red-400 mb-4">Not Registered With A School</h2>
        <p className="text-white mb-6">You need to be registered with a school to participate in tournaments.</p>
        <Link to="/profile" className="arcade-button inline-block">Update Profile</Link>
      </div>
    );
  }

  // No tournaments found
  if (filteredTournaments.length === 0) {
    return (
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Filter and search bar */}
          <div className="arcade-card p-6 mb-8">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="w-full md:w-auto flex-1">
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-indigo-600 focus:border-cyan-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-auto">
                <select 
                  className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-indigo-600"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-full md:w-auto">
                <select 
                  className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-indigo-600"
                  value={selectedGameType}
                  onChange={(e) => setSelectedGameType(e.target.value)}
                >
                  {gameTypes.map(game => (
                    <option key={game} value={game}>{game}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-white">Sort by:</span>
                <select
                  className="p-2 bg-slate-900 text-white rounded-md border border-indigo-600"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date</option>
                  <option value="prize">Prize Pool</option>
                  <option value="name">Name</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button 
                  className={`p-2 rounded-md ${view === 'grid' ? 'bg-indigo-700' : 'bg-slate-800'}`}
                  onClick={() => setView('grid')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button 
                  className={`p-2 rounded-md ${view === 'list' ? 'bg-indigo-700' : 'bg-slate-800'}`}
                  onClick={() => setView('list')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="arcade-card p-8 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold arcade-text text-cyan-400 mb-4">
              No Tournaments Found
            </h2>
            <p className="text-indigo-200 mb-6">
              There are no tournaments matching your current filters.
            </p>
            <button 
              onClick={() => {
                setSelectedRegion("All Regions");
                setSelectedGameType("All Games");
                setSearchQuery("");
              }}
              className="arcade-button"
            >
              CLEAR FILTERS
            </button>
            
            {user.role === 'school_agent' && (
              <div className="mt-8 pt-8 border-t border-slate-700">
                <h3 className="text-xl font-bold text-pink-400 mb-4">School Agent Options</h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/tournament/create" className="arcade-button">
                    CREATE TOURNAMENT
                  </Link>
                  <Link to="/tournament/create-multi" className="arcade-button bg-gradient-to-r from-purple-600 to-indigo-600">
                    MULTI-SCHOOL TOURNAMENT
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold arcade-text text-cyan-400 text-shadow">TOURNAMENTS</h1>
          <p className="text-gray-300 mt-2">Discover and participate in university esports tournaments</p>
        </div>
        
        {/* Filter and search bar */}
        <div className="arcade-card p-6 mb-8">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="w-full md:w-auto flex-1">
              <input
                type="text"
                placeholder="Search tournaments..."
                className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-indigo-600 focus:border-cyan-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-auto">
              <select 
                className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-indigo-600"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto">
              <select 
                className="w-full p-3 bg-slate-900 text-white rounded-md border-2 border-indigo-600"
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value)}
              >
                {gameTypes.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-white">Sort by:</span>
              <select
                className="p-2 bg-slate-900 text-white rounded-md border border-indigo-600"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Date</option>
                <option value="prize">Prize Pool</option>
                <option value="name">Name</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button 
                className={`p-2 rounded-md ${view === 'grid' ? 'bg-indigo-700' : 'bg-slate-800'}`}
                onClick={() => setView('grid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                className={`p-2 rounded-md ${view === 'list' ? 'bg-indigo-700' : 'bg-slate-800'}`}
                onClick={() => setView('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Create tournament button for school agents */}
        {user.role === 'school_agent' && (
          <div className="flex justify-end mb-6">
            <Link to="/tournament/create" className="arcade-button">
              CREATE NEW TOURNAMENT
            </Link>
          </div>
        )}
        
        {/* Tournament grid or list view */}
        {view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map(tournament => (
              <div key={tournament._id} className="game-card">
                <div className="relative">
                  {/* Tournament header */}
                  <div className="bg-gradient-to-r from-indigo-800 to-blue-800 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{tournament.title}</h3>
                        <div className="flex items-center text-sm text-gray-300">
                          <span>{tournament.organizer}</span>
                        </div>
                      </div>
                      <div className={`${statusColors[tournament.status]} text-white text-xs px-2 py-1 rounded-full`}>
                        {tournament.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Tournament content */}
                  <div className="p-5">
                    <div className="flex items-center mb-4">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-10 w-10 flex items-center justify-center text-xl mr-3">
                        {tournament.game.includes('League') ? '🎮' : 
                         tournament.game.includes('Valorant') ? '🎯' : 
                         tournament.game.includes('CS:GO') ? '🔫' : '🕹️'}
                      </div>
                      <div>
                        <div className="text-cyan-300 font-medium">{tournament.game}</div>
                        <div className="text-xs text-gray-400">{tournament.format}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
                      <div>
                        <span className="block text-gray-400">Starts</span>
                        <span className="text-white">{formatDate(tournament.startDate)}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400">Ends</span>
                        <span className="text-white">{formatDate(tournament.endDate)}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400">Location</span>
                        <span className="text-white">{tournament.location}</span>
                      </div>
                      <div>
                        <span className="block text-gray-400">Teams</span>
                        <span className="text-white">{tournament.teams.length}</span>
                      </div>
                    </div>
                    
                    {/* Prize pool */}
                    <div className="bg-slate-900 rounded-md p-3 mb-4">
                      <div className="text-center mb-2">
                        <div className="text-sm text-gray-400">Prize Pool</div>
                        <div className="text-2xl font-bold text-yellow-400">${tournament.prizePool}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {tournament.prizePlacement.map((prize, idx) => (
                          <div key={idx}>
                            <div className="text-gray-400">{prize.place}</div>
                            <div className="text-white font-medium">${prize.amount}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Participating teams preview */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-400">Teams</div>
                        <Link to="#" className="text-xs text-cyan-400">View all</Link>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tournament.teams.slice(0, 4).map(team => (
                          <div key={team.id} className="bg-slate-800 rounded-full p-1 flex items-center">
                            <img src={team.logo} alt={team.name} className="h-6 w-6 rounded-full" />
                            <span className="text-xs text-white ml-1 mr-2">{team.name.substring(0, 10)}{team.name.length > 10 ? '...' : ''}</span>
                          </div>
                        ))}
                        {tournament.teams.length > 4 && (
                          <div className="bg-slate-800 rounded-full h-8 w-8 flex items-center justify-center text-xs text-white">
                            +{tournament.teams.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Join button */}
                    <div>
                      {registrationStatus[tournament._id] === 'success' ? (
                        <div className="bg-green-600 text-white text-center p-2 rounded-md font-medium">
                          REGISTERED ✓
                        </div>
                      ) : registrationStatus[tournament._id] === 'error' ? (
                        <div className="bg-red-600 text-white text-center p-2 rounded-md font-medium">
                          REGISTRATION FAILED
                        </div>
                      ) : registrationStatus[tournament._id] === 'loading' ? (
                        <button 
                          className="w-full arcade-button opacity-75 cursor-not-allowed flex items-center justify-center"
                          disabled
                        >
                          <div className="loading-animation h-5 w-5 mr-2"></div>
                          PROCESSING...
                        </button>
                      ) : tournament.status === 'registration' ? (
                        <button 
                          onClick={() => registerForTournament(tournament._id, tournament)}
                          className="arcade-button w-full"
                        >
                          JOIN TOURNAMENT
                        </button>
                      ) : (
                        <button 
                          className="arcade-button w-full bg-gradient-to-r from-slate-600 to-slate-700"
                        >
                          VIEW DETAILS
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="arcade-card overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Tournament</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Prize</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Teams</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredTournaments.map(tournament => (
                  <tr key={tournament._id} className="hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full h-8 w-8 flex items-center justify-center text-lg mr-3">
                          {tournament.game.includes('League') ? '🎮' : 
                           tournament.game.includes('Valorant') ? '🎯' : 
                           tournament.game.includes('CS:GO') ? '🔫' : '🕹️'}
                        </div>
                        <div>
                          <div className="font-medium text-white">{tournament.title}</div>
                          <div className="text-xs text-gray-400">{tournament.game} • {tournament.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{formatDate(tournament.startDate)}</div>
                      <div className="text-xs text-gray-400">to {formatDate(tournament.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-yellow-400">${tournament.prizePool}</div>
                      <div className="text-xs text-gray-400">
                        1st: ${tournament.prizePlacement[0].amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2">
                        {tournament.teams.slice(0, 3).map(team => (
                          <img 
                            key={team.id} 
                            src={team.logo} 
                            alt={team.name} 
                            className="h-6 w-6 rounded-full ring-2 ring-slate-900" 
                            title={team.name}
                          />
                        ))}
                        {tournament.teams.length > 3 && (
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-700 text-xs text-white ring-2 ring-slate-900">
                            +{tournament.teams.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`${statusColors[tournament.status]} text-white text-xs px-2 py-1 rounded-full`}>
                        {tournament.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {registrationStatus[tournament._id] === 'success' ? (
                        <div className="text-green-400 text-sm font-medium">REGISTERED ✓</div>
                      ) : registrationStatus[tournament._id] === 'error' ? (
                        <div className="text-red-400 text-sm font-medium">FAILED</div>
                      ) : registrationStatus[tournament._id] === 'loading' ? (
                        <div className="flex items-center text-gray-400 text-sm">
                          <div className="loading-animation h-4 w-4 mr-2"></div>
                          Processing...
                        </div>
                      ) : tournament.status === 'registration' ? (
                        <button 
                          onClick={() => registerForTournament(tournament._id, tournament)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded-md"
                        >
                          JOIN
                        </button>
                      ) : (
                        <button 
                          className="bg-slate-700 text-white text-xs px-3 py-1 rounded-md"
                        >
                          DETAILS
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentList;