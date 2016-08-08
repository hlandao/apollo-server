"use strict";
var graphql_1 = require('graphql');
function runQuery(options) {
    var documentAST;
    var logFunction = options.logFunction || function () { return null; };
    logFunction('request.start');
    function format(errors) {
        return errors.map(options.formatError || graphql_1.formatError);
    }
    logFunction('request.query', typeof options.query === 'string' ? options.query : graphql_1.print(options.query));
    logFunction('request.variables', options.variables);
    logFunction('request.operationName', options.operationName);
    if (typeof options.query === 'string') {
        try {
            logFunction('parse.start');
            documentAST = graphql_1.parse(options.query);
            logFunction('parse.end');
        }
        catch (syntaxError) {
            logFunction('parse.end');
            return Promise.resolve({ errors: format([syntaxError]) });
        }
        var rules = graphql_1.specifiedRules;
        if (options.validationRules) {
            rules = rules.concat(options.validationRules);
        }
        logFunction('validation.start');
        var validationErrors = graphql_1.validate(options.schema, documentAST, rules);
        logFunction('validation.end');
        if (validationErrors.length) {
            return Promise.resolve({ errors: format(validationErrors) });
        }
    }
    else {
        documentAST = options.query;
    }
    try {
        logFunction('execution.start');
        return graphql_1.execute(options.schema, documentAST, options.rootValue, options.context, options.variables, options.operationName).then(function (gqlResponse) {
            logFunction('execution.end');
            var response = {
                data: gqlResponse.data,
            };
            if (gqlResponse.errors) {
                response['errors'] = format(gqlResponse.errors);
            }
            if (options.formatResponse) {
                response = options.formatResponse(response, options);
            }
            logFunction('request.end');
            return response;
        });
    }
    catch (executionError) {
        logFunction('execution.end');
        logFunction('request.end');
        return Promise.resolve({ errors: format([executionError]) });
    }
}
exports.runQuery = runQuery;
//# sourceMappingURL=runQuery.js.map