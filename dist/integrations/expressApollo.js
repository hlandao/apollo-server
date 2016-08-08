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
var url = require('url');
var runQuery_1 = require('../core/runQuery');
var GraphiQL = require('../modules/renderGraphiQL');
function apolloExpress(options) {
    if (!options) {
        throw new Error('Apollo Server requires options.');
    }
    if (arguments.length > 1) {
        throw new Error("Apollo Server expects exactly one argument, got " + arguments.length);
    }
    return function (req, res, next) __awaiter(this, void 0, void 0, function* () {
        var optionsObject;
        if (isOptionsFunction(options)) {
            try {
                optionsObject = yield options(req, res);
            }
            catch (e) {
                res.statusCode = 500;
                res.write("Invalid options provided to ApolloServer: " + e.message);
                res.end();
            }
        }
        else {
            optionsObject = options;
        }
        var formatErrorFn = optionsObject.formatError || graphql.formatError;
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            res.statusCode = 405;
            res.write('Apollo Server supports only POST requests.');
            res.end();
            return;
        }
        if (!req.body) {
            res.statusCode = 500;
            res.write('POST body missing. Did you forget "app.use(bodyParser.json())"?');
            res.end();
            return;
        }
        var b = req.body;
        var isBatch = true;
        if (!Array.isArray(b)) {
            isBatch = false;
            b = [b];
        }
        var responses = [];
        for (var _i = 0, b_1 = b; _i < b_1.length; _i++) {
            var requestParams = b_1[_i];
            try {
                var query = requestParams.query;
                var operationName = requestParams.operationName;
                var variables = requestParams.variables;
                if (typeof variables === 'string') {
                    variables = JSON.parse(variables);
                }
                var params = {
                    schema: optionsObject.schema,
                    query: query,
                    variables: variables,
                    context: optionsObject.context,
                    rootValue: optionsObject.rootValue,
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
        res.setHeader('Content-Type', 'application/json');
        if (isBatch) {
            res.write(JSON.stringify(responses));
            res.end();
        }
        else {
            var gqlResponse = responses[0];
            if (gqlResponse.errors && typeof gqlResponse.data === 'undefined') {
                res.statusCode = 400;
            }
            res.write(JSON.stringify(gqlResponse));
            res.end();
        }
    });
}
exports.apolloExpress = apolloExpress;
function isOptionsFunction(arg) {
    return typeof arg === 'function';
}
function graphiqlExpress(options) {
    return function (req, res, next) {
        var q = req.url && url.parse(req.url, true).query || {};
        var query = q.query || '';
        var variables = q.variables || '{}';
        var operationName = q.operationName || '';
        var graphiQLString = GraphiQL.renderGraphiQL({
            endpointURL: options.endpointURL,
            query: query || options.query,
            variables: JSON.parse(variables) || options.variables,
            operationName: operationName || options.operationName,
        });
        res.setHeader('Content-Type', 'text/html');
        res.write(graphiQLString);
        res.end();
    };
}
exports.graphiqlExpress = graphiqlExpress;
//# sourceMappingURL=expressApollo.js.map