import { Request, Response } from 'express';

// Simulação de settings em memória
let settings: any = {
  theme: 'light',
  notifications: true,
  language: 'pt-BR',
};

export function getSettings(req: Request, res: Response) {
  res.json(settings);
}

export function updateSettings(req: Request, res: Response) {
  settings = { ...settings, ...req.body };
  res.json(settings);
}
