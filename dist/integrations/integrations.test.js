"use strict";
var chai_1 = require('chai');
var graphql_1 = require('graphql');
var request = require('supertest-as-promised');
var operationStore_1 = require('../modules/operationStore');
var QueryType = new graphql_1.GraphQLObjectType({
    name: 'QueryType',
    fields: {
        testString: {
            type: graphql_1.GraphQLString,
            resolve: function () {
                return 'it works';
            },
        },
        testContext: {
            type: graphql_1.GraphQLString,
            resolve: function (_, args, context) {
                return context;
            },
        },
        testRootValue: {
            type: graphql_1.GraphQLString,
            resolve: function (rootValue) {
                return rootValue;
            },
        },
        testArgument: {
            type: graphql_1.GraphQLString,
            args: { echo: { type: graphql_1.GraphQLString } },
            resolve: function (root, _a) {
                var echo = _a.echo;
                return "hello " + echo;
            },
        },
        testError: {
            type: graphql_1.GraphQLString,
            resolve: function () {
                throw new Error('Secret error message');
            },
        },
    },
});
var MutationType = new graphql_1.GraphQLObjectType({
    name: 'MutationType',
    fields: {
        testMutation: {
            type: graphql_1.GraphQLString,
            args: { echo: { type: graphql_1.GraphQLString } },
            resolve: function (root, _a) {
                var echo = _a.echo;
                return "not really a mutation, but who cares: " + echo;
            },
        },
    },
});
exports.Schema = new graphql_1.GraphQLSchema({
    query: QueryType,
    mutation: MutationType,
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (createApp, destroyApp) {
    describe('apolloServer', function () {
        var app;
        afterEach(function () {
            if (app) {
                if (destroyApp) {
                    destroyApp(app);
                }
                else {
                    app = null;
                }
            }
        });
        describe('graphqlHTTP', function () {
            it('can be called with an options function', function () {
                app = createApp({ apolloOptions: function () { return ({ schema: exports.Schema }); } });
                var expected = {
                    testString: 'it works',
                };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testString }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data).to.deep.equal(expected);
                });
            });
            it('can be called with an options function that returns a promise', function () {
                app = createApp({ apolloOptions: function () {
                        return new Promise(function (resolve) {
                            resolve({ schema: exports.Schema });
                        });
                    } });
                var expected = {
                    testString: 'it works',
                };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testString }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data).to.deep.equal(expected);
                });
            });
            it('throws an error if options promise is rejected', function () {
                app = createApp({ apolloOptions: function () {
                        return Promise.reject({});
                    } });
                var expected = 'Invalid options';
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testString }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(500);
                    return chai_1.expect(res.error.text).to.contain(expected);
                });
            });
            it('rejects the request if the method is not POST', function () {
                app = createApp({ excludeParser: true });
                var req = request(app)
                    .get('/graphql')
                    .send();
                return req.then(function (res) {
                    chai_1.expect(res.status).to.be.oneOf([404, 405]);
                });
            });
            it('throws an error if POST body is missing', function () {
                app = createApp({ excludeParser: true });
                var req = request(app)
                    .post('/graphql')
                    .send();
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(500);
                    return chai_1.expect(res.error.text).to.contain('POST body missing.');
                });
            });
            it('can handle a basic request', function () {
                app = createApp();
                var expected = {
                    testString: 'it works',
                };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testString }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data).to.deep.equal(expected);
                });
            });
            it('can handle a request with variables', function () {
                app = createApp();
                var expected = {
                    testArgument: 'hello world',
                };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test($echo: String){ testArgument(echo: $echo) }',
                    variables: { echo: 'world' },
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data).to.deep.equal(expected);
                });
            });
            it('can handle a request with variables as string', function () {
                app = createApp();
                var expected = {
                    testArgument: 'hello world',
                };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test($echo: String!){ testArgument(echo: $echo) }',
                    variables: '{ "echo": "world" }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data).to.deep.equal(expected);
                });
            });
            it('can handle a request with operationName', function () {
                app = createApp();
                var expected = {
                    testString: 'it works',
                };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: "\n                      query test($echo: String){ testArgument(echo: $echo) }\n                      query test2{ testString }",
                    variables: { echo: 'world' },
                    operationName: 'test2',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data).to.deep.equal(expected);
                });
            });
            it('can handle batch requests', function () {
                app = createApp();
                var expected = [
                    {
                        data: {
                            testString: 'it works',
                        },
                    },
                    {
                        data: {
                            testArgument: 'hello yellow',
                        },
                    },
                ];
                var req = request(app)
                    .post('/graphql')
                    .send([{
                        query: "\n                      query test($echo: String){ testArgument(echo: $echo) }\n                      query test2{ testString }",
                        variables: { echo: 'world' },
                        operationName: 'test2',
                    },
                    {
                        query: "\n                      query testX($echo: String){ testArgument(echo: $echo) }",
                        variables: { echo: 'yellow' },
                        operationName: 'testX',
                    }]);
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body).to.deep.equal(expected);
                });
            });
            it('can handle a request with a mutation', function () {
                app = createApp();
                var expected = {
                    testMutation: 'not really a mutation, but who cares: world',
                };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'mutation test($echo: String){ testMutation(echo: $echo) }',
                    variables: { echo: 'world' },
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data).to.deep.equal(expected);
                });
            });
            it('applies the formatResponse function', function () {
                app = createApp({ apolloOptions: {
                        schema: exports.Schema,
                        formatResponse: function (response) {
                            response['extensions'] = { it: 'works' };
                            return response;
                        },
                    } });
                var expected = { it: 'works' };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'mutation test($echo: String){ testMutation(echo: $echo) }',
                    variables: { echo: 'world' },
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.extensions).to.deep.equal(expected);
                });
            });
            it('passes the context to the resolver', function () {
                var expected = 'context works';
                app = createApp({ apolloOptions: {
                        schema: exports.Schema,
                        context: expected,
                    } });
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testContext }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data.testContext).to.equal(expected);
                });
            });
            it('passes the rootValue to the resolver', function () {
                var expected = 'it passes rootValue';
                app = createApp({ apolloOptions: {
                        schema: exports.Schema,
                        rootValue: expected,
                    } });
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testRootValue }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data.testRootValue).to.equal(expected);
                });
            });
            it('returns errors', function () {
                var expected = 'Secret error message';
                app = createApp({ apolloOptions: {
                        schema: exports.Schema,
                    } });
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testError }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.errors[0].message).to.equal(expected);
                });
            });
            it('applies formatError if provided', function () {
                var expected = '--blank--';
                app = createApp({ apolloOptions: {
                        schema: exports.Schema,
                        formatError: function (err) { return ({ message: expected }); },
                    } });
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testError }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.errors[0].message).to.equal(expected);
                });
            });
            it('applies additional validationRules', function () {
                var expected = 'AlwaysInvalidRule was really invalid!';
                var AlwaysInvalidRule = function (context) {
                    return {
                        enter: function () {
                            context.reportError(new graphql_1.GraphQLError(expected));
                            return graphql_1.BREAK;
                        },
                    };
                };
                app = createApp({ apolloOptions: {
                        schema: exports.Schema,
                        validationRules: [AlwaysInvalidRule],
                    } });
                var req = request(app)
                    .post('/graphql')
                    .send({
                    query: 'query test{ testString }',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(400);
                    return chai_1.expect(res.body.errors[0].message).to.equal(expected);
                });
            });
        });
        describe('renderGraphiQL', function () {
            it('presents GraphiQL when accepting HTML', function () {
                app = createApp({ graphiqlOptions: {
                        endpointURL: '/graphql',
                    } });
                var req = request(app)
                    .get('/graphiql?query={test}')
                    .set('Accept', 'text/html');
                return req.then(function (response) {
                    chai_1.expect(response.status).to.equal(200);
                    chai_1.expect(response.type).to.equal('text/html');
                    chai_1.expect(response.text).to.include('{test}');
                    chai_1.expect(response.text).to.include('/graphql');
                    chai_1.expect(response.text).to.include('graphiql.min.js');
                });
            });
        });
        describe('stored queries', function () {
            it('works with formatParams', function () {
                var store = new operationStore_1.OperationStore(exports.Schema);
                store.put('query testquery{ testString }');
                app = createApp({ apolloOptions: {
                        schema: exports.Schema,
                        formatParams: function (params) {
                            params['query'] = store.get(params.operationName);
                            return params;
                        },
                    } });
                var expected = { testString: 'it works' };
                var req = request(app)
                    .post('/graphql')
                    .send({
                    operationName: 'testquery',
                });
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body.data).to.deep.equal(expected);
                });
            });
            it('can reject non-whitelisted queries', function () {
                var store = new operationStore_1.OperationStore(exports.Schema);
                store.put('query testquery{ testString }');
                app = createApp({ apolloOptions: {
                        schema: exports.Schema,
                        formatParams: function (params) {
                            if (params.query) {
                                throw new Error('Must not provide query, only operationName');
                            }
                            params['query'] = store.get(params.operationName);
                            return params;
                        },
                    } });
                var expected = [{
                        data: {
                            testString: 'it works',
                        },
                    }, {
                        errors: [{
                                message: 'Must not provide query, only operationName',
                            }],
                    }];
                var req = request(app)
                    .post('/graphql')
                    .send([{
                        operationName: 'testquery',
                    }, {
                        query: '{ testString }',
                    }]);
                return req.then(function (res) {
                    chai_1.expect(res.status).to.equal(200);
                    return chai_1.expect(res.body).to.deep.equal(expected);
                });
            });
        });
    });
};
//# sourceMappingURL=integrations.test.js.map