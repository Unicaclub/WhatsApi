
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
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao registrar usuário.' });
  }
} 

// Login de usuário com validação de senha
export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Senha inválida.' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao fazer login.' });
  }
}

