'use strict';

import _ from 'lodash';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
import {expect} from 'chai';
import sinon from 'sinon';
import bluebird from 'bluebird';
import {
  reference,
  resolve,
  resolveAndPersist,
  getValueAtPath,
  getValueAtPathAsync,
} from './index';

describe('#resolve()', function () {
  it('returns the same state if there are no references to resolve', function () {
    const state = {
      users: [generateUser()],
      clients: [generateClient()],
    };

    expect(resolve(state)).to.deep.equal(state);
  });

  it('resolves references for values in the state', function () {
    const state = {
      users: [generateUser({ id: 'u1' })],
      clients: [generateClient({ id: 'c1' })],
      accessTokens: [generateAccessToken({
        userId: reference('users.0.id'),
        clientId: reference('clients.0.id')
      })]
    };

    const resolvedState = resolve(state);
    expect(resolvedState.accessTokens[0].userId).to.equal('u1');
    expect(resolvedState.accessTokens[0].clientId).to.equal('c1');
  });

  it('resolves nested references for values in the state', function () {
    const state = {
      users: [generateUser({ id: 'u1' })],
      tasks: [{
        _type: 'task',
        task: 'Buy milk',
        info: {
          userId: reference('users.0.id')
        }
      }]
    };

    const resolvedState = resolve(state);
    expect(resolvedState.tasks[0].info.userId).to.equal('u1');
  });

  it('resolves references in an array of objects', function () {
    const state = {
      users: [generateUser({ id: 'u1' })],
      tasks: [
        { _type: 'task', task: 'Buy milk', userId: reference('users.0.id') },
        { _type: 'task', task: 'Buy milk', userId: reference('users.0.id') }
      ]
    };

    const resolvedState = resolve(state);
    expect(resolvedState.tasks[0].userId).to.equal('u1');
    expect(resolvedState.tasks[1].userId).to.equal('u1');
  });

  it('resolves references to values within an array', function () {
    const state = {
      users: [
        generateUser({ id: 'u1' }),
        generateUser({ id: 'u2' })
      ],
      tasks: [
        { task: 'Buy milk', userId: reference('users.0.id') },
        { task: 'Buy milk', userId: reference('users.1.id') }
      ]
    };

    const resolvedState = resolve(state);
    expect(resolvedState.tasks[0].userId).to.equal('u1');
    expect(resolvedState.tasks[1].userId).to.equal('u2');
  });
  
  it('resolves references to values within the same array', function () {
    const state = {
      users: [
        generateUser({ id: 'u1' }),
        generateUser({ id: 'u2', bestFriendId: reference('users.0.id') })
      ]
    };

    const resolvedState = resolve(state);
    expect(resolvedState.users[1].bestFriendId).to.equal('u1');
  });
  
  it('resolves references to values within the same object', function () {
    const state = {
      users: {
        holmes: generateUser({ id: 'u1', username: 'Holmes' }),
        wattson: generateUser({ id: 'u2', username: 'Wattson', bestFriendId: reference('users.holmes.id') })
      }
    };

    const resolvedState = resolve(state);
    expect(resolvedState.users.wattson.bestFriendId).to.equal('u1');
  });

  it('throws an error when a reference cannot be resolved', function () {
    const state = {
      tasks: [{ userId: reference('user.id') }]
    };
    expect(_.partial(resolve, state)).to.throw(Error);
  });
});

describe('#resolveAndPersist()', function () {
  it('invokes the persist function and returns a promise of a resolved state', function () {
    var persistFn = sinon.spy((tableName, state) => bluebird.resolve(state));
    const state = {
      users: [generateUser()],
    };

    expect(persistFn.calledOnce).to.equal.true;
    return expect(resolveAndPersist(state, persistFn)).to.eventually.deep.equal(state);
  });

  it('waits until referenced objects have been persisted before resolving reference', function () {
    var persistFn = (tableName, state) => bluebird.resolve(state);
    const state = {
      users: [generateUser({ id: 'u1' })],
      tasks: [{ id: 't1', userId: reference('users.0.id') }]
    };

    return resolveAndPersist(state, persistFn)
      .then(function (state) {
        expect(state.tasks[0].userId).to.equal('u1');
      });
  });

  it('resolves references within an object', function () {
    var persistFn = (tableName, state) => bluebird.resolve(state);
    const state = {
      users: { someUser: generateUser({ id: 'u1' }) },
      tasks: [{ id: 't1', userId: reference('users.someUser.id') }]
    };

    return resolveAndPersist(state, persistFn)
      .then(function (state) {
        expect(state.tasks[0].userId).to.equal('u1');
      });
  });
  
  it('resolves references to values within the same array', function () {
    var persistFn = (tableName, state) => bluebird.resolve(state);
    const state = {
      users: [
        generateUser({ id: 'u1' }),
        generateUser({ id: 'u2', bestFriendId: reference('users.0.id') })
      ]
    };

    return resolveAndPersist(state, persistFn)
      .then(function (state) {
        console.log(state);
        expect(state.users[1].bestFriendId).to.equal('u1');
      });
  });
});

describe('#getValueAtPath()', function () {
  it('returns root-level value', function () {
    expect(getValueAtPath('a', { a: 1 })).to.equal(1);
  });

  it('returns nested value', function () {
    expect(getValueAtPath('a.b', { a: { b: 1 } })).to.equal(1);
  });

  it('throws an error if value is not found', function () {
    expect(_.partial(getValueAtPath, 'a.b', {})).to.throw(Error);
  });
});

describe('#getValueAtPathAsync()', function () {
  it('returns promise of root-level value', function () {
    return expect(getValueAtPathAsync('a', bluebird.resolve({ a: 1 }))).to.eventually.equal(1);
  });

  it('returns promise of nested value', function () {
    return expect(getValueAtPathAsync('a.b', bluebird.resolve({ a: bluebird.resolve({ b: 1 }) }))).to.eventually.equal(1);
  });

  it('returns a rejected promise if value is not found', function () {
    return expect(getValueAtPathAsync('a.b', bluebird.resolve({ }))).to.eventually.be.rejected;
  });
});

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

