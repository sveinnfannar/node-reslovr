'use strict';

const _ = require('lodash');
const assert = require('assert');
const expect = require('chai').expect;

// Create reference
function reference (path) {
  return {
    _type: 'reference', path
  };
}

// Resolve all references in a given state
function resolve (state) {
  return _.transform(state, function (resultState, value, key) {
    resultState[key] = processItem(value, resultState);
    return resultState;
  }, {});

  function processItem (item, resultState) { // TODO: Find a better function name
    assert(item && resultState, 'item and resultState should be provided');
    return _.mapValues(item, function (value) { 
      if (isReference(value)) {
        return resolveReference(value, resultState);
      } else if (_.isObject(value)) {
        return processItem(value, resultState);
      } else {
        return value;
      }
    });
  }
}

function resolveReference (reference, state) {
  console.log('Resolving reference with path: "%s" with state %j', reference.path, state);
  return eval('state.' + reference.path); // TODO: Extract value at path without eval
}

function isReference(item) {
  return _.isObject(item) && item._type === 'reference';
}

// Generators
function generateUser (properties) {
  return _.merge({
    _type: 'user',
    id: '?',
    username: 'Swen'
  }, properties);
}

function generateClient (properties) {
  return _.merge({
    _type: 'client',
    id: '?'
  }, properties);
}

function generateAccessToken (properties) {
  return _.merge({
    _type: 'accessToken',
    id: 'a1',
    token: 'abc'
  }, properties);
}

// Example state defenition
describe('', function () {
  it('returns the same object if there are no references to resolve', function () {
    const state = {
      user: generateUser(),
      client: generateClient(),
    };

    expect(resolve(state)).to.deep.equal(state);
  });

  it('resolves references for values defined before the reference', function () {
    const state = {
      user: generateUser({ id: 'u1' }),
      client: generateClient({ id: 'c1' }),
      accessToken: generateAccessToken({
        userId: reference('user.id'),
        clientId: reference('client.id')
      })
    };

    const resolvedState = resolve(state);
    expect(resolvedState.accessToken.userId).to.equal('u1');
    expect(resolvedState.accessToken.clientId).to.equal('c1');
  });

  it('resolves nested references for values defined before the reference', function () {
    const state = {
      user: generateUser({ id: 'u1' }),
      task: {
        _type: 'task',
        task: 'Buy milk',
        info: {
          userId: reference('user.id')
        }
      }
    };

    const resolvedState = resolve(state);
    expect(resolvedState.task.info.userId).to.equal('u1');
  });
});
