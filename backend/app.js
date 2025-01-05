import express from "express";
import cors from "cors";
import fetch from "node-fetch"; 
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import morgan from "morgan";
import session from "express-session";

import profileRoutes from './routes/profile/profile.js';

//Profile

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

//const STEAM_API_KEY = process.env.STEAM_API_KEY; 
const __dirname = dirname(fileURLToPath(import.meta.url));


app.use(
  session({
    secret: "your_secret_key", 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
  })
);



//MIDDLEWARES

//Dev logging
if(process.env.NODE_ENV === 'development')
  {
    app.use(morgan('dev'));
  };

app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend")));

//Main Page
app.get("/", (req, res) => {
  const location = path.join(__dirname, "../frontend/index.html");
  res.sendFile(location);
});

//Route -> Profile Informations
app.use('/profile',profileRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});