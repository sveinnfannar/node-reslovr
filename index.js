"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// Create reference
exports.reference = reference;

// Resolve all references in a given state
exports.resolve = resolve;

var _ = _interopRequire(require("lodash"));

var assert = _interopRequire(require("assert"));

var lodashDeep = _interopRequire(require("lodash-deep"));

_.mixin(lodashDeep);
function reference(path) {
  return {
    _type: "reference", path: path,
    toString: function () {
      return "<Reference " + path + ">";
    }
  };
}

function resolve(state) {
  return _.transform(state, function (resultState, items, tableName) {
    resultState[tableName] = _.isArray(items) ? [] : {};
    _.forEach(items, function (item, key) {
      resultState[tableName][key] = findAndResolveReferences(item, resultState);
    });
    return resultState;
  }, {});
}

function findAndResolveReferences(item, state) {
  assert(item && state, "item and state should be provided");
  return _.mapValues(item, function (value) {
    if (_isReference(value)) {
      return _.deepGet(state, value.path);
    } else if (_.isObject(value)) {
      return findAndResolveReferences(value, state);
    } else {
      return value;
    }
  });
}

function _isReference(item) {
  return _.isObject(item) && item._type === "reference";
}
Object.defineProperty(exports, "__esModule", {
  value: true
});
