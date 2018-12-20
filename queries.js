const fetch = require('node-fetch');
const cache = require('./cache.js')

require('dotenv').config();
//baseURL='https://api.pubg.com/shards'
const baseURL='https://api.pubg.com/shards';
const matchURL='https://api.pubg.com/shards';
const telemetryURL=''

module.exports = {
    getPlayerData: (shard, playerName) => {
        return cache.getCachedPlayerData(playerName).then(res => {
            if (res !== null) {
                // console.log('player in cache', res)
                return res
            } else {
                // console.log('Player not in cache - Fetching!')
                return fetch(`${baseURL}/${shard}/players?filter[playerNames]=${playerName}`, {
                    method: 'GET',
                    mode:'cors',
                    json: true,
                    headers: { 'Access-Control-Allow-Origin' : '*', 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json', 'Authorization': `Bearer ${process.env.API_KEY}`
                    }
                })
                    .then(res => res.json())
                    .then(json => { console.log(json); cache.cachePlayerData(playerName, json.data[0]); return json.data[0] })
            }
        }).catch(err => new Error(err))
    },
    getMatchData: (shard, data) => {
    console.log('data', data)
        let matches = []
        data.map(( match ) => {
            //change below to adjust returned match quantity
                // console.log(match.id)
                // console.log('match data?', match, match.id)
                matches.push(fetch(`${matchURL}/${shard}/matches/${match.id}`, {
                    method: 'GET',
                    json: true,
                    headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json', 'Authorization': `Bearer ${process.env.API_KEY}`
                    }
                }).then( res => res.json()).then(json => {/*console.log('raw json', json); */ return json}))
        })
        return Promise.all(matches).then(res => res)
    },
    getMatchTelemetry: (matchArr) => {
        // console.log('url', matchArr[0].attributes.URL)
        const matchPromises = [];
        // console.log('match arr', matchArr)
        matchArr.map((match) => matchPromises.push(fetch(`${match.attributes.URL}`, {
            method: 'GET',
            json: true,
            headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json', 'Authorization': `Bearer ${process.env.API_KEY}`
            }
        })
            .then( res => res.json())))
        return Promise.all(matchPromises).then(res => res)
    }
}
