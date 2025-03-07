import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/api';

const StudentsList = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schools, setSchools] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchStudents();
  }, [selectedSchool]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log("Fetching students with schoolName:", selectedSchool || "ALL");
      const response = await adminService.getStudents(selectedSchool);
      console.log("Students API response:", response);

      if (response && response.success) {
        console.log("Students found:", response.data ? response.data.length : 0);
        setStudents(response.data || []);
        
        // Extract unique schools for the dropdown filter
        const uniqueSchools = [...new Set((response.data || [])
          .filter(student => student && student.schoolName)
          .map(student => student.schoolName))];
        
        console.log("Unique schools found:", uniqueSchools);
        setSchools(uniqueSchools);
      } else {
        console.error("API error response:", response);
        setError('Öğrenciler yüklenirken bir hata oluştu: ' + (response?.message || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Sunucu ile bağlantı sırasında bir hata oluştu: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleSetSchoolAgent = async () => {
    if (!selectedStudent) {
      setError('Lütfen bir öğrenci seçin');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await adminService.setSchoolAgent(
        selectedStudent._id, 
        selectedStudent.schoolName
      );

      if (response.success) {
        setSuccessMessage(`${selectedStudent.e_mail} başarıyla okul yetkilisi olarak atandı.`);
        setSelectedStudent(null);
        // Listeyi güncelle
        fetchStudents();
      } else {
        setError(response.message || 'Okul yetkilisi atanırken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error setting school agent:', error);
      setError('Sunucu ile bağlantı sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user is admin (daha esnek kontrol)
  const isAdmin = user && 
                (user.role === 'admin' || 
                 user.role === 'Admin' || 
                 (typeof user.role === 'string' && user.role.toLowerCase() === 'admin'));
  
  console.log("StudentsList - User:", user);
  console.log("StudentsList - Is admin check:", isAdmin);
  
  if (!isAdmin) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Yetkiniz Yok</h2>
        <p className="text-white mb-4">Bu sayfayı görüntülemek için admin yetkisine sahip olmanız gerekmektedir.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-white text-center p-6">Öğrenciler yükleniyor...</div>;
  }

  if (error) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="text-red-500 text-center p-6 mb-4">{error}</div>
        <button
          onClick={() => fetchStudents()}
          className="w-full px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Öğrenciler</h2>
        
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
            onClick={() => fetchStudents()}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700"
          >
            Yenile
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-600 text-white p-3 rounded-md mb-4">
          {successMessage}
        </div>
      )}

      {students.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-300 mb-4">Öğrenci bulunmamaktadır.</p>
          
          {/* Test öğrenci oluşturma formu */}
          <div className="mt-8 bg-gray-700 p-4 rounded-lg max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">Test Öğrenci Oluştur</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const email = e.target.elements.email.value;
              const school = e.target.elements.school.value;
              
              if (!email) {
                setError('Email adresi gerekli');
                return;
              }
              
              setLoading(true);
              adminService.createTestStudent(email, school)
                .then(response => {
                  if (response.success) {
                    setSuccessMessage(`Test öğrenci oluşturuldu! Email: ${email}, Şifre: testpassword`);
                    fetchStudents(); // Listeyi yenile
                  } else {
                    setError(response.message || 'Bir hata oluştu');
                  }
                })
                .catch(err => {
                  setError(err.message || 'Bir hata oluştu');
                })
                .finally(() => {
                  setLoading(false);
                });
            }}>
              <div className="mb-4">
                <label className="block text-white mb-2" htmlFor="email">Email Adresi</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="ornek@okul.edu.tr"
                  className="w-full p-2 bg-gray-800 text-white rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white mb-2" htmlFor="school">Okul Adı (Opsiyonel)</label>
                <input
                  type="text"
                  id="school"
                  name="school"
                  placeholder="Üniversite/Okul Adı"
                  className="w-full p-2 bg-gray-800 text-white rounded"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'İşleniyor...' : 'Test Öğrenci Oluştur'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
              <thead className="bg-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left text-white">Seç</th>
                  <th className="px-4 py-2 text-left text-white">Email</th>
                  <th className="px-4 py-2 text-left text-white">Okul</th>
                  <th className="px-4 py-2 text-left text-white">Kullanıcı Adı</th>
                  <th className="px-4 py-2 text-left text-white">Oluşturulma Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {students.map((student) => (
                  <tr 
                    key={student._id} 
                    className={`hover:bg-gray-600 ${selectedStudent && selectedStudent._id === student._id ? 'bg-blue-900' : ''}`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <td className="px-4 py-3 text-white">
                      <input 
                        type="radio" 
                        name="selectedStudent"
                        checked={selectedStudent && selectedStudent._id === student._id}
                        onChange={() => setSelectedStudent(student)}
                        className="form-radio h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-3 text-white">{student.e_mail}</td>
                    <td className="px-4 py-3 text-white">{student.schoolName || 'Belirtilmemiş'}</td>
                    <td className="px-4 py-3 text-white">{student.username || 'Belirtilmemiş'}</td>
                    <td className="px-4 py-3 text-white">
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Belirtilmemiş'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSetSchoolAgent}
              disabled={!selectedStudent || isSubmitting}
              className={`px-6 py-3 font-bold rounded-md ${
                !selectedStudent || isSubmitting
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isSubmitting ? 'İşleniyor...' : 'Seçili Öğrenciyi Okul Yetkilisi Yap'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentsList;