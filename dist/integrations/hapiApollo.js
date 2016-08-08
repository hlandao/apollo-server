"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var graphql = require('graphql');
var GraphiQL = require('../modules/renderGraphiQL');
var runQuery_1 = require('../core/runQuery');
var ApolloHAPI = (function () {
    function ApolloHAPI() {
        this.register = function (server, options, next) {
            server.route({
                method: 'POST',
                path: '/',
                handler: function (request, reply) __awaiter(this, void 0, void 0, function* () {
                    var optionsObject;
                    if (isOptionsFunction(options)) {
                        try {
                            optionsObject = yield options(request);
                        }
                        catch (e) {
                            reply("Invalid options provided to ApolloServer: " + e.message).code(500);
                        }
                    }
                    else {
                        optionsObject = options;
                    }
                    if (!request.payload) {
                        reply('POST body missing.').code(500);
                        return;
                    }
                    var responses = yield processQuery(request.payload, optionsObject);
                    if (responses.length > 1) {
                        reply(responses);
                    }
                    else {
                        var gqlResponse = responses[0];
                        if (gqlResponse.errors && typeof gqlResponse.data === 'undefined') {
                            reply(gqlResponse).code(400);
                        }
                        else {
                            reply(gqlResponse);
                        }
                    }
                }),
            });
            next();
        };
        this.register.attributes = {
            name: 'graphql',
            version: '0.0.1',
        };
    }
    return ApolloHAPI;
}());
exports.ApolloHAPI = ApolloHAPI;
var GraphiQLHAPI = (function () {
    function GraphiQLHAPI() {
        this.register = function (server, options, next) {
            server.route({
                method: 'GET',
                path: '/',
                handler: function (request, reply) {
                    var q = request.query || {};
                    var query = q.query || '';
                    var variables = q.variables || '{}';
                    var operationName = q.operationName || '';
                    var graphiQLString = GraphiQL.renderGraphiQL({
                        endpointURL: options.endpointURL,
                        query: query || options.query,
                        variables: JSON.parse(variables) || options.variables,
                        operationName: operationName || options.operationName,
                    });
                    reply(graphiQLString).header('Content-Type', 'text/html');
                },
            });
            next();
        };
        this.register.attributes = {
            name: 'graphiql',
            version: '0.0.1',
        };
    }
    return GraphiQLHAPI;
}());
exports.GraphiQLHAPI = GraphiQLHAPI;
function processQuery(body, optionsObject) {
    return __awaiter(this, void 0, void 0, function* () {
        var formatErrorFn = optionsObject.formatError || graphql.formatError;
        var isBatch = true;
        if (!Array.isArray(body)) {
            isBatch = false;
            body = [body];
        }
        var responses = [];
        for (var _i = 0, body_1 = body; _i < body_1.length; _i++) {
            var payload = body_1[_i];
            try {
                var operationName = payload.operationName;
                var variables = payload.variables;
                if (typeof variables === 'string') {
                    variables = JSON.parse(variables);
                }
                var params = {
                    schema: optionsObject.schema,
                    query: payload.query,
                    variables: variables,
                    rootValue: optionsObject.rootValue,
                    context: optionsObject.context,
                    operationName: operationName,
                    logFunction: optionsObject.logFunction,
                    validationRules: optionsObject.validationRules,
                    formatError: formatErrorFn,
                    formatResponse: optionsObject.formatResponse,
                };
                if (optionsObject.formatParams) {
                    params = optionsObject.formatParams(params);
                }
                responses.push(yield runQuery_1.runQuery(params));
            }
            catch (e) {
                responses.push({ errors: [formatErrorFn(e)] });
            }
        }
        return responses;
    });
}
function isOptionsFunction(arg) {
    return typeof arg === 'function';
}
//# sourceMappingURL=hapiApollo.js.map