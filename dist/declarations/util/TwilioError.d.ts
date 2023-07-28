export = TwilioError;
declare function TwilioError(errorData: Object, customMessage: string): void;
declare class TwilioError {
    constructor(errorData: Object, customMessage: string);
    clone(customMessage: string): TwilioError;
}
