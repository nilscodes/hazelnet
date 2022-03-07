module.exports = {
  isValidISOTimestamp(timeString) {
    try {
      return new Date(timeString).toISOString().replace('.000', '') === timeString;
    } catch (e) {
      return false;
    }
  },
  getUTCDateFormatted(objectWithDate, dateProperty) {
    if (objectWithDate[dateProperty]) {
      return new Date(objectWithDate[dateProperty]).toISOString().replace(/\.[0-9]{3}Z$/, '').replace('T', ' ');
    }
    return '';
  },
};
