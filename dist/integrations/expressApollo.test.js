"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var expressApollo_1 = require('./expressApollo');
var integrations_test_1 = require('./integrations.test');
var chai_1 = require('chai');
function createApp(options) {
    if (options === void 0) { options = {}; }
    var app = express();
    options.apolloOptions = options.apolloOptions || { schema: integrations_test_1.Schema };
    if (!options.excludeParser) {
        app.use('/graphql', bodyParser.json());
    }
    if (options.graphiqlOptions) {
        app.use('/graphiql', expressApollo_1.graphiqlExpress(options.graphiqlOptions));
    }
    app.use('/graphql', expressApollo_1.apolloExpress(options.apolloOptions));
    return app;
}
describe('expressApollo', function () {
    it('throws error if called without schema', function () {
        chai_1.expect(function () { return expressApollo_1.apolloExpress(undefined); }).to.throw('Apollo Server requires options.');
    });
    it('throws an error if called with more than one argument', function () {
        chai_1.expect(function () { return expressApollo_1.apolloExpress({}, 'x'); }).to.throw('Apollo Server expects exactly one argument, got 2');
    });
});
describe('integration:Express', function () {
    integrations_test_1.default(createApp);
});
//# sourceMappingURL=expressApollo.test.js.map