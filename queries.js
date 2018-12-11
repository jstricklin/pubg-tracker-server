const fetch = require('node-fetch');

require('dotenv').config();
baseURL='https://api.pubg.com/shards/psn/players?filter[playerNames]=';

module.exports = {

    getPlayerData: (playerName) => {
        return fetch(`${baseURL}${playerName}`, {
            method: 'GET',
            json: true,
            headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json', 'Authorization': `Bearer ${process.env.API_KEY}`
            }
        })
			.then(res => res.json())
            .then(json => { console.log(json.data[0]); return json.data[0] })
            .catch( err => next(err) )
    }

}
