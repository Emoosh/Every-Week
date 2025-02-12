// backend/routes/controllers/jwt.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateToken = (user) => {  
  return jwt.sign(
    { id: user._id, email: user.email },   
    process.env.JWT_SECRET,               
    { expiresIn: process.env.JWT_EXPIRES_IN } 
  );
};
