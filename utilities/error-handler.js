const log4js = require('log4js');

const log = log4js.getLogger('error-handler');
/**
 * This function handles errors in async methods and functions
 * @param {func} methodOrFunction
 * @param {string} customMessage
 */
module.exports = async function handleError(methodOrFunction, customMessage) {
  try {
    const returnedValue = await methodOrFunction;
    return returnedValue;
  } catch (error) {
    error.custom = 'There has been an error. ' + customMessage;
    log.error(error.custom, error);
  }
};
