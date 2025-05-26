const path = require('path');
const glob = require('glob');
const { EventEmitter } = require('events');
const { Storage, Bucket } = require('@google-cloud/storage');

const FILE_EVENT_NAME = 'file';
const MAX_RETRY = 3;
const UPLOAD_TIMEOUT = '3000';
const BUCKET_NAME = 'teko-shopfront-cdn';

class CDNUploader {
  /**
   * @param {object} credentials
   * @param {Function} onFailed
   */
  constructor(credentials, onFailed) {
    this.event = new EventEmitter();
    const storage = new Storage({ credentials });
    this.bucket = new Bucket(storage, BUCKET_NAME);
    this.onFailed = onFailed;
  }

  registerHandler() {
    const self = this;

    function onUploadFile(filename, path, retry = 0) {
      if (retry > MAX_RETRY) {
        if (self.onFailed) self.onFailed();
      }

      self.bucket
        .upload(filename, {
          destination: path,
          timeout: UPLOAD_TIMEOUT,
          gzip: true,
          metadata: {
            cacheControl: 'public, max-age=31536000',
          },
        })
        .catch((reason) => {
          self.event.emit(FILE_EVENT_NAME, filename, path, retry + 1);
          console.warn({ filename, reason });
        });
    }

    self.event.on(FILE_EVENT_NAME, onUploadFile);
  }

  /**
   * @param {string} dir
   * @param {string} basePath
   */
  upload(dir, basePath) {
    this.registerHandler();

    try {
      const files = glob.sync('**/*', { cwd: dir, nodir: true });
      for (const file of files) {
        const filename = path.join(dir, file);
        const url = path.join(basePath, file);
        this.event.emit(FILE_EVENT_NAME, filename, url);
      }
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = {
  CDNUploader,
};
