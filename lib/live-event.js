const resource = require('./resource');
const headers = {'Accept': 'application/json'};

class LiveEvent extends resource.Resource {
  constructor(elementalClient) {
    super(elementalClient, 'live_events');

    // these operations are mapped to methods named <operation>Event, that
    // modifies the event. For example: startEvent, stopEvent and resetEvent.
    ['start', 'stop', 'cancel', 'archive', 'reset'].forEach((opName) => {
      this[`${opName}Event`] = (eventId) => this.elementalClient.sendRequest('POST', `/api/live_events/${eventId}/${opName}`);
    });
  }

  eventStatus(eventId) {
    return this.elementalClient.sendRequest('GET', `/api/live_events/${eventId}/status`, null, null, headers);
  }

  listInputs(eventId) {
    return this.elementalClient.sendRequest('GET', `/api/live_events/${eventId}/inputs`);
  }

  muteEvent(eventId) {
    return this.elementalClient.sendRequest('POST', `/api/live_events/${eventId}/mute_audio`);
  }

  unmuteEvent(eventId) {
    return this.elementalClient.sendRequest('POST', `/api/live_events/${eventId}/unmute_audio`);
  }

  adjustAudioGain(eventId, gain) {
    return this.elementalClient.sendRequest('POST', `/api/live_events/${eventId}/adjust_audio_gain`, null, {gain});
  }

  eventPriority(eventId) {
    return this.elementalClient.sendRequest('GET', `/api/live_events/${eventId}/priority`);
  }

  setEventPriority(eventId, priority) {
    return this.elementalClient.sendRequest('POST', `/api/live_events/${eventId}/priority`, null, {priority});
  }

  eventProgressPreview(eventId) {
    return `${this.elementalClient.serverUrl}/images/thumbs/progress_job_${eventId}.jpg`;
  }

  activateInput(eventId, input_id) {
    return this.elementalClient.sendRequest('POST', `/api/live_events/${eventId}/activate_input`, null, {input_id});
  }

  pauseOutputGroup(eventId, group_id) {
    return this.elementalClient.sendRequest('POST', `/api/live_events/${eventId}/pause_output_group`, null, {group_id});
  }

  unPauseOutputGroup(eventId, group_id) {
    return this.elementalClient.sendRequest('POST', `/api/live_events/${eventId}/unpause_output_group`, null, {group_id});
  }
}

module.exports = {LiveEvent};
