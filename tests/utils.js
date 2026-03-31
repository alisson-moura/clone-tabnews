function extractUUIDFromText(text) {
  const uuidRegex = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/;
  const match = text.match(uuidRegex);
  return match ? match[0] : null;
}

const utils = {
  extractUUIDFromText,
};

export default utils;
