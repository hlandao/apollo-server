"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var expressApollo_1 = require('../integrations/expressApollo');
var chai_1 = require('chai');
var querystring_1 = require('querystring');
var zlib = require('zlib');
var multer = require('multer');
var bodyParser = require('body-parser');
var request = require('supertest-as-promised');
var express4 = require('express');
var express3 = express4;
var graphql_1 = require('graphql');
var QueryRootType = new graphql_1.GraphQLObjectType({
    name: 'QueryRoot',
    fields: {
        test: {
            type: graphql_1.GraphQLString,
            args: {
                who: {
                    type: graphql_1.GraphQLString
                }
            },
            resolve: function (root, args) { return 'Hello ' + (args['who'] || 'World'); }
        },
        thrower: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString),
            resolve: function () { throw new Error('Throws!'); }
        },
        context: {
            type: graphql_1.GraphQLString,
            resolve: function (obj, args, context) { return context; },
        }
    }
});
var TestSchema = new graphql_1.GraphQLSchema({
    query: QueryRootType,
    mutation: new graphql_1.GraphQLObjectType({
        name: 'MutationRoot',
        fields: {
            writeTest: {
                type: QueryRootType,
                resolve: function () { return ({}); }
            }
        }
    })
});
function urlString(urlParams) {
    var str = '/graphql';
    if (urlParams) {
        str += ('?' + querystring_1.stringify(urlParams));
    }
    return str;
}
function catchError(p) {
    return p.then(function (res) {
        if (res && res.error) {
            return { response: res };
        }
        throw new Error('Expected to catch error.');
    }, function (error) {
        if (!(error instanceof Error)) {
            throw new Error('Expected error to be instanceof Error.');
        }
        return error;
    });
}
function promiseTo(fn) {
    return new Promise(function (resolve, reject) {
        fn(function (error, result) { return error ? reject(error) : resolve(result); });
    });
}
describe('test harness', function () {
    it('expects to catch errors', function () __awaiter(this, void 0, void 0, function* () {
        var caught;
        try {
            yield catchError(Promise.resolve());
        }
        catch (error) {
            caught = error;
        }
        chai_1.expect(caught && caught.message).to.equal('Expected to catch error.');
    }));
    it('expects to catch actual errors', function () __awaiter(this, void 0, void 0, function* () {
        var caught;
        try {
            yield catchError(Promise.reject('not a real error'));
        }
        catch (error) {
            caught = error;
        }
        chai_1.expect(caught && caught.message).to.equal('Expected error to be instanceof Error.');
    }));
    it('resolves callback promises', function () __awaiter(this, void 0, void 0, function* () {
        var resolveValue = {};
        var result = yield promiseTo(function (cb) { return cb(null, resolveValue); });
        chai_1.expect(result).to.equal(resolveValue);
    }));
    it('rejects callback promises with errors', function () __awaiter(this, void 0, void 0, function* () {
        var rejectError = new Error();
        var caught;
        try {
            yield promiseTo(function (cb) { return cb(rejectError); });
        }
        catch (error) {
            caught = error;
        }
        chai_1.expect(caught).to.equal(rejectError);
    }));
});
var express = express4;
var version = 'modern';
describe("GraphQL-HTTP (apolloServer) tests for " + version + " express", function () {
    describe('POST functionality', function () {
        it('allows gzipped POST bodies', function () __awaiter(this, void 0, void 0, function* () {
            var app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress(function () { return ({
                schema: TestSchema
            }); }));
            var data = { query: '{ test(who: "World") }' };
            var json = JSON.stringify(data);
            var gzippedJson = yield promiseTo(function (cb) { return zlib.gzip(json, cb); });
            var req = request(app)
                .post(urlString())
                .set('Content-Type', 'application/json')
                .set('Content-Encoding', 'gzip');
            req.write(gzippedJson);
            var response = yield req;
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: {
                    test: 'Hello World'
                }
            });
        }));
        it('allows deflated POST bodies', function () __awaiter(this, void 0, void 0, function* () {
            var app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress(function () { return ({
                schema: TestSchema
            }); }));
            var data = { query: '{ test(who: "World") }' };
            var json = JSON.stringify(data);
            var deflatedJson = yield promiseTo(function (cb) { return zlib.deflate(json, cb); });
            var req = request(app)
                .post(urlString())
                .set('Content-Type', 'application/json')
                .set('Content-Encoding', 'deflate');
            req.write(deflatedJson);
            var response = yield req;
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: {
                    test: 'Hello World'
                }
            });
        }));
        it('allows for pre-parsed POST bodies', function () {
            var UploadedFileType = new graphql_1.GraphQLObjectType({
                name: 'UploadedFile',
                fields: {
                    originalname: { type: graphql_1.GraphQLString },
                    mimetype: { type: graphql_1.GraphQLString }
                }
            });
            var TestMutationSchema = new graphql_1.GraphQLSchema({
                query: new graphql_1.GraphQLObjectType({
                    name: 'QueryRoot',
                    fields: {
                        test: { type: graphql_1.GraphQLString }
                    }
                }),
                mutation: new graphql_1.GraphQLObjectType({
                    name: 'MutationRoot',
                    fields: {
                        uploadFile: {
                            type: UploadedFileType,
                            resolve: function (rootValue) {
                                return rootValue.request.file;
                            }
                        }
                    }
                })
            });
            var app = express();
            var storage = multer.memoryStorage();
            app.use(urlString(), multer({ storage: storage }).single('file'));
            app.use(urlString(), expressApollo_1.apolloExpress(function (req) {
                return {
                    schema: TestMutationSchema,
                    rootValue: { request: req }
                };
            }));
            var req = request(app)
                .post(urlString())
                .field('query', "mutation TestMutation {\n          uploadFile { originalname, mimetype }\n        }")
                .attach('file', __filename);
            req.then(function (response) {
                chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                    data: {
                        uploadFile: {
                            originalname: 'testApolloServerHTTP.js',
                            mimetype: 'application/javascript'
                        }
                    }
                });
            });
        });
    });
    describe('Error handling functionality', function () {
        it('handles field errors caught by GraphQL', function () __awaiter(this, void 0, void 0, function* () {
            var app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({
                schema: TestSchema
            }));
            var response = yield request(app)
                .post(urlString())
                .send({
                query: '{thrower}',
            });
            chai_1.expect(response.status).to.equal(200);
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: null,
                errors: [{
                        message: 'Throws!',
                        locations: [{ line: 1, column: 2 }]
                    }]
            });
        }));
        it('allows for custom error formatting to sanitize', function () __awaiter(this, void 0, void 0, function* () {
            var app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({
                schema: TestSchema,
                formatError: function (error) {
                    return { message: 'Custom error format: ' + error.message };
                }
            }));
            var response = yield request(app)
                .post(urlString())
                .send({
                query: '{thrower}',
            });
            chai_1.expect(response.status).to.equal(200);
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: null,
                errors: [{
                        message: 'Custom error format: Throws!',
                    }]
            });
        }));
        it('allows for custom error formatting to elaborate', function () __awaiter(this, void 0, void 0, function* () {
            var app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({
                schema: TestSchema,
                formatError: function (error) {
                    return {
                        message: error.message,
                        locations: error.locations,
                        stack: 'Stack trace'
                    };
                }
            }));
            var response = yield request(app)
                .post(urlString())
                .send({
                query: '{thrower}',
            });
            chai_1.expect(response.status).to.equal(200);
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                data: null,
                errors: [{
                        message: 'Throws!',
                        locations: [{ line: 1, column: 2 }],
                        stack: 'Stack trace',
                    }]
            });
        }));
        it('handles unsupported HTTP methods', function () __awaiter(this, void 0, void 0, function* () {
            var app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({ schema: TestSchema }));
            var response = yield request(app)
                .get(urlString({ query: '{test}' }));
            chai_1.expect(response.status).to.equal(405);
            chai_1.expect(response.headers.allow).to.equal('POST');
            return chai_1.expect(response.text).to.contain('Apollo Server supports only POST requests.');
        }));
    });
    describe('Custom validation rules', function () {
        var AlwaysInvalidRule = function (context) {
            return {
                enter: function () {
                    context.reportError(new graphql_1.GraphQLError('AlwaysInvalidRule was really invalid!'));
                    return graphql_1.BREAK;
                }
            };
        };
        it('Do not execute a query if it do not pass the custom validation.', function () __awaiter(this, void 0, void 0, function* () {
            var app = express();
            app.use(urlString(), bodyParser.json());
            app.use(urlString(), expressApollo_1.apolloExpress({
                schema: TestSchema,
                validationRules: [AlwaysInvalidRule],
            }));
            var response = yield request(app)
                .post(urlString())
                .send({
                query: '{thrower}',
            });
            chai_1.expect(response.status).to.equal(400);
            chai_1.expect(JSON.parse(response.text)).to.deep.equal({
                errors: [
                    {
                        message: 'AlwaysInvalidRule was really invalid!'
                    },
                ]
            });
        }));
    });
});
//# sourceMappingURL=testApolloServerHTTP.js.map