"use strict";
var hapi = require('hapi');
var hapiApollo_1 = require('./hapiApollo');
var integrations_test_1 = require('./integrations.test');
function createApp(options) {
    if (options === void 0) { options = {}; }
    var server = new hapi.Server();
    server.connection({
        host: 'localhost',
        port: 8000,
    });
    options.apolloOptions = options.apolloOptions || { schema: integrations_test_1.Schema };
    server.register({
        register: new hapiApollo_1.ApolloHAPI(),
        options: options.apolloOptions,
        routes: { prefix: '/graphql' },
    });
    server.register({
        register: new hapiApollo_1.GraphiQLHAPI(),
        options: { endpointURL: '/graphql' },
        routes: { prefix: '/graphiql' },
    });
    return server.listener;
}
describe('integration:HAPI', function () {
    integrations_test_1.default(createApp);
});
//# sourceMappingURL=hapiApollo.test.js.map