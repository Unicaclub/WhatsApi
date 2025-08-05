import { Router } from 'express';
import { registerUser, loginUser, getProfile, updateProfile, generateSessionTokenForUser } from '../controller/userController';
// Geração de token de sessão por usuário
userRoutes.post('/api/:session/:secretkey/generate-token', generateSessionTokenForUser);
import verifyToken from '../middleware/auth';

const userRoutes = Router();

// Registro
userRoutes.post('/api/register', registerUser);
// Login
userRoutes.post('/api/login', loginUser);
// Perfil
userRoutes.get('/api/profile', verifyToken, getProfile);
userRoutes.put('/api/profile', verifyToken, updateProfile);

export default userRoutes;
