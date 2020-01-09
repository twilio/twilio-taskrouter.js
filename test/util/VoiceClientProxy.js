import { EventEmitter } from 'events';
import { poll } from './VoiceHelper';

class VoiceClientProxy extends EventEmitter {
  constructor(syncMap, workerName) {
    super();
    this.map = syncMap;
    this.name = workerName;
  }
  accept() {
    this.map.set('call#accept', {});
  }
  reject() {
    this.map.set('call#reject', {});
  }
  ignore() {
    this.map.set('call#ignore', {});
  }
  disconnect() {
    this.map.set('call#disconnect', {});
  }
  mute() {
    this.map.set('call#mute', {});
  }
  unmute() {
    this.map.set('call#unmute', {});
  }
  // For certain events, such as device#ready, it is safer to poll sync map directly until key is found
  async waitForEvent(eventName, attempts) {
    await poll(this.map, eventName, `Did not find event: ${eventName} for worker: ${this.name}`, attempts);
  }
  // Can be used to call another client directly by identity or to twilio phone number. Do note that on average it takes longer to create a reservation this way
  async call(to) {
    await this.map.set('make#call', { to: to });
  }
  async refreshBrowserClient() {
    await this.map.set('browser#reset', {});
  }
}

export const voiceClientProxy = async(syncClient, workerName) => {
  // Create new worker voice event map
  const syncMap = await syncClient.openMap(workerName);

  const eventProxy = new VoiceClientProxy(syncMap, workerName);

  // Attach Event proxy to emit on non-local Sync events
  syncMap.on('itemAdded', args => {
    // Ensure that we are listening only on Sync events which origin is browser
    if (!args.isLocal) {
      /**
       * In case it emits error, it will include both the origin of the error,
       * as well as the error itself in case of pre-defined errors e.g., device#error
       * or custom errors e.g., trying to mute call while call is not active
       * You can selectively choose how to handle them in the tests themselves.
       *
       * This logic is meant to give us ability to selectively interact with errors, throw
       * for unexpected ones or validate that the error occurred if test logic is testing that
       */
      if (args.item.key.includes('error')) {
        eventProxy.emit('error', {
          origin: args.item.key,
          error: args.item.value
        });
      } else {
        eventProxy.emit(args.item.key, args.item.value);
      }
    }
  });

  return eventProxy;
};
