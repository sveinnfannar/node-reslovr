'use strict';

import _ from 'lodash';
import assert from 'assert';
import bluebird from 'bluebird';

// Create reference
export function reference (path) {
  return {
    _type: 'reference', path: path,
    toString: () => '<Reference ' + path + '>'
  };
}

// Persist objects and resolve all references in a given state
export function resolveAndPersist (state, persistFn) {
  return bluebird.props(_.transform(state, function (resultState, items, tableName) {
    var resultStateClone = _.clone(resultState);
    resultStateClone[tableName] = _.isArray(items) ? [] : {};
    _.forEach(items, function (item, key) {
      resultStateClone[tableName][key] = persistFn(tableName, findAndResolveReferencesAsync(item, resultStateClone));
    });
    resultState[tableName] = _.isArray(items) ?
      bluebird.all(_.clone(resultStateClone[tableName])) :
      bluebird.props(_.clone(resultStateClone[tableName]));
    return resultState;
  }, {}));
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
  return _findAndResolveReferences(item, state, getValueAtPath, findAndResolveReferences);
}

function findAndResolveReferencesAsync (item, state) {
  return bluebird.props(_findAndResolveReferences(item, state, getValueAtPathAsync, findAndResolveReferencesAsync));
}

function _findAndResolveReferences (item, state, getValueAtPathFn, recurFn) {
  assert(item && state, 'item and state should be provided');
  return _.mapValues(item, function (value) { 
    if (_isReference(value)) {
      return getValueAtPathFn(value.path, state);
    } else if (_.isObject(value)) {
      return recurFn(value, state);
    } else {
      return value;
    }
  });
}

export function getValueAtPath (path, object) {
  return _getValueAtPath(path, object, getValueAtPath);
}

export function getValueAtPathAsync (path, objectOrPromise) {
  // Wrap the object in a promise to be able to call `.then` on it weather its an object or a promise
  return bluebird.resolve(objectOrPromise)
    .then(function (object) {
      console.log('path: %s, obj: %j -> %j', path, objectOrPromise, object);
      return _getValueAtPath(path, object, getValueAtPathAsync);
    });
}

function _getValueAtPath (path, object, recurFn) {
  if (_.isString(path)) {
    path = path.split('.');
  }
  var first = _.first(path);
  if (first in object) {
    var value = object[first];
    return _.isObject(value) ? recurFn(_.rest(path), value) : value;
  } else {
    console.log('Unable to get value at path %s in %j', path.join('.'), object);
    throw new Error('Unable to get value at path ' + path.join('.'));
  }
}

function _isReference(item) {
  return _.isObject(item) && item._type === 'reference';
}

function _logAndReturn (text, value) {
  console.log(text, value);
  return value;
}

