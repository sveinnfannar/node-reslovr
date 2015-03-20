'use strict';

// Example state defenition
var state = {
  // Basic data generation
  user: generateUser(),
  client: generateClient(),
  // Data references
  accessToken: generateAccessToken({
    userId: reference('user.id'),
    clientId: reference('client.id')
  }),
  // Nested data
  channels: {
    published: generateChannel({ name: 'Published Channel', published: true }),
    unpublished: generateChannel({ name: 'Un-published Channel', published: false })
  },
  // Generate multiple objects
  collections: generateCollections(2, {
    channelId: [reference('channels.published.id'), reference('channels.unpublished.id')]
  }),
  videos: generateVideos(4, {
    channelId: [reference('channels.*.id')],
    collectionId: [null, reference('channels.*.collections.*.id')]
  }),
  moments: generateMoments(6, {
    channelId: [reference('channels.*.id')],
    videoId: [null, reference('channels.*.videos.*.id')],
    userId: reference('user.id')
  }),
  follows: [
    generateFollow({ channelId: reference('channels.published.id'), userId: reference('user.id') }),
    generateFollow({ channelId: reference('channels.unpublished.id'), userId: reference('user.id') })
  ]
};

// Helpers
function reference () { }
function resolve () { }
function persist () {}

// Generators
function generateUser () { }
function generateClient () { }
function generateAccessToken () { }
function generateChannel () { }
function generateVideos () { }
function generateCollections () { }
function generateMoments () { }
function generateFollow () { }
