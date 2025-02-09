import express from "express";
import cors from "cors";
import fetch from "node-fetch"; 
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import session from "express-session";

//Routes
import loginRoute from './routes/controllers/login.js'
import registerRoute from './routes/controllers/register.js'

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

app.use(cors());
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

app.use('/login', loginRoute);
app.use('/register', registerRoute);
/* //Route -> users Log in/Sign up
app.use('/riot/info',riotInfoRoute);
app.use('/users/register',usersRegisterRoutes);
app.use('/users/login',usersLoginRoute);
 */

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});