import express from 'express';
import tournamentController from '../controllers/tournamentController.js';

const router = express.Router();

// Tüm turnuva route'larını controller'dan alıyoruz
export default tournamentController;