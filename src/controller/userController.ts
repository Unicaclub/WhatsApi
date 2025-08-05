import crypto from 'crypto';
// Simulação de tokens de sessão por usuário
const userSessionTokens: Record<string, Record<string, string>> = {};

// Gera um token seguro (bcrypt-like)
function generateSessionToken(): string {
  return '$2b$10$' + crypto.randomBytes(22).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 53);
}

// Endpoint: POST /api/:session/:secretkey/generate-token
export async function generateSessionTokenForUser(req: any, res: any) {
  const { session, secretkey } = req.params;
  // Usuário autenticado (mock: req.user.email)
  const userId = req.user?.email || req.user?.id || 'default';
  if (!session || !secretkey) {
    return res.status(400).json({ message: 'Session e secretkey são obrigatórios.' });
  }
  // Gera e salva o token para o usuário/sessão
  if (!userSessionTokens[userId]) userSessionTokens[userId] = {};
  const token = generateSessionToken();
  userSessionTokens[userId][session] = token;
  return res.json({ token });
}
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Simulação de banco de dados em memória
const users: any[] = [];

const SECRET_KEY = process.env.SECRET_KEY || 'Mestre888';

export async function registerUser(req: Request, res: Response) {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
  }
  const userExists = users.find(u => u.email === email);
  if (userExists) {
    return res.status(409).json({ message: 'Usuário já cadastrado.' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, email, password: hashedPassword, name };
  users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

export async function loginUser(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Usuário não encontrado.' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Senha inválida.' });
  }
  const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

export async function getProfile(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user?.id;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json({ id: user.id, email: user.email, name: user.name });
}

export async function updateProfile(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user?.id;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
  const { name, password } = req.body;
  if (name) user.name = name;
  if (password) user.password = await bcrypt.hash(password, 10);
  res.json({ id: user.id, email: user.email, name: user.name });
}
