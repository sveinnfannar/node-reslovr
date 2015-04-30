'use strict';

import _ from 'lodash';
import {expect} from 'chai';
import {
  reference,
  resolve,
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

  it('sets value to `undefined` referenced value is not found', function () {
    const state = {
      tasks: [{ userId: reference('user.id') }]
    };

    const resolvedState = resolve(state);
    expect(resolvedState.tasks[0].userId).to.be.undefined;
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

