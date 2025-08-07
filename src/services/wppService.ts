export async function sendImage(to: string, path: string, caption: string, session: string) {
  const client = getSession(session) || await createSession(session);
  return client.sendImage(to, path, 'image', caption);
}

export async function sendFile(to: string, path: string, filename: string, caption: string, session: string) {
  const client = getSession(session) || await createSession(session);
  return client.sendFile(to, path, filename, caption);
}

export async function sendImageAsSticker(to: string, path: string, session: string) {
  const client = getSession(session) || await createSession(session);
  return client.sendImageAsSticker(to, path);
}
// Serviço central para integração com WPPConnect
// Cada função básica do WPPConnect exposta como método

import { getSession, createSession } from './wppSessionService';

export const sendText = async (to: string, message: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendText(to, message);
};

export const sendContactVcard = async (to: string, contactId: string, name: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendContactVcard(to, contactId, name);
};

export const sendContactVcardList = async (to: string, contacts: string[], session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendContactVcardList(to, contacts);
};

export const sendLocation = async (to: string, lat: string, lng: string, title: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendLocation(to, lat, lng, title);
};

export const sendLinkPreview = async (to: string, url: string, caption: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendLinkPreview(to, url, caption);
};

export const sendImage = async (to: string, path: string, filename: string, caption: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendImage(to, path, filename, caption);
};

export const sendFile = async (to: string, path: string, filename: string, caption: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendFile(to, path, filename, caption);
};

export const sendFileFromBase64 = async (to: string, base64: string, filename: string, caption: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendFileFromBase64(to, base64, filename, caption);
};

export const sendImageAsSticker = async (to: string, path: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendImageAsSticker(to, path);
};

export const sendImageAsStickerGif = async (to: string, path: string, session: string) => {
  const client = getSession(session) || await createSession(session);
  return client.sendImageAsStickerGif(to, path);
};

// Adicione aqui as versões multi-sessão se desejar expor essas funções
