import config from '../config/index.js';

/**
 * @param {string} userId
 * @param {Array<string>} allowedUserIds
 * @returns {boolean}
 */
const isAllowedUser = (userId, allowedUserIds = config.APP_ALLOWED_USER_IDS) => (
  allowedUserIds.length < 1 || allowedUserIds.includes(userId)
);

export default isAllowedUser;
