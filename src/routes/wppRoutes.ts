
import { Router } from 'express';
import * as wppController from '../controller/wppController';

const router = Router();

// Rotas REST para expor as funções do WPPConnect
router.post('/send-image', wppController.sendImage);
router.post('/send-file', wppController.sendFile);
router.post('/send-sticker', wppController.sendImageAsSticker);

router.post('/send-text', wppController.sendText);
router.post('/send-contact-vcard', wppController.sendContactVcard);
router.post('/send-contact-vcard-list', wppController.sendContactVcardList);
router.post('/send-location', wppController.sendLocation);
router.post('/send-link-preview', wppController.sendLinkPreview);

// Sessão
router.post('/session/start', wppController.startSession);
router.get('/session/list', wppController.listSessions);
router.delete('/session/:session', wppController.removeSession);

export default router;
