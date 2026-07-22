const Busboy = require('busboy');

function createUploadParser(headers, uploadLimit) {
  return Busboy({
    headers,
    defParamCharset: 'utf8',
    preservePath: true,
    limits: uploadLimit > 0 ? { fileSize: uploadLimit } : undefined
  });
}

module.exports = {
  createUploadParser
};
