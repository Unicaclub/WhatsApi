import { Router } from 'express';
import { registerUser, loginUser } from '../controller/userController';
import verifyToken from '../middleware/auth';


const userRoutes = Router();
// Registro
userRoutes.post('/api/register', registerUser);
// Login
userRoutes.post('/api/login', loginUser);

// Rota de teste POST
userRoutes.post('/api/test', (req, res) => {
  res.json({ success: true, message: 'POST /api/test funcionando!', body: req.body });
});

export default userRoutes;
