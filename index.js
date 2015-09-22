'use strict';

import _ from 'lodash';
import assert from 'assert';
import lodashDeep from 'lodash-deep';
_.mixin(lodashDeep);

// Create reference
export function reference (path) {
  return {
    _type: 'reference', path: path,
    toString: () => '<Reference ' + path + '>'
  };
}

// Resolve all references in a given state
export function resolve (state) {
  return _.transform(state, function (resultState, items, tableName) {
    resultState[tableName] = _.isArray(items) ? [] : {};
    _.forEach(items, function (item, key) {
      resultState[tableName][key] = findAndResolveReferences(item, resultState);
    });
    return resultState;
  }, {});
}

function findAndResolveReferences (item, state) {
  assert(item && state, 'item and state should be provided');
  return _.mapValues(item, function (value) { 
    if (_isReference(value)) {
      return _.deepGet(state, value.path);
    } else if (_.isPlainObject(value)) {
      return findAndResolveReferences(value, state);
    } else {
      return value;
    }
  });
}

function _isReference(item) {
  return _.isObject(item) && item._type === 'reference';
}
