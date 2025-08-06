import { Router } from 'express';
import { registerUser, loginUser } from '../controller/userController';
import verifyToken from '../middleware/auth';

const userRoutes = Router();
// Registro
userRoutes.post('/api/register', registerUser);
// Login
userRoutes.post('/api/login', loginUser);

 
export default userRoutes;
