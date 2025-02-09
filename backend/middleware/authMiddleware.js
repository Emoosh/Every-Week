export const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ error: "Yetkisiz erişim" });
  
    try {
      // Burada JWT doğrulaması yapılabilir
      next();
    } catch (error) {
      res.status(403).json({ error: "Geçersiz token" });
    }
  };
  