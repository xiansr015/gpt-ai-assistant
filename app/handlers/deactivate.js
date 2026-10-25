import { COMMAND_BOT_DEACTIVATE, GENERAL_COMMANDS } from '../commands/index.js';
import Context from '../context.js';
import { updateHistory } from '../history/index.js';
import { updateSource } from '../repository/index.js';

/**
 * @param {Context} context
 * @returns {boolean}
 */
const check = (context) => context.hasCommand(COMMAND_BOT_DEACTIVATE);

/**
 * @param {Context} context
 * @returns {Promise<Context>}
 */
const exec = (context) => check(context) && (
  async () => {
    updateHistory(context.id, (history) => history.erase());
    try {
      updateSource(context.id, (source) => {
        source.bot.isActivated = false;
      });
      context.pushText(COMMAND_BOT_DEACTIVATE.reply, GENERAL_COMMANDS);
    } catch (err) {
      context.pushError(err);
    }
    return context;
  }
)();

export default exec;
