const fetch = require('node-fetch');
const cache = require('./cache.js')

require('dotenv').config();
//baseURL='https://api.pubg.com/shards'
baseURL='https://api.pubg.com/shards/psn/players?filter[playerNames]=';
matchURL='https://api.pubg.com/shards/psn/matches/'

module.exports = {
    getPlayerData: (playerName) => {
        return cache.getCachedPlayerData(playerName).then(res => {
            if (res !== null) {
                // console.log('player in cache', res)
                return res
            } else {
                // console.log('Player not in cache - Fetching!')
                return fetch(`${baseURL}${playerName}`, {
                method: 'GET',
                json: true,
                headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json', 'Authorization': `Bearer ${process.env.API_KEY}`
                }
            })
                .then(res => res.json())
                .then(json => { cache.cachePlayerData(playerName, json.data[0]); return json.data[0] })
            }
            // console.log('pre return player', res)
        }).catch(err => new Error('No player data found...'))
    },
    getRecentMatches: (data) => {
        let matches = []
        data.relationships.matches.data.map(( match, i ) => {
            if (i < 5) {
                console.log(match.id)
                matches.push(fetch(`${matchURL}${match.id}`, {
                method: 'GET',
                json: true,
                headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json', 'Authorization': `Bearer ${process.env.API_KEY}`
                }
                }).then( res => res.json()).then(json => json.data))
            } else return
        })
        return Promise.all(matches).then(res => res)
    }
}
