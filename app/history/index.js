import storage, { TABLE_HISTORIES } from '../../storage/index.js';
import History from './history.js';
import Message from './message.js';

/**
 * @param {string} contextId
 * @returns {History}
 */
const getHistory = (contextId) => {
  const history = new History();
  const data = storage.getItem(TABLE_HISTORIES, contextId);
  if (data) history.messages = data.messages.map((message) => new Message(message));
  return history;
};

/**
 * @param {string} contextId
 * @param {History} history
 */
const setHistory = (contextId, history) => storage.setItem(TABLE_HISTORIES, contextId, history);

/**
 * @param {string} contextId
 * @param {function(History)} callback
 */
const updateHistory = (contextId, callback) => {
  const history = getHistory(contextId);
  callback(history);
  setHistory(contextId, history);
};

/**
 * @param {string} userId
 */
const removeHistory = (userId) => {
  storage.removeItem(TABLE_HISTORIES, userId);
};

const printHistories = () => {
  const messages = storage.keys(TABLE_HISTORIES)
    .filter((contextId) => getHistory(contextId).messages.length > 0)
    .map((contextId) => `\n=== ${contextId.slice(0, 6)} ===\n\n${getHistory(contextId).toString()}\n`);
  if (messages.length < 1) return;
  console.info(messages.join(''));
};

export {
  getHistory,
  setHistory,
  updateHistory,
  removeHistory,
  printHistories,
};

export default null;
