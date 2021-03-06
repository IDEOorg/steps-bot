/**
 * This function handles errors in async methods and functions
 * @param {func} methodOrFunction
 * @param {string} customMessage
 * @returns {any} returns the output from the method or function
 */
module.exports = async function handleError(methodOrFunction, customMessage) {
  try {
    const returnedValue = await methodOrFunction;
    return returnedValue;
  } catch (error) {
    error.custom = `There has been an error. ${customMessage}`;
    console.log(error.custom, error);
  }
};
