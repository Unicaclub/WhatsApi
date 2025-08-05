/*
 * Database Models Index
 * Exports all models and sets up associations
 */

export { UserModel } from './User';
export { ContactModel } from './Contact';
export { AutomationModel } from './Automation';
export { MessageModel } from './Message';
export { MessageTemplateModel } from './MessageTemplate';
export { QueueJobModel } from './QueueJob';
export { AnalyticsModel } from './Analytics';

// Import all models to ensure they are initialized
import './User';
import './Contact';
import './Automation';
import './Message';
import './MessageTemplate';
import './QueueJob';
import './Analytics';

// Additional associations can be defined here if needed
import { UserModel } from './User';
import { ContactModel } from './Contact';
import { AutomationModel } from './Automation';
import { MessageModel } from './Message';
import { MessageTemplateModel } from './MessageTemplate';

// Set up additional associations
UserModel.hasMany(ContactModel, { foreignKey: 'user_id', as: 'contacts' });
UserModel.hasMany(AutomationModel, { foreignKey: 'user_id', as: 'automations' });
UserModel.hasMany(MessageModel, { foreignKey: 'user_id', as: 'messages' });
UserModel.hasMany(MessageTemplateModel, { foreignKey: 'user_id', as: 'templates' });

ContactModel.hasMany(MessageModel, { foreignKey: 'contact_id', as: 'messages' });

AutomationModel.hasMany(MessageModel, { foreignKey: 'automation_id', as: 'messages' });