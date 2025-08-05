import { Request, Response } from 'express';

// Simulação de contatos e mensagens em memória
const contacts = [
  { id: '1', name: 'João Silva', phone: '+5511999999999' },
  { id: '2', name: 'Maria Souza', phone: '+5511888888888' },
];

const messages: any = {
  '1': [
    { id: 'm1', from: 'me', to: '1', text: 'Olá João!', timestamp: Date.now() - 60000 },
    { id: 'm2', from: '1', to: 'me', text: 'Oi!', timestamp: Date.now() - 50000 },
  ],
  '2': [
    { id: 'm3', from: 'me', to: '2', text: 'Oi Maria!', timestamp: Date.now() - 40000 },
  ],
};

export function getContacts(req: Request, res: Response) {
  res.json(contacts);
}

export function getMessages(req: Request, res: Response) {
  const { contactId } = req.params;
  res.json(messages[contactId] || []);
}

export function sendMessage(req: Request, res: Response) {
  const { to, text } = req.body;
  if (!to || !text) return res.status(400).json({ message: 'Destinatário e texto obrigatórios.' });
  const msg = { id: `m${Date.now()}`, from: 'me', to, text, timestamp: Date.now() };
  if (!messages[to]) messages[to] = [];
  messages[to].push(msg);
  res.json(msg);
}
