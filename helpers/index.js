const isProductionEnvironment = () => (process.env.NODE_ENV === 'production');
const isStagingEnvironment = () => (process.env.NODE_ENV === 'staging');

module.exports = {
  isProductionEnvironment,
  isStagingEnvironment
};
