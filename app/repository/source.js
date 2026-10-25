import storage, { TABLE_SOURCES } from '../../storage/index.js';
import { Source } from '../models/index.js';

/**
 * @param {string} id
 * @returns {Source|undefined}
 */
const getSource = (id) => storage.getItem(TABLE_SOURCES, id);

/**
 * @param {string} id
 * @param {Source} source
 */
const setSource = (id, source) => storage.setItem(TABLE_SOURCES, id, source);

/**
 * @param {string} type
 * @returns {number}
 */
const countSources = (type) => storage.count(TABLE_SOURCES, 'type', type);

/**
 * @param {string} contextId
 * @param {function(Source)} callback
 */
const updateSource = (contextId, callback) => {
  const source = getSource(contextId);
  callback(source);
  setSource(contextId, source);
};

export {
  getSource,
  setSource,
  countSources,
  updateSource,
};
