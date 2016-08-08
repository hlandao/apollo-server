"use strict";
var chai_1 = require('chai');
var graphql_1 = require('graphql');
var runQuery_1 = require('./runQuery');
var QueryType = new graphql_1.GraphQLObjectType({
    name: 'QueryType',
    fields: {
        testString: {
            type: graphql_1.GraphQLString,
            resolve: function () {
                return 'it works';
            },
        },
        testRootValue: {
            type: graphql_1.GraphQLString,
            resolve: function (root) {
                return root + ' works';
            },
        },
        testContextValue: {
            type: graphql_1.GraphQLString,
            resolve: function (root, args, context) {
                return context + ' works';
            },
        },
        testArgumentValue: {
            type: graphql_1.GraphQLInt,
            resolve: function (root, args, context) {
                return args['base'] + 5;
            },
            args: {
                base: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
            },
        },
    },
});
var Schema = new graphql_1.GraphQLSchema({
    query: QueryType,
});
describe('runQuery', function () {
    it('returns the right result when query is a string', function () {
        var query = "{ testString }";
        var expected = { testString: 'it works' };
        return runQuery_1.runQuery({ schema: Schema, query: query })
            .then(function (res) {
            return chai_1.expect(res.data).to.deep.equal(expected);
        });
    });
    it('returns the right result when query is a document', function () {
        var query = graphql_1.parse("{ testString }");
        var expected = { testString: 'it works' };
        return runQuery_1.runQuery({ schema: Schema, query: query })
            .then(function (res) {
            return chai_1.expect(res.data).to.deep.equal(expected);
        });
    });
    it('returns a syntax error if the query string contains one', function () {
        var query = "query { test";
        var expected = 'Syntax Error GraphQL (1:13) Expected Name, found EOF\n\n1: query { test\n               ^\n';
        return runQuery_1.runQuery({
            schema: Schema,
            query: query,
            variables: { base: 1 },
        }).then(function (res) {
            chai_1.expect(res.data).to.be.undefined;
            chai_1.expect(res.errors.length).to.equal(1);
            return chai_1.expect(res.errors[0].message).to.deep.equal(expected);
        });
    });
    it('returns a validation error if the query string does not pass validation', function () {
        var query = "query TestVar($base: String){ testArgumentValue(base: $base) }";
        var expected = 'Variable "$base" of type "String" used in position expecting type "Int!".';
        return runQuery_1.runQuery({
            schema: Schema,
            query: query,
            variables: { base: 1 },
        }).then(function (res) {
            chai_1.expect(res.data).to.be.undefined;
            chai_1.expect(res.errors.length).to.equal(1);
            return chai_1.expect(res.errors[0].message).to.deep.equal(expected);
        });
    });
    it('does not run validation if the query is a document', function () {
        var query = graphql_1.parse("query TestVar($base: String){ testArgumentValue(base: $base) }");
        var expected = { testArgumentValue: 15 };
        return runQuery_1.runQuery({
            schema: Schema,
            query: query,
            variables: { base: 1 },
        }).then(function (res) {
            return chai_1.expect(res.data).to.deep.equal(expected);
        });
    });
    it('correctly passes in the rootValue', function () {
        var query = "{ testRootValue }";
        var expected = { testRootValue: 'it also works' };
        return runQuery_1.runQuery({ schema: Schema, query: query, rootValue: 'it also' })
            .then(function (res) {
            return chai_1.expect(res.data).to.deep.equal(expected);
        });
    });
    it('correctly passes in the context', function () {
        var query = "{ testContextValue }";
        var expected = { testContextValue: 'it still works' };
        return runQuery_1.runQuery({ schema: Schema, query: query, context: 'it still' })
            .then(function (res) {
            return chai_1.expect(res.data).to.deep.equal(expected);
        });
    });
    it('passes the options to formatResponse', function () {
        var query = "{ testContextValue }";
        var expected = { testContextValue: 'it still works' };
        return runQuery_1.runQuery({
            schema: Schema,
            query: query,
            context: 'it still',
            formatResponse: function (response, _a) {
                var context = _a.context;
                response['extensions'] = context;
                return response;
            },
        })
            .then(function (res) {
            chai_1.expect(res.data).to.deep.equal(expected);
            return chai_1.expect(res['extensions']).to.equal('it still');
        });
    });
    it('correctly passes in variables (and arguments)', function () {
        var query = "query TestVar($base: Int!){ testArgumentValue(base: $base) }";
        var expected = { testArgumentValue: 6 };
        return runQuery_1.runQuery({
            schema: Schema,
            query: query,
            variables: { base: 1 },
        }).then(function (res) {
            return chai_1.expect(res.data).to.deep.equal(expected);
        });
    });
    it('throws an error if there are missing variables', function () {
        var query = "query TestVar($base: Int!){ testArgumentValue(base: $base) }";
        var expected = 'Variable "$base" of required type "Int!" was not provided.';
        return runQuery_1.runQuery({
            schema: Schema,
            query: query,
        }).then(function (res) {
            return chai_1.expect(res.errors[0].message).to.deep.equal(expected);
        });
    });
    it('runs the correct operation when operationName is specified', function () {
        var query = "\n        query Q1 {\n            testString\n        }\n        query Q2 {\n            testRootValue\n        }";
        var expected = {
            testString: 'it works',
        };
        return runQuery_1.runQuery({ schema: Schema, query: query, operationName: 'Q1' })
            .then(function (res) {
            return chai_1.expect(res.data).to.deep.equal(expected);
        });
    });
    it('calls logFunction', function () {
        var query = "\n        query Q1 {\n            testString\n        }";
        var logs = [];
        var logFn = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            logs.push(args);
        };
        var expected = {
            testString: 'it works',
        };
        return runQuery_1.runQuery({
            schema: Schema,
            query: query,
            operationName: 'Q1',
            variables: { test: 123 },
            logFunction: logFn,
        })
            .then(function (res) {
            chai_1.expect(res.data).to.deep.equal(expected);
            chai_1.expect(logs.length).to.equals(11);
            chai_1.expect(logs[0][0]).to.equals('request.start');
            chai_1.expect(logs[1][0]).to.equals('request.query');
            chai_1.expect(logs[1][1]).to.deep.equals(query);
            chai_1.expect(logs[2][0]).to.equals('request.variables');
            chai_1.expect(logs[2][1]).to.deep.equals({ test: 123 });
            chai_1.expect(logs[3][0]).to.equals('request.operationName');
            chai_1.expect(logs[3][1]).to.equals('Q1');
            chai_1.expect(logs[10][0]).to.equals('request.end');
        });
    });
});
//# sourceMappingURL=runQuery.test.js.map