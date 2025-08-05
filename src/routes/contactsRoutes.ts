import { Router } from 'express';
import { getContacts, getMessages, sendMessage } from '../controller/contactsController';
import verifyToken from '../middleware/auth';

const contactsRoutes = Router();

contactsRoutes.get('/api/contacts', verifyToken, getContacts);
contactsRoutes.get('/api/messages/:contactId', verifyToken, getMessages);
contactsRoutes.post('/api/messages', verifyToken, sendMessage);

export default contactsRoutes;
