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
                        let pAttacks = []
                        let pHits = []
                        let kills = []
                        let pKills = []
                        let deaths = []
                        let pDeath = []
                        let prevMatch = {}
                        //sort recent match data below for all recent matches and prev match
                        matchTelemArr.map((el, i) => el.map(telem => {
                            if (i == 0) {
                                // prevMatch.MatchTelemetry = el
                                // prevMatch.Kills =
                                prevMatch.TimeStart = el[0]._D

                            }
                            //get kills below
                            if (telem.killer && telem.killer.name === playerName && telem.victim.name !== playerName) {
                                if (i == 0) {
                                    pKills.push(telem)
                                }
                                kills.push(telem)
                                // console.log('kill!', telem)
                            }
                            if (telem.killer && telem.victim.name == playerName) {
                                // console.log('deeeeath', telem)
                                if (i == 0) {
                                    pDeath.push(telem)
                                }
                                deaths.push(telem)
                            }

                            //get attacks and hits below
                            if (telem.attackId && telem.attacker) {
                                if (telem.attacker.name === playerName) {
                                    if (telem.attackType === 'Weapon') {
                                        if (i == 0) {
                                            pAttacks.push(telem)
                                        }
                                        attacks.push(telem)
                                    }
                                    if (telem.victim && telem.victim.name !== playerName){
                                        // console.log('victim..?', telem)
                                        if (i == 0) {
                                            pHits.push(telem)
                                        }
                                        hits.push(telem)
                                    }
                                }
                            }
                        }))
                        //last match data
                        console.log('phits and attacks', pHits.length, pAttacks.length)
                        let prevAccuracy = ((pHits.length / pAttacks.length) * 100).toFixed(2)
                        console.log('attacks', attacks.length)
                        console.log('hits', hits.length)
                        console.log('accuracy', ((pHits.length + hits.length) / (pAttacks.length + attacks.length) * 100).toFixed(2))
                        // previous match data
                        pDeath ? prevMatch.Killer = pDeath[0] : prevMatch.Winner = true
                        prevMatch.KillCount = pKills.length
                        prevMatch.KillData = pKills
                        prevMatch.Accuracy = isNaN(prevAccuracy) ? 0 : prevAccuracy
                        playerData.PrevMatch = prevMatch
                        console.log(deaths)
                        playerData.PlayerKD = (kills.length / deaths.length).toFixed(2)
                        // playerData.Hits = hits.length;
                        // playerData.pattacks = pAttacks;
                        // playerData.phits = pHits;
                        // playerData.prevMatches = matchTelemArray[0]
                        playerData.AverageAccuracy = (hits.length/attacks.length * 100).toFixed(2)
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
