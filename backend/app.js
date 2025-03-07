import express from "express";
import cors from "cors";
import fetch from "node-fetch"; 
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import session from "express-session";

//Routes

//Login & Signup Routes
import loginRoute from './routes/controllers/login.js'
import registerRoute from './routes/controllers/register.js'
import authMiddleware from './middleware/authMiddleware.js';
import profileRoute from './routes/profile/profile.js'
import gameAccountsRoute from './routes/profile/game-accounts.js'

//Tournament Routes
import tournamentRoute from './routes/tournament/tournament.js'

//Admin Routes
import adminRoute from './routes/admin/admin.js'

//RIOT information Routes
import RiotRoute from './routes/profile/profile_information_providers/riot_info.js'
//.env
import dotenv from "dotenv";
dotenv.config();

//Mongo DB
import {connectDB} from "./Database/db.js";
connectDB();


const app = express();
const PORT = 3000;
app.use(express.json());

const __dirname = dirname(fileURLToPath(import.meta.url));


//This line haven't completed yet.
// The purpose of this to preventing users to login each time.
// By just basically using cookies.
app.use(
  session({
    secret: "your_secret_key", 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
  })
);

//Dev logging
if(process.env.NODE_ENV === 'development')
  {
    app.use(morgan('dev'));
  };

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default port
  credentials: true // Allow cookies to be sent with requests
}));

app.use(express.static(path.join(__dirname, "../frontend")));

/* //Testing for database server.
app.get("/test", async (req, res) => {
  const snapshot = await db.collection("users").get();
  const data = snapshot.docs.map(doc => doc.data());
  res.send(data);
});
 */

//Main Page
app.get("/", (req, res) => {
  const location = path.join(__dirname, "../frontend/index.html");
  res.sendFile(location);
});

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

app.use('/profile', authMiddleware, profileRoute);
app.use('/game-accounts', gameAccountsRoute);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/riot_information', RiotRoute);
app.use('/tournament', tournamentRoute);
app.use('/admin', adminRoute);

// Handle SPA routing - always return the main app for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});