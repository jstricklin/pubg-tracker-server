const bluebird = require('bluebird');
const redis = require('redis');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient();

client.keysAsync('*').then( res => console.log('start keys', res) ) // check keys in redis on save

module.exports = {
    getCachedPlayerData: (playerName) => {
        client.keysAsync('*').then( res => console.log('get data all keys', res) )
        return client.getAsync(playerName).then( res => JSON.parse(res))
    },
    cachePlayerData: (playerName, data) => {
        console.log('Caching player data', playerName)
        client.setAsync(playerName, JSON.stringify(data), 'EX', 180).then(res => console.log('set', res))
        client.getAsync(playerName).then( res => console.log('get after set', JSON.parse(res)))
        client.keysAsync('*').then( res => console.log('post set keys', res) )
    }
}
