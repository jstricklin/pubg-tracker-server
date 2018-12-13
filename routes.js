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
                // matchArr.map(match => assetsArr.push(match.data.relationships.assets.data[0].id));
                matchArr.map(match => {
                    assetsArr.push(match.included.filter( data => data.type === 'asset' && data.id === match.data.relationships.assets.data[0].id)[0])
                })
                // console.log('assets arr', assetsArr)
                q.getMatchTelemetry(assetsArr) // get telemetry
                    .then(res => res.map(telem => matchTelemArr.push(telem)))
                    .then(response => {
                        //sort telemetry below
                        let attacks = []
                        let hits = []
                        matchTelemArr[0].map(telem => {
                            if (telem.attacker) {
                                if (telem.attacker.name === playerName && telem.victim) hits.push(telem)
                                else if (telem.attacker.name === playerName) attacks.push(telem)
                            }
                        })
                        console.log('attacks', attacks.length)
                        console.log('hits', hits.length)
                        console.log('accuracy', hits.length / attacks.length)
                        // console.log(matchTelemArr[0].filter(telem => { if ( telem.attacker ) return telem }).filter(attack => attack.attacker.name === playerName))
                        // playerData.Hits = hits;
                        playerData.Accuracy = (hits.length/attacks.length * 100).toFixed(2)
                        res.json(playerData)
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
