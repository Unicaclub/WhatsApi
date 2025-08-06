import { Router } from 'express';
import { registerUser, loginUser } from '../controller/userController';
import verifyToken from '../middleware/auth';


const userRoutes = Router();
// Registro
userRoutes.post('/register', registerUser);
// Login
userRoutes.post('/login', loginUser);

// Rota de teste POST
userRoutes.post('/test', (req, res) => {
  res.json({ success: true, message: 'POST /test funcionando!', body: req.body });
});

export default userRoutes;
