export default {
  isValidISOTimestamp(timeString: string) {
    try {
      return new Date(timeString).toISOString().replace('.000', '') === timeString;
    } catch (e) {
      return false;
    }
  },
  getUTCDateFormatted(objectWithDate: any, dateProperty: string) {
    if (objectWithDate[dateProperty]) {
      return new Date(objectWithDate[dateProperty]).toISOString().replace(/\.[0-9]{3}Z$/, '').replace('T', ' ');
    }
    return '';
  },
};
