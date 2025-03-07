import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TournamentCreate = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '', // Kayıt son tarihi - yeni eklendi
    prizePool: '',
    game: 'League of Legends', // gameType -> game olarak değiştirildi
    participantLimit: 20 // Katılımcı sınırı - yeni eklendi, varsayılan değer 20
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Check if user is a school agent
  if (!user || user.role !== 'school_agent') {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Yetkisiz Erişim</h2>
        <p className="text-white mb-4">Bu sayfaya erişmek için okul yetkilisi olmanız gerekmektedir.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:3000/tournament/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          registrationDeadline: '',
          prizePool: '',
          game: 'League of Legends',
          participantLimit: 20
        });
      } else {
        setError(data.message || 'Turnuva oluşturulurken bir hata oluştu.');
      }
    } catch (error) {
      setError('Sunucu ile bağlantı kurulurken bir hata oluştu.');
      console.error('Error creating tournament:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Yeni Turnuva Oluştur</h2>
      <p className="text-gray-300 mb-6">
        <strong>Okul:</strong> {user.schoolName}
      </p>

      {success && (
        <div className="bg-green-600 text-white p-4 rounded-md mb-6">
          Turnuva başarıyla oluşturuldu!
        </div>
      )}

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2" htmlFor="title">
            Turnuva Adı
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-300 mb-2" htmlFor="description">
            Açıklama
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="startDate">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="endDate">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="registrationDeadline">
              Son Kayıt Tarihi
            </label>
            <input
              type="date"
              id="registrationDeadline"
              name="registrationDeadline"
              value={formData.registrationDeadline}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="prizePool">
              Ödül Havuzu (TL)
            </label>
            <input
              type="number"
              id="prizePool"
              name="prizePool"
              value={formData.prizePool}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="participantLimit">
              Katılımcı Sınırı
            </label>
            <input
              type="number"
              id="participantLimit"
              name="participantLimit"
              value={formData.participantLimit}
              onChange={handleChange}
              required
              min="2"
              max="100"
              className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="game">
              Oyun
            </label>
            <select
              id="game"
              name="game"
              value={formData.game}
              onChange={handleChange}
              required
              className="w-full p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="League of Legends">League of Legends</option>
              <option value="Valorant">Valorant</option>
              <option value="CS:GO">CS:GO</option>
              <option value="Fortnite">Fortnite</option>
              <option value="Other">Diğer</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-3 rounded-md text-white font-bold mt-4 ${
            loading ? 'bg-blue-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'İşlem yapılıyor...' : 'Turnuva Oluştur'}
        </button>
      </form>
    </div>
  );
};

export default TournamentCreate;