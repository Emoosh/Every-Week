import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';

const SchoolAgentsList = () => {
  const { user } = useAuth();
  const [schoolAgents, setSchoolAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    fetchSchoolAgents();
  }, [selectedSchool]);

  const fetchSchoolAgents = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminService.getSchoolAgents(selectedSchool);

      if (response.success) {
        setSchoolAgents(response.data);
        
        // Extract unique schools for the dropdown filter
        const uniqueSchools = [...new Set(response.data
          .filter(agent => agent.schoolName)
          .map(agent => agent.schoolName))];
        
        setSchools(uniqueSchools);
      } else {
        setError('Okul yetkilileri yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error fetching school agents:', error);
      setError('Sunucu ile bağlantı sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin (daha esnek kontrol)
  const isAdmin = user && 
                (user.role === 'admin' || 
                 user.role === 'Admin' || 
                 (typeof user.role === 'string' && user.role.toLowerCase() === 'admin'));
  
  console.log("SchoolAgentsList - User:", user);
  console.log("SchoolAgentsList - Is admin check:", isAdmin);
  
  if (!isAdmin) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Yetkiniz Yok</h2>
        <p className="text-white mb-4">Bu sayfayı görüntülemek için admin yetkisine sahip olmanız gerekmektedir.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-white text-center p-6">Okul yetkilileri yükleniyor...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-6">{error}</div>;
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Okul Yetkilileri</h2>
        
        {/* School filter dropdown */}
        <div className="flex space-x-2">
          <select
            className="bg-gray-700 text-white p-2 rounded-md"
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
          >
            <option value="">Tüm Okullar</option>
            {schools.map((school, index) => (
              <option key={index} value={school}>{school}</option>
            ))}
          </select>
          
          <button
            onClick={() => fetchSchoolAgents()}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700"
          >
            Yenile
          </button>
        </div>
      </div>

      {schoolAgents.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-300 mb-4">Okul yetkilisi bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-600">
              <tr>
                <th className="px-4 py-2 text-left text-white">Email</th>
                <th className="px-4 py-2 text-left text-white">Okul</th>
                <th className="px-4 py-2 text-left text-white">Kullanıcı Adı</th>
                <th className="px-4 py-2 text-left text-white">Oluşturulma Tarihi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {schoolAgents.map((agent, index) => (
                <tr key={index} className="hover:bg-gray-600">
                  <td className="px-4 py-3 text-white">{agent.e_mail}</td>
                  <td className="px-4 py-3 text-white">{agent.schoolName || 'Belirtilmemiş'}</td>
                  <td className="px-4 py-3 text-white">{agent.username || 'Belirtilmemiş'}</td>
                  <td className="px-4 py-3 text-white">
                    {agent.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'Belirtilmemiş'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SchoolAgentsList;