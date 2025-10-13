/* eslint-disable */
'use strict';


/**
 * This contains a list of all error messages that could make their way to the consumer of the SDK.
 * All new error messages should be added to this list and it's reference can be used in the rest of the SDK.
 * The error messages are split by file names. It is ok to have duplicates since it makes us less probe to mistakes.
 * The variable naming convention is [SomethingAboutTheError]_[SomethingAboutTheErrorMessage]
 * The variable names need not be very detailed.
 *
 */
const ERROR_MESSAGES = {

    //activity.js
    ActivityInstantiationError_PayloadRequired: 'Error instantiating Activity: <Object>payload is a required parameter',
    ActivityInstantiationError_WorkerRequired: 'Error instantiating Activity: <Worker>worker is a required parameter',
    ActivityEmitEventCallError_PayloadRequired: 'Error calling method _emitEvent(). <Object>payload is a required parameter.',
    ActivityEmitEventCallError_EventTypeRequired: 'Error calling method _emitEvent(). <Object>payload is a required parameter.',

    //channel.js
    ChannelInstantiationError_PayloadRequired: 'Error instantiating Channel: <Object>payload is a required parameter',
    ChannelInstantiationError_ConfigRequired: 'Error instantiating Channel: <Configuration>config is a required parameter',
    ChannelSetAvailabilityCallError_IsAvailableRequired: 'Error calling method setAvailability(). <boolean>isAvailable is a required parameter.',
    ChannelSetCapacityCallError_CapacityRequired: 'Error calling method setCapacity(). <int>capacity is a required parameter.',
    ChannelEmitEventCallError_EventTypeRequired: 'Error calling _emitEvent(). <string>eventType is a required parameter.',
    ChannelEmitEventCallError_PayloadRequired: 'Error calling method _emitEvent(). <object>payload is a required parameter.',

    //reservation.js
    ReservationInstantiationError_PayloadRequired: 'Error instantiating Reservation: <Object>payload is a required parameter',
    ReservationInstantiationError_ConfigRequired: 'Error instantiating Reservation: <Configuration>config is a required parameter',
    ReservationCallInstructionError_FromRequired: 'Unable to issue Instruction: call on Reservation. <string>from is a required parameter.',
    ReservationCallInstructionError_UrlRequired: 'Unable to issue Instruction: call on Reservation. <string>url is a required parameter.',
    ReservationRedirectInstructionError_CallSidRequired: 'Unable to issue Instruction: redirect on Reservation. <string>callSid is a required parameter.',
    ReservationRedirectInstructionError_UrlRequired: 'Unable to issue Instruction: redirect on Reservation. <string>url is a required parameter.',

    //task.js
    TaskInstantiationError_PayloadRequired: 'Error instantiating Task: <Object>payload is a required parameter.',
    TaskInstantiationError_ConfigRequired: 'Error instantiating Task: <Configuration>config is a required parameter.',
    TaskCompletedError_ReasonRequired: 'A reason must be provided to move a Task to the \'Completed\' state. <string>reason is a required parameter.',

    //worker.js
    WorkerError_InitializationFailed: 'Unable to initialize Worker',
    WorkerInstantiationError_TokenRequired: 'Unable to instantiate Worker. <string>token is a required parameter.',
    WorkerFetchTasksError_ReservationStatusRequired: 'Unable to fetch Tasks. <string> reservationStatus is a required parameter.',
    WorkerSetAttributesError_AttributesRequired: 'Unable to set attributes on Worker. <string>attributes is a required parameter.',
    WorkerUpdateTokenError_NewTokenRequired: 'To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.',
    WorkerUpdateActivityError_ActivitySidRequired: 'Unable to update Worker activity. <string>activitySid is a required parameter.',

    //eventbridge.js
    EventBridgeSignalingError_WorkerRequired: '<Worker>worker is a required parameter to construct EventBridgeSignaling.',
    EventBridgeSignalingError_NewTokenRequired: 'To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.',

    //configuration.js
    ConfigurationError_TokenRequired: 'Unable to initialize Configuration. <string>token is required.',
    ConfigurationError_NewTokenRequired: 'To update the Twilio token, a new Twilio token must be passed in. <string>newToken is a required parameter.',

    //logger.js
    LoggerInstantiationError_ModuleNameRequired: 'Error instantiating Logger. <string>moduleName is a required parameter.',
    LoggerInstantiationError_InvalidLogLevel: 'Error instantiating Logger. <string>logLevel must be one of [\'trace\', \'debug\', \'info\', \'warn\', \'error\']',

    //request.js
    RequestError_BadRequest: 'Bad request.',
    RequestJwtError_TokenExpired: 'JWT token has expired. Update token.',
    RequestJwtError_InvalidTokenOrAccessPolicy: 'Problems verifying JWT token during request to Twilio server. Invalid JWT or Access Policy.',
    RequestError_InvalidEndpoint: 'Invalid endpoint.',
    RequestError_InternalError: 'Internal error occurred.',
    RequestError_ErrorMakingRequest: 'Error making request.',

    //tools.js
    GenericUpdatePropertiesError_TargetRequired: 'Unable to update properties. <Object>target is a required parameter.',
    GenericUpdatePropertiesError_SourceRequired: 'Unable to update properties. <Object>source is a required parameter.',
    GenericUpdatePropertiesError__TypeRequired: 'Unable to update properties. <string>type is a required parameter.',
    GenericJwtError_TokenRequired: 'Unable to verify JWT. <string>token is a required parameter.',
    GenericJwtError_MalformedToken: 'Twilio access token malformed. Unable to decode token.',
    GenericJwtError_MissingField: 'Twilio access token is malformed. Missing one of: grants.task_router, iss, or sub fields.',
    GenericJwtError_GrantMissingRole: 'Twilio access token missing required \'role\' parameter in the TaskRouter grant.',

    //constants.js
    DefaultError_InvalidArgument: 'One or more arguments passed were invalid.',
    DefaultError_InvalidToken: 'The token is invalid or malformed.',
    DefaultError_TokenExpired: 'Worker\'s active token has expired.',
    DefaultError_GatewayConnectionFailed: 'Could not connect to Twilio\'s servers.',
    DefaultError_GatewayDisconnected: 'Connection to Twilio\'s servers was lost.' ,
    DefaultError_InvalidGatewayMessage: 'The JSON message received was malformed.',
    DefaultError_TaskrouterError: 'TaskRouter failed to completed the request.'

}

module.exports = ERROR_MESSAGES;