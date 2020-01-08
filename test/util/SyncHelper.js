import { SyncClient } from 'twilio-sync';

export default class SyncHelper {
  constructor(token, options = {}) {
    console.log(options);
    try {
      this.client = new SyncClient(token, options);
    } catch (err) {
      console.log('Error: ' + err);
    }
  }
  createMap(name) {
   return this.client.map({
     id: name,
     mode: 'create_new'
   });
  }
  openMap(name) {
    return this.client.map({
      id: name,
      mode: 'open_existing'
    });
  }

  getConferenceStateMap(taskSid) {
    console.log(taskSid + '.CS');
    return this.client.map({
      id: taskSid + '.CS',
      mode: 'open_existing'
    });
  }
  async removeMap(name) {
    const map = await this.openMap(name).catch(() => {});
    if (map) {
      await map.removeMap();
    }
  }
}
