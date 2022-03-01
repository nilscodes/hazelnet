module.exports = {
  isValidISOTimestamp(timeString) {
    try {
      return new Date(timeString).toISOString().replace('.000', '') === timeString;
    } catch (e) {
      return false;
    }
  },
};
