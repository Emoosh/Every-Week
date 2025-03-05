import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tournamentService } from '../services/api';

const TournamentList = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [selectedTab, setSelectedTab] = useState('school'); // 'school' veya 'available'

  useEffect(() => {
    fetchTournaments();
  }, [user, selectedTab]);

  const fetchTournaments = async () => {
    if (!user || !user.schoolName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      let data;
      if (selectedTab === 'school') {
        data = await tournamentService.getSchoolTournaments(user.schoolName);
      } else {
        data = await tournamentService.getAvailableTournaments();
      }
      
      if (data.success) {
        setTournaments(data.tournaments);
      } else {
        setError('Turnuvalar yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setError('Sunucu ile bağlantı sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const registerForTournament = async (tournamentId) => {
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
      }
    } catch (error) {
      console.error('Error registering for tournament:', error);
      setRegistrationStatus(prev => ({
        ...prev,
        [tournamentId]: 'error'
      }));
    }
  };

  if (loading) {
    return <div className="text-white text-center p-6">Turnuvalar yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-6">{error}</div>;
  }

  if (!user || !user.schoolName) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Bir okula kayıtlı değilsiniz</h2>
        <p className="text-white mb-4">Turnuvalara katılmak için bir okula kayıtlı olmanız gerekmektedir.</p>
      </div>
    );
  }

  // Tab bar for selecting tournament view
  const renderTabs = () => (
    <div className="flex border-b border-gray-700 mb-6">
      <button
        className={`flex-1 py-3 font-medium ${
          selectedTab === 'school' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        onClick={() => setSelectedTab('school')}
      >
        Okul Turnuvaları
      </button>
      <button
        className={`flex-1 py-3 font-medium ${
          selectedTab === 'available' 
            ? 'text-blue-400 border-b-2 border-blue-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
        onClick={() => setSelectedTab('available')}
      >
        Katılabileceğim Turnuvalar
      </button>
    </div>
  );

  if (tournaments.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        {renderTabs()}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            {selectedTab === 'school' 
              ? `${user.schoolName} Turnuvaları` 
              : 'Katılabileceğiniz Turnuvalar'}
          </h2>
          <p className="text-gray-300 mb-4">Henüz turnuva bulunmamaktadır.</p>
          {user.role === 'school_agent' && (
            <a href="/tournament/create" className="inline-block px-6 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700">
              Yeni Turnuva Oluştur
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      {renderTabs()}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          {selectedTab === 'school' 
            ? `${user.schoolName} Turnuvaları` 
            : 'Katılabileceğiniz Turnuvalar'}
        </h2>
        {user.role === 'school_agent' && (
          <div className="flex space-x-2">
            <a href="/tournament/create" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700">
              Yeni Turnuva Oluştur
            </a>
            <a href="/tournament/create-multi" className="px-4 py-2 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700">
              Çok Okullu Turnuva
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map(tournament => (
          <div key={tournament._id} className="bg-gray-700 rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-indigo-800 to-blue-800 px-4 py-3">
              <h3 className="text-xl font-bold text-white">{tournament.title}</h3>
              <div className="flex flex-wrap mt-2 gap-2">
                <span className="inline-block bg-gray-900 text-xs text-white px-2 py-1 rounded-full">
                  {tournament.game}
                </span>
                {tournament.schools && tournament.schools.length > 1 && (
                  <span className="inline-block bg-purple-900 text-xs text-white px-2 py-1 rounded-full">
                    Çok Okullu
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-gray-300 mb-4 text-sm h-16 overflow-hidden">{tournament.description}</p>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <span className="text-gray-400 block">Başlangıç:</span>
                  <span className="text-white">{new Date(tournament.startDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Bitiş:</span>
                  <span className="text-white">{new Date(tournament.endDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Kayıt Son:</span>
                  <span className="text-white">{new Date(tournament.registrationDeadline).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Ödül Havuzu:</span>
                  <span className="text-white font-bold">{tournament.prizePool} TL</span>
                </div>
              </div>
              
              {tournament.schools && tournament.schools.length > 1 && (
                <div className="mb-4">
                  <span className="text-gray-400 block text-sm">Katılımcı Okullar:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tournament.schools.map((school, idx) => (
                      <span key={idx} className="inline-block bg-gray-800 text-xs text-white px-2 py-1 rounded-full">
                        {school}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                {registrationStatus[tournament._id] === 'success' ? (
                  <div className="bg-green-600 text-white text-center p-2 rounded-md">
                    Kayıt başarılı!
                  </div>
                ) : registrationStatus[tournament._id] === 'error' ? (
                  <div className="bg-red-600 text-white text-center p-2 rounded-md">
                    Kayıt başarısız!
                  </div>
                ) : registrationStatus[tournament._id] === 'loading' ? (
                  <button 
                    className="w-full bg-gray-600 text-white p-2 rounded-md cursor-not-allowed"
                    disabled
                  >
                    İşlem yapılıyor...
                  </button>
                ) : (
                  <button 
                    onClick={() => registerForTournament(tournament._id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
                  >
                    Turnuvaya Katıl
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentList;