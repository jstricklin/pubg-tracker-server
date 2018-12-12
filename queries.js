const fetch = require('node-fetch');
const redis = require('./cache.js')

require('dotenv').config();
baseURL='https://api.pubg.com/shards/psn/players?filter[playerNames]=';

module.exports = {
    getPlayerData: (playerName) => {
        return redis.getCachedPlayerData(playerName).then(res => {
            if (res !== null) {
                console.log('player in cache', res)
                return res
            } else {
                console.log('Player not in cache - Fetching!')
                return fetch(`${baseURL}${playerName}`, {
                method: 'GET',
                json: true,
                headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json', 'Authorization': `Bearer ${process.env.API_KEY}`
                }
            })
                .then(res => res.json())
                .then(json => { redis.cachePlayerData(playerName, json.data[0]); return json.data[0] })
            }
            console.log('pre return player', res)
        }).catch(err => new Error('No player data found...'))
    },
    getRecentMatches: (data) => {
        let matches = []
        data.relationships.matches.data.map(( matchID, i ) => {
            if (i < 5) {
                matches.push(matchID.id)
            } else return
        })
        return matches
    }
}
