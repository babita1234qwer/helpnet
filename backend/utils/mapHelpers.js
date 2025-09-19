/**
 * Generate an OpenStreetMap URL for a given location
 * @param {Object} location - Location object with coordinates
 * @returns {String} OpenStreetMap URL
 */
const getOpenStreetMapUrl = (location) => {
  if (!location || !location.coordinates || location.coordinates.length < 2) {
    return null;
  }
  
  const [longitude, latitude] = location.coordinates;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
};

module.exports = {
  getOpenStreetMapUrl
};