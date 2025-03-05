import express from 'express';
import { setUserAsSchoolAgent, getSchoolAgents, getStudents, signup } from '../../Database/db.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Admin middleware - check if user has admin role (more flexible checking)
const adminMiddleware = (req, res, next) => {
  // First authenticate the user
  authMiddleware(req, res, () => {
    console.log("Admin middleware - user:", req.user);
    
    // Check if user is admin (case insensitive and more flexible)
    const isAdmin = req.user && 
                   (req.user.role === 'admin' || 
                    req.user.role === 'Admin' || 
                    (typeof req.user.role === 'string' && req.user.role.toLowerCase() === 'admin'));
    
    console.log("Is admin check:", isAdmin);
    
    if (isAdmin) {
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        message: "Admin yetkiniz bulunmamaktadır."
      });
    }
  });
};

// Set a user as school agent
router.post('/set-school-agent', adminMiddleware, async (req, res) => {
  try {
    const { userId, schoolName } = req.body;
    
    if (!userId || !schoolName) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and school name are required'
      });
    }
    
    const result = await setUserAsSchoolAgent(new ObjectId(userId), schoolName);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: `User has been set as a school agent for ${schoolName}`
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.message || 'Failed to set user as school agent'
      });
    }
  } catch (error) {
    console.error('Error setting school agent:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all school agents
// GET /admin/school-agents?schoolName=optional_school_name
router.get('/school-agents', adminMiddleware, async (req, res) => {
  try {
    const { schoolName } = req.query;
    const agents = await getSchoolAgents(schoolName);
    return res.status(200).json({ 
      success: true, 
      data: agents 
    });
  } catch (error) {
    console.error("Get school agents error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "İşlem sırasında bir hata oluştu.",
      error: error.message
    });
  }
});

// Get all students
// GET /admin/students?schoolName=optional_school_name
router.get('/students', adminMiddleware, async (req, res) => {
  try {
    const { schoolName } = req.query;
    const students = await getStudents(schoolName);
    return res.status(200).json({ 
      success: true, 
      data: students 
    });
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "İşlem sırasında bir hata oluştu.",
      error: error.message
    });
  }
});

// Create admin user (for initial setup)
// POST /admin/create-admin
router.post('/create-admin', async (req, res) => {
  try {
    const { e_mail, password, schoolName } = req.body;

    if (!e_mail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email ve şifre gereklidir."
      });
    }

    // Create admin user with admin role
    const result = await signup(e_mail, password, schoolName, "admin");
    
    if (result.success) {
      return res.status(201).json({ 
        success: true, 
        message: "Admin kullanıcı başarıyla oluşturuldu.",
        userId: result.userId
      });
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Create admin error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "İşlem sırasında bir hata oluştu.",
      error: error.message
    });
  }
});

// Create test student user
// POST /admin/create-test-student
router.post('/create-test-student', adminMiddleware, async (req, res) => {
  try {
    const { e_mail, schoolName } = req.body;
    const password = "testpassword"; // Basit bir test şifresi
    
    console.log("Creating test student:", e_mail, schoolName);

    if (!e_mail) {
      return res.status(400).json({ 
        success: false, 
        message: "Email gereklidir."
      });
    }

    // Create student user with user role
    const result = await signup(e_mail, password, schoolName, "user");
    
    if (result.success) {
      return res.status(201).json({ 
        success: true, 
        message: "Test öğrenci kullanıcısı başarıyla oluşturuldu.",
        userId: result.userId,
        credentials: {
          e_mail,
          password,
          schoolName
        }
      });
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Create test student error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "İşlem sırasında bir hata oluştu.",
      error: error.message
    });
  }
});

export default router;