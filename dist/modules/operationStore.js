"use strict";
var graphql_1 = require('graphql');
var OPERATION_DEFINITION = 'OperationDefinition';
var OperationStore = (function () {
    function OperationStore(schema) {
        this.schema = schema;
        this.storedOperations = new Map();
    }
    OperationStore.prototype.put = function (operationDefinition) {
        var ast = graphql_1.parse(operationDefinition);
        function isOperationDefinition(definition) {
            return definition.kind === OPERATION_DEFINITION;
        }
        if (ast.definitions.length > 1) {
            throw new Error('operationDefinition must contain only one definition');
        }
        var definition = ast.definitions[0];
        if (isOperationDefinition(definition)) {
            var validationErrors = graphql_1.validate(this.schema, ast);
            if (validationErrors.length > 0) {
                var messages = validationErrors.map(function (e) { return e.message; });
                var e = new Error("Validation Errors:\n" + messages.join('\n'));
                e['originalErrors'] = validationErrors;
                throw e;
            }
            this.storedOperations.set(definition.name.value, ast);
        }
        else {
            throw new Error("operationDefinition must contain an OperationDefinition: " + operationDefinition);
        }
    };
    OperationStore.prototype.get = function (operationName) {
        return this.storedOperations.get(operationName);
    };
    OperationStore.prototype.delete = function (operationName) {
        return this.storedOperations.delete(operationName);
    };
    OperationStore.prototype.getMap = function () {
        return this.storedOperations;
    };
    return OperationStore;
}());
exports.OperationStore = OperationStore;
//# sourceMappingURL=operationStore.js.map