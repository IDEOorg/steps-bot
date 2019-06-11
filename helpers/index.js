const isProductionEnvironment = () => (process.env.NODE_ENV === 'production');
const isStagingEnvironment = () => (process.env.NODE_ENV === 'staging');
const isActive = user => user.active;

module.exports = {
  isProductionEnvironment,
  isStagingEnvironment,
  isActive
};
