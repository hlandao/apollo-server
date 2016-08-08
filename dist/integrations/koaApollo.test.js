"use strict";
var koa = require('koa');
var koaRouter = require('koa-router');
var koaBody = require('koa-bodyparser');
var koaApollo_1 = require('./koaApollo');
var chai_1 = require('chai');
var integrations_test_1 = require('./integrations.test');
function createApp(options) {
    if (options === void 0) { options = {}; }
    var app = new koa();
    var router = new koaRouter();
    options.apolloOptions = options.apolloOptions || { schema: integrations_test_1.Schema };
    if (!options.excludeParser) {
        app.use(koaBody());
    }
    if (options.graphiqlOptions) {
        router.get('/graphiql', koaApollo_1.graphiqlKoa(options.graphiqlOptions));
    }
    router.post('/graphql', koaApollo_1.apolloKoa(options.apolloOptions));
    app.use(router.routes());
    app.use(router.allowedMethods());
    return app.listen(3000);
}
function destroyApp(app) {
    app.close();
}
describe('koaApollo', function () {
    it('throws error if called without schema', function () {
        chai_1.expect(function () { return koaApollo_1.apolloKoa(undefined); }).to.throw('Apollo Server requires options.');
    });
    it('throws an error if called with more than one argument', function () {
        chai_1.expect(function () { return koaApollo_1.apolloKoa({}, 'x'); }).to.throw('Apollo Server expects exactly one argument, got 2');
    });
});
describe('integration:Koa', function () {
    integrations_test_1.default(createApp, destroyApp);
});
//# sourceMappingURL=koaApollo.test.js.map