import wppconnect, { Whatsapp } from '@wppconnect-team/wppconnect';

interface SessionMap {
  [key: string]: Whatsapp;
}

const sessions: SessionMap = {};

export async function createSession(sessionName: string, options: any = {}): Promise<Whatsapp> {
  if (sessions[sessionName]) return sessions[sessionName];
  const client = await wppconnect.create({
    session: sessionName,
    ...options,
    catchQR: (base64Qr: string, asciiQR: string, attempts: number, urlCode: string) => {
      // Aqui você pode salvar o QR ou expor via endpoint/socket
      console.log(`[${sessionName}] QR gerado (${attempts} tentativas)`);
    },
    statusFind: (statusSession: string, session: string) => {
      console.log(`[${session}] Status: ${statusSession}`);
    }
  });
  sessions[sessionName] = client;
  return client;
}

export function getSession(sessionName: string): Whatsapp | undefined {
  return sessions[sessionName];
}

export function listSessions(): string[] {
  return Object.keys(sessions);
}

export function removeSession(sessionName: string): void {
  if (sessions[sessionName]) {
    sessions[sessionName].close();
    delete sessions[sessionName];
  }
}
