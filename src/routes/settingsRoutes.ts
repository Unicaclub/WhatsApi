import { Router } from 'express';
import { getSettings, updateSettings } from '../controller/settingsController';
import verifyToken from '../middleware/auth';

const settingsRoutes = Router();

settingsRoutes.get('/api/settings', verifyToken, getSettings);
settingsRoutes.put('/api/settings', verifyToken, updateSettings);

export default settingsRoutes;
