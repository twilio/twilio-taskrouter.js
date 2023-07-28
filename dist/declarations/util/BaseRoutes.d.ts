export default class BaseRoutes {
    routes: Object;
    public getRoute(route: string, ...args: any[]): keyof BaseRoutes;
}
