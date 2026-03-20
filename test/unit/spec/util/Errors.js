/* eslint no-unused-expressions: 0 */

const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const ERROR_MESSAGES = require('../../../../lib/util/errors');

describe('ERROR_MESSAGES', () => {
  describe('error message constants', () => {
    it('should export ERROR_MESSAGES object', () => {
      assert.isObject(ERROR_MESSAGES);
    });

    it('should contain activity error messages', () => {
      expect(ERROR_MESSAGES.ActivityInstantiationError_PayloadRequired).to.equal('Error instantiating Activity: <Object>payload is a required parameter');
      expect(ERROR_MESSAGES.ActivityInstantiationError_WorkerRequired).to.equal('Error instantiating Activity: <Worker>worker is a required parameter');
      expect(ERROR_MESSAGES.ActivityEmitEventCallError_PayloadRequired).to.equal('Error calling method _emitEvent(). <Object>payload is a required parameter.');
      expect(ERROR_MESSAGES.ActivityEmitEventCallError_EventTypeRequired).to.equal('Error calling method _emitEvent(). <Object>payload is a required parameter.');
    });

    it('should contain channel error messages', () => {
      expect(ERROR_MESSAGES.ChannelInstantiationError_PayloadRequired).to.equal('Error instantiating Channel: <Object>payload is a required parameter');
      expect(ERROR_MESSAGES.ChannelInstantiationError_ConfigRequired).to.equal('Error instantiating Channel: <Configuration>config is a required parameter');
      expect(ERROR_MESSAGES.ChannelSetAvailabilityCallError_IsAvailableRequired).to.equal('Error calling method setAvailability(). <boolean>isAvailable is a required parameter.');
      expect(ERROR_MESSAGES.ChannelSetCapacityCallError_CapacityRequired).to.equal('Error calling method setCapacity(). <int>capacity is a required parameter.');
      expect(ERROR_MESSAGES.ChannelEmitEventCallError_EventTypeRequired).to.equal('Error calling _emitEvent(). <string>eventType is a required parameter.');
      expect(ERROR_MESSAGES.ChannelEmitEventCallError_PayloadRequired).to.equal('Error calling method _emitEvent(). <object>payload is a required parameter.');
    });

    it('should contain reservation error messages', () => {
      expect(ERROR_MESSAGES.ReservationInstantiationError_PayloadRequired).to.equal('Error instantiating Reservation: <Object>payload is a required parameter');
      expect(ERROR_MESSAGES.ReservationInstantiationError_ConfigRequired).to.equal('Error instantiating Reservation: <Configuration>config is a required parameter');
      expect(ERROR_MESSAGES.ReservationCallInstructionError_FromRequired).to.equal('Unable to issue Instruction: call on Reservation. <string>from is a required parameter.');
      expect(ERROR_MESSAGES.ReservationCallInstructionError_UrlRequired).to.equal('Unable to issue Instruction: call on Reservation. <string>url is a required parameter.');
      expect(ERROR_MESSAGES.ReservationRedirectInstructionError_CallSidRequired).to.equal('Unable to issue Instruction: redirect on Reservation. <string>callSid is a required parameter.');
      expect(ERROR_MESSAGES.ReservationRedirectInstructionError_UrlRequired).to.equal('Unable to issue Instruction: redirect on Reservation. <string>url is a required parameter.');
    });

    it('should contain task error messages', () => {
      expect(ERROR_MESSAGES.TaskInstantiationError_PayloadRequired).to.equal('Error instantiating Task: <Object>payload is a required parameter.');
      expect(ERROR_MESSAGES.TaskInstantiationError_ConfigRequired).to.equal('Error instantiating Task: <Configuration>config is a required parameter.');
      expect(ERROR_MESSAGES.TaskCompletedError_ReasonRequired).to.equal('A reason must be provided to move a Task to the \'Completed\' state. <string>reason is a required parameter.');
    });

    it('should contain worker error messages', () => {
      expect(ERROR_MESSAGES.WorkerError_InitializationFailed).to.equal('Unable to initialize Worker');
      expect(ERROR_MESSAGES.WorkerInstantiationError_TokenRequired).to.equal('Unable to instantiate Worker. <string>token is a required parameter.');
      expect(ERROR_MESSAGES.WorkerFetchTasksError_ReservationStatusRequired).to.equal('Unable to fetch Tasks. <string> reservationStatus is a required parameter.');
      expect(ERROR_MESSAGES.WorkerSetAttributesError_AttributesRequired).to.equal('Unable to set attributes on Worker. <string>attributes is a required parameter.');
      expect(ERROR_MESSAGES.WorkerUpdateTokenError_NewTokenRequired).to.equal('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
      expect(ERROR_MESSAGES.WorkerUpdateActivityError_ActivitySidRequired).to.equal('Unable to update Worker activity. <string>activitySid is a required parameter.');
    });

    it('should contain eventbridge signaling error messages', () => {
      expect(ERROR_MESSAGES.EventBridgeSignalingError_WorkerRequired).to.equal('<Worker>worker is a required parameter to construct EventBridgeSignaling.');
      expect(ERROR_MESSAGES.EventBridgeSignalingError_NewTokenRequired).to.equal('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
    });

    it('should contain configuration error messages', () => {
      expect(ERROR_MESSAGES.ConfigurationError_TokenRequired).to.equal('Unable to initialize Configuration. <string>token is required.');
      expect(ERROR_MESSAGES.ConfigurationError_NewTokenRequired).to.equal('To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.');
    });

    it('should contain logger error messages', () => {
      expect(ERROR_MESSAGES.LoggerInstantiationError_ModuleNameRequired).to.equal('Error instantiating Logger. <string>moduleName is a required parameter.');
      expect(ERROR_MESSAGES.LoggerInstantiationError_InvalidLogLevel).to.equal('Error instantiating Logger. <string>logLevel must be one of [\'trace\', \'debug\', \'info\', \'warn\', \'error\']');
    });

    it('should contain request error messages', () => {
      expect(ERROR_MESSAGES.RequestError_BadRequest).to.equal('Bad request.');
      expect(ERROR_MESSAGES.RequestJwtError_TokenExpired).to.equal('JWT token has expired. Update token.');
      expect(ERROR_MESSAGES.RequestJwtError_InvalidTokenOrAccessPolicy).to.equal('Problems verifying JWT token during request to Twilio server. Invalid JWT or Access Policy.');
      expect(ERROR_MESSAGES.RequestError_InvalidEndpoint).to.equal('Invalid endpoint.');
      expect(ERROR_MESSAGES.RequestError_InternalError).to.equal('Internal error occurred.');
      expect(ERROR_MESSAGES.RequestError_ErrorMakingRequest).to.equal('Error making request.');
    });

    it('should contain tools error messages', () => {
      expect(ERROR_MESSAGES.GenericUpdatePropertiesError_TargetRequired).to.equal('Unable to update properties. <Object>target is a required parameter.');
      expect(ERROR_MESSAGES.GenericUpdatePropertiesError_SourceRequired).to.equal('Unable to update properties. <Object>source is a required parameter.');
      expect(ERROR_MESSAGES.GenericUpdatePropertiesError__TypeRequired).to.equal('Unable to update properties. <string>type is a required parameter.');
      expect(ERROR_MESSAGES.GenericJwtError_TokenRequired).to.equal('Unable to verify JWT. <string>token is a required parameter.');
      expect(ERROR_MESSAGES.GenericJwtError_MalformedToken).to.equal('Twilio access token malformed. Unable to decode token.');
      expect(ERROR_MESSAGES.GenericJwtError_MissingField).to.equal('Twilio access token is malformed. Missing one of: grants.task_router, iss, or sub fields.');
      expect(ERROR_MESSAGES.GenericJwtError_GrantMissingRole).to.equal('Twilio access token missing required \'role\' parameter in the TaskRouter grant.');
    });

    it('should contain constants error messages', () => {
      expect(ERROR_MESSAGES.DefaultError_InvalidArgument).to.equal('One or more arguments passed were invalid.');
      expect(ERROR_MESSAGES.DefaultError_InvalidToken).to.equal('The token is invalid or malformed.');
      expect(ERROR_MESSAGES.DefaultError_TokenExpired).to.equal('Worker\'s active token has expired.');
      expect(ERROR_MESSAGES.DefaultError_GatewayConnectionFailed).to.equal('Could not connect to Twilio\'s servers.');
      expect(ERROR_MESSAGES.DefaultError_GatewayDisconnected).to.equal('Connection to Twilio\'s servers was lost.');
      expect(ERROR_MESSAGES.DefaultError_InvalidGatewayMessage).to.equal('The JSON message received was malformed.');
      expect(ERROR_MESSAGES.DefaultError_TaskrouterError).to.equal('TaskRouter failed to completed the request.');
    });

    it('should have all error messages as strings', () => {
      Object.keys(ERROR_MESSAGES).forEach(key => {
        expect(ERROR_MESSAGES[key]).to.be.a('string');
        expect(ERROR_MESSAGES[key].length).to.be.greaterThan(0);
      });
    });

    it('should have at least 35 error messages defined', () => {
      const errorCount = Object.keys(ERROR_MESSAGES).length;
      expect(errorCount).to.be.at.least(35);
    });
  });
});
