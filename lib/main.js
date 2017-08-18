const dateFormat = require('dateformat');
const request = require('request');
const xml2js = require('xml2js');
const md5 = require('md5');

const Device = require('./device').Device;
const LiveEvent = require('./live-event').LiveEvent;
const Resource = require('./resource').Resource;

/**
 * @typedef {Object} ClientOptions
 * @property {{user:string, apiKey:string}} credentials
 * @property {boolean} parseJson Defaults false
 */
class ElementalClient {
  /**
   * 
   * @param {string} serverUrl 
   * @param {ClientOptions} options 
   */
  constructor(serverUrl, options) {
    this.req = request.defaults({
      headers: {'Accept': 'application/xml'},
      baseUrl: serverUrl,
    });
    this.credentials = false;
    this.options = options || {};
    if (this.options.credentials){
      this.credentials = this.options.credentials;
    }
    this.serverUrl = serverUrl.replace(/\/+$/, '');

    const resourceMap = {
      'presets': 'presets',
      'schedules': 'schedules',
      'liveEventProfiles': 'live_event_profiles',
      'presetCategories': 'preset_categories',
    };

    for (const methodName in resourceMap) {
      if (Reflect.apply(Object.prototype.hasOwnProperty, resourceMap, [methodName])) {
        this[methodName] = () => new Resource(this, resourceMap[methodName]);
      }
    }
  }

  sendRequest(method, path, qs, data, headers) {
    const reqHeaders = headers || {};
    const url = path;

    return new Promise((resolve, reject) => {
      let reqBody = null;

      if (data) {
        if (reqHeaders['Content-Type']) {
          reqBody = data;
        } else {
          reqBody = new xml2js.Builder({renderOpts: {pretty: false}}).buildObject(data);
          reqHeaders['Content-Type'] = 'application/xml';
        }
      }
      if (this.credentials){
        let expires = Math.round(Date.now() / 1000) + 5 * 60;
        reqHeaders['X-Auth-User'] = this.credentials.user;
        reqHeaders['X-Auth-Expires'] = expires;
        reqHeaders['X-Auth-Key'] = md5(this.credentials.apiKey + md5(url + this.credentials.user + this.credentials.apiKey + expires));
      }
      this.req({method, url, qs, headers: reqHeaders, body: reqBody},
        (err, resp, respBody) => {
          if (err) {
            reject(err);
          } else if (resp.statusCode > 299) {
            //TODO: try to parse output
            reject({statusCode: resp.statusCode, body: respBody});
          } else {
            const contentType = resp.headers['content-type'];

            if (contentType){
              if (contentType.match(/^application\/xml(;.+)?$/)) {
                const parser = new xml2js.Parser({
                  trim: true,
                  explicitArray: false,
                });
                parser.parseString(respBody, (xmlErr, respData) => {
                  if (xmlErr) {
                    reject({statusCode: resp.StatusCode, xmlErr, body: respBody});
                  } else {
                    resolve(respData);
                  }
                });
              } else if (this.options.parseJson === true && contentType.match(/^application\/json(;.+)?$/)) {
                try {
                  resolve(JSON.parse(respBody));
                } catch (error) {
                  reject(error);
                }
              } else {
                resolve(respBody);
              }
            } else {
              resolve(respBody);
            }
          }
        });
    });
  }

  liveEvents() {
    return new LiveEvent(this);
  }

  devices() {
    return new Device(this);
  }

  static formatDate(date) {
    return dateFormat(date, 'yyyy-mm-dd HH:MM:ss o', true);
  }

  static extractIdFromHref(obj) {
    const attrs = obj.$;

    if (attrs && attrs.href) {
      const match = attrs.href.match(/\d+$/);

      if (match) {
        return match[0];
      }
    }

    return '';
  }
}

module.exports = {ElementalClient};
