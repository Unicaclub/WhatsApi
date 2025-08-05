/*
 * Repository Index
 * Exports all repository classes
 */

export { AutomationRepository } from './AutomationRepository';
export { ContactRepository } from './ContactRepository';
export { MessageRepository } from './MessageRepository';

// Create singleton instances
import { AutomationRepository } from './AutomationRepository';
import { ContactRepository } from './ContactRepository';
import { MessageRepository } from './MessageRepository';

export const automationRepository = new AutomationRepository();
export const contactRepository = new ContactRepository();
export const messageRepository = new MessageRepository();