"use strict";
var chai_1 = require('chai');
var graphql_1 = require('graphql');
var operationStore_1 = require('./operationStore');
var QueryType = new graphql_1.GraphQLObjectType({
    name: 'QueryType',
    fields: {
        testString: {
            type: graphql_1.GraphQLString,
        },
        testRootValue: {
            type: graphql_1.GraphQLString,
        },
        testContextValue: {
            type: graphql_1.GraphQLString,
        },
        testArgumentValue: {
            type: graphql_1.GraphQLInt,
            args: {
                base: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
            },
        },
    },
});
var Schema = new graphql_1.GraphQLSchema({
    query: QueryType,
});
describe('operationStore', function () {
    it('can store a query and return its ast', function () {
        var query = "query testquery{ testString }";
        var expected = "query testquery {\n  testString\n}\n";
        var store = new operationStore_1.OperationStore(Schema);
        store.put(query);
        return chai_1.expect(graphql_1.print(store.get('testquery'))).to.deep.equal(expected);
    });
    it('can store queries and return them with getMap', function () {
        var query = "query testquery{ testString }";
        var query2 = "query testquery2{ testRootValue }";
        var store = new operationStore_1.OperationStore(Schema);
        store.put(query);
        store.put(query2);
        return chai_1.expect(store.getMap().size).to.equal(2);
    });
    it('throws a parse error if the query is invalid', function () {
        var query = "query testquery{ testString";
        var store = new operationStore_1.OperationStore(Schema);
        return chai_1.expect(function () { return store.put(query); }).to.throw(/found EOF/);
    });
    it('throws a validation error if the query is invalid', function () {
        var query = "query testquery { testStrin }";
        var store = new operationStore_1.OperationStore(Schema);
        return chai_1.expect(function () { return store.put(query); }).to.throw(/Cannot query field/);
    });
    it('throws an error if there is more than one query or mutation', function () {
        var query = "\n        query Q1{ testString }\n        query Q2{ t2: testString }\n      ";
        var store = new operationStore_1.OperationStore(Schema);
        return chai_1.expect(function () { return store.put(query); }).to.throw(/operationDefinition must contain only one definition/);
    });
    it('throws an error if there is no operationDefinition found', function () {
        var query = "\n        schema {\n            query: Q\n        }\n      ";
        var store = new operationStore_1.OperationStore(Schema);
        return chai_1.expect(function () { return store.put(query); }).to.throw(/must contain an/);
    });
    it('can delete stored operations', function () {
        var query = "query testquery{ testString }";
        var store = new operationStore_1.OperationStore(Schema);
        store.put(query);
        store.delete('testquery');
        return chai_1.expect(store.get('testquery')).to.be.undefined;
    });
});
//# sourceMappingURL=operationStore.test.js.map