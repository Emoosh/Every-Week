// Üniversite e-posta alan adlarını ve karşılık gelen okul adlarını içeren liste
const universityDomains = {
  "tedu.edu.tr": "TED Üniversitesi",
  "boun.edu.tr": "Boğaziçi Üniversitesi",
  "itu.edu.tr": "İstanbul Teknik Üniversitesi",
  "metu.edu.tr": "Orta Doğu Teknik Üniversitesi",
  "bilkent.edu.tr": "Bilkent Üniversitesi",
  "ku.edu.tr": "Koç Üniversitesi",
  "sabanciuniv.edu": "Sabancı Üniversitesi",
  "yildiz.edu.tr": "Yıldız Teknik Üniversitesi",
  "hacettepe.edu.tr": "Hacettepe Üniversitesi",
  "ankara.edu.tr": "Ankara Üniversitesi",
  "gsu.edu.tr": "Galatasaray Üniversitesi",
  "std.yildiz.edu.tr": "Yıldız Teknik Üniversitesi",
  "ogr.itu.edu.tr": "İstanbul Teknik Üniversitesi",
  "ug.bilkent.edu.tr": "Bilkent Üniversitesi",
  "stu.metu.edu.tr": "Orta Doğu Teknik Üniversitesi",
  "student.hacettepe.edu.tr": "Hacettepe Üniversitesi",
  "std.ankara.edu.tr": "Ankara Üniversitesi",
  "ogrenci.gsu.edu.tr": "Galatasaray Üniversitesi",
  "ogr.kocaeli.edu.tr": "Kocaeli Üniversitesi",
  "stu.eskisehir.edu.tr": "Eskişehir Teknik Üniversitesi",
  "ogrenci.cu.edu.tr": "Çukurova Üniversitesi",
  "ogr.ege.edu.tr": "Ege Üniversitesi",
  "student.beykent.edu.tr": "Beykent Üniversitesi",
  "ogr.gazi.edu.tr": "Gazi Üniversitesi",
  "ogr.akdeniz.edu.tr": "Akdeniz Üniversitesi",
  "ogr.deu.edu.tr": "Dokuz Eylül Üniversitesi",
  "ogr.ktu.edu.tr": "Karadeniz Teknik Üniversitesi",
  "std.yeditepe.edu.tr": "Yeditepe Üniversitesi"
};

/**
 * E-posta adresinden okul adını belirler
 * @param {string} email - E-posta adresi
 * @returns {string|null} - E-posta adresi bir üniversite adresi ise okul adı, değilse null
 */
export const getSchoolFromEmail = (email) => {
  if (!email || !email.includes('@')) {
    return null;
  }

  // E-posta adresinden alan adını çıkar (@'den sonraki kısım)
  const domain = email.split('@')[1].toLowerCase();
  
  // Alan adı universityDomains listesinde varsa, karşılık gelen okul adını döndür
  return universityDomains[domain] || null;
};

/**
 * Verilen e-posta adresinin geçerli bir üniversite e-postası olup olmadığını kontrol eder
 * @param {string} email - E-posta adresi
 * @returns {boolean} - Geçerli bir üniversite e-postası ise true, değilse false
 */
export const isValidUniversityEmail = (email) => {
  return getSchoolFromEmail(email) !== null;
};

export default {
  getSchoolFromEmail,
  isValidUniversityEmail
};