import { twilioErrors } from './Constants';

export default class BaseRoutes {
    constructor() {
        this.routes = {};
    }

    getRoute(route, ...args) {
        if (!this.routes[route]) {
            throw twilioErrors.INVALID_ARGUMENT.clone(`Invalid route fetched <string>route "${route}" does not exist.`);
        }

        if (args.length) {
            let copy = Object.assign({}, this.routes[route]);

            if (args.length !== (copy.path.match(/%s/g) || []).length) {
                throw twilioErrors.INVALID_ARGUMENT.clone(`Invalid number of positional arguments supplied for route ${route}`);
            }

            for (let arg of args) {
                copy.path = copy.path.replace(/%s/, arg);
            }

            return copy;
        }

        return this.routes[route];
    }

}
