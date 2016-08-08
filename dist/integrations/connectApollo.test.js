"use strict";
var connect = require('connect');
var bodyParser = require('body-parser');
var connectApollo_1 = require('./connectApollo');
var integrations_test_1 = require('./integrations.test');
function createConnectApp(options) {
    if (options === void 0) { options = {}; }
    var app = connect();
    options.apolloOptions = options.apolloOptions || { schema: integrations_test_1.Schema };
    if (!options.excludeParser) {
        app.use('/graphql', bodyParser.json());
    }
    if (options.graphiqlOptions) {
        app.use('/graphiql', connectApollo_1.graphiqlConnect(options.graphiqlOptions));
    }
    app.use('/graphql', connectApollo_1.apolloConnect(options.apolloOptions));
    return app;
}
describe('integration:Connect', function () {
    integrations_test_1.default(createConnectApp);
});
//# sourceMappingURL=connectApollo.test.js.map