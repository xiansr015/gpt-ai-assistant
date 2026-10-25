import storage, { TABLE_PROMPTS } from '../../storage/index.js';
import Message from './message.js';
import Prompt from './prompt.js';

/**
 * @param {string} userId
 * @returns {Prompt}
 */
const getPrompt = (userId) => {
  const prompt = new Prompt();
  const data = storage.getItem(TABLE_PROMPTS, userId);
  if (data) prompt.messages = data.messages.map((message) => new Message(message));
  return prompt;
};

/**
 * @param {string} userId
 * @param {Prompt} prompt
 */
const setPrompt = (userId, prompt) => {
  storage.setItem(TABLE_PROMPTS, userId, prompt);
};

/**
 * @param {string} userId
 */
const removePrompt = (userId) => {
  storage.removeItem(TABLE_PROMPTS, userId);
};

const printPrompts = () => {
  const userIds = storage.keys(TABLE_PROMPTS);
  if (userIds.length < 1) return;
  const content = userIds.map((userId) => `\n=== ${userId.slice(0, 6)} ===\n${getPrompt(userId)}\n`).join('');
  console.info(content);
};

export {
  Prompt,
  getPrompt,
  setPrompt,
  removePrompt,
  printPrompts,
};

export default null;
