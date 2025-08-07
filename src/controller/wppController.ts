export const sendImage = async (req: Request, res: Response) => {
  const { to, path, filename, caption, session } = req.body;
  if (!to || !path || !filename || !caption || !session) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, path, filename, caption, session' });
  try {
    const result = await wppService.sendImage(to, path, filename, caption, session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendFile = async (req: Request, res: Response) => {
  const { to, path, filename, caption, session } = req.body;
  if (!to || !path || !filename || !caption || !session) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, path, filename, caption, session' });
  try {
    const result = await wppService.sendFile(to, path, filename, caption, session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendImageAsSticker = async (req: Request, res: Response) => {
  const { to, path, session } = req.body;
  if (!to || !path || !session) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, path, session' });
  try {
    const result = await wppService.sendImageAsSticker(to, path, session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
import * as wppSessionService from '../services/wppSessionService';

export async function startSession(req: Request, res: Response) {
  const { session } = req.body;
  if (!session) return res.status(400).json({ error: 'Informe o nome da sessão.' });
  try {
    const client = await wppSessionService.createSession(session);
    res.json({ status: 'started', session });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao iniciar sessão', details: err });
  }
}

export function listSessions(req: Request, res: Response) {
  res.json(wppSessionService.listSessions());
}

export function removeSession(req: Request, res: Response) {
  const { session } = req.params;
  wppSessionService.removeSession(session);
  res.json({ status: 'removed', session });
}
// Controller para expor as funções do WPPConnect via REST
import { Request, Response } from 'express';
import * as wppService from '../services/wppService';

export const sendText = async (req: Request, res: Response) => {
  const { to, message, session } = req.body;
  if (!to || !message || !session) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, message, session' });
  try {
    const result = await wppService.sendText(to, message, session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendContactVcard = async (req: Request, res: Response) => {
  const { to, contactId, name, session } = req.body;
  if (!to || !contactId || !name || !session) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, contactId, name, session' });
  try {
    const result = await wppService.sendContactVcard(to, contactId, name, session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendContactVcardList = async (req: Request, res: Response) => {
  const { to, contacts, session } = req.body;
  if (!to || !contacts || !session) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, contacts, session' });
  try {
    const result = await wppService.sendContactVcardList(to, contacts, session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendLocation = async (req: Request, res: Response) => {
  const { to, lat, lng, title, session } = req.body;
  if (!to || !lat || !lng || !title || !session) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, lat, lng, title, session' });
  try {
    const result = await wppService.sendLocation(to, lat, lng, title, session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const sendLinkPreview = async (req: Request, res: Response) => {
  const { to, url, caption, session } = req.body;
  if (!to || !url || !caption || !session) return res.status(400).json({ error: 'Parâmetros obrigatórios: to, url, caption, session' });
  try {
    const result = await wppService.sendLinkPreview(to, url, caption, session);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ... Adicione os demais métodos seguindo o mesmo padrão ...
