import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Yetkisiz erişim! Token eksik." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("✅ Token Doğrulandı:", decoded);  // Debug log - disabled
    req.user = decoded;  // Token'dan gelen bilgiyi req.user'a ata
    next();
  } catch (error) {
    console.error("❌ Token Doğrulama Hatası:", error);
    return res.status(403).json({ success: false, message: "Geçersiz veya süresi dolmuş token!" });
  }
};

// Middleware to check if user is a school agent
const schoolAgentMiddleware = (req, res, next) => {
  // First authenticate the user
  authMiddleware(req, res, () => {
    // Check if user has school agent role (support both naming conventions)
    if (req.user && (req.user.role === 'schoolAgent' || req.user.role === 'school_agent')) {
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        message: "Bu işlem için okul yetkilisi olmanız gerekiyor." 
      });
    }
  });
};

// Middleware to check if user belongs to a specific school
const sameSchoolMiddleware = (req, res, next) => {
  const tournamentSchool = req.params.schoolName || req.body.schoolName;
  
  if (req.user && req.user.schoolName === tournamentSchool) {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: "Bu turnuvaya sadece aynı okuldaki öğrenciler katılabilir." 
    });
  }
};

export default authMiddleware;
export { schoolAgentMiddleware, sameSchoolMiddleware };
