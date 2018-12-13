const express = require('express');
const router = express.Router();
const queries = require('./queries.js');
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser');

let q = require('./queries.js')

router.use(bodyParser.urlencoded( { extended: false } ));
router.use(bodyParser.json());
router.use(cors());
router.use(morgan('combined'));

// Single player info below
router.get('/:name', (req, res, next) => {
    let playerName = req.params.name;

    let playerData = { PlayerName: playerName }     //initialize playerData object
    q.getPlayerData(playerName).then(response => {
        if (response instanceof Error){
            next(response)
        }
        else {
            q.getRecentMatches(response).then(matchArr => {
                // raw matches below
                let assetsArr = [];
                let matchTelemArr = []
                // console.log('response', response)
                playerData.TotalMatchesPlayed = response.relationships.matches.data.length;
                //todo add match id's to assets array to send to telemetry end point via q.getMatchTelemetry
                // matchArr.map(match => assetsArr.push(match.data.relationships.assets.data[0].id));
                matchArr.map(match => {
                    assetsArr.push(match.included.filter( data => data.type === 'asset' && data.id === match.data.relationships.assets.data[0].id)[0])
                })
                // console.log('assets arr', assetsArr)
                q.getMatchTelemetry(assetsArr) // get telemetry
                    .then(res => res.map(telem => matchTelemArr.push(telem)))
                    .then(response => {
                        playerData.matchTelemetry = matchTelemArr[0]; res.json(playerData)
                    })

            })
        }
    });
})

router.use((req, res, next) => {
    let err = new Error('Enter a valid player name for that sweet player data');
    next(err);
})

module.exports = router;
