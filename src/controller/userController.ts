
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../database/models/User';

const SECRET_KEY = process.env.SECRET_KEY || 'Mestre888';


// Cadastro de usuário com hash seguro
export async function registerUser(req: Request, res: Response) {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
  }
  try {
    const existingUser = await UserModel.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Usuário já cadastrado.' });
    }
    const hashedPassword = await bcrypt.hash(password, 14);
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      plan_type: 'free',
      api_key: uuidv4(),
      created_at: new Date(),
      updated_at: new Date()
    });
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ 
      success: true,
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        plan_type: user.plan_type,
        api_key: user.api_key
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
} 

// Login de usuário com validação de senha
export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }
  
  try {
    const user = await UserModel.findOne({ where: { email } });
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }
    
    console.log('Comparing passwords...');
    const valid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', valid);
    
    if (!valid) {
      return res.status(401).json({ message: 'Senha inválida.' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ 
      success: true,
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        plan_type: user.plan_type,
        api_key: user.api_key
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
}

