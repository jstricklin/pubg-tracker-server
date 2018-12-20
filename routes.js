const express = require('express');
const router = express.Router();
const queries = require('./queries.js');
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser');
const f = require('./funcs.js');

let q = require('./queries.js')

router.use(bodyParser.urlencoded( { extended: false } ));
router.use(bodyParser.json());
router.use(cors());
router.use(morgan('combined'));

// Single player info below
router.get('/:shard/player/:name', (req, res, next) => {
    let playerName = req.params.name;
    let shard = req.params.shard;
    console.log('hit')
    console.log('req params', req.params)

    let playerData = { PlayerName: playerName }     //initialize playerData object
    q.getPlayerData(shard, playerName).then(response => {
        if (response instanceof Error){
            next({ message: 'Player not found...' })
        } else if (response.relationships.matches.data.length == 0) {
            // console.log('no matches', response.relationships.matches)
            next({ message: 'No recent match data found' })
        }
        else {
            // console.log('matches found', response.relationships.matches)
            q.getMatchData(shard, response.relationships.matches.data).then(matchArr => {
                // raw matches below
                let assetsArr = [];
                let matchTelemArr = [];
                let prevMatchArr = []
                playerData.TotalMatchesPlayed = response.relationships.matches.data.length;
                matchArr.map(match => {
                    let matchData = match.included.filter( data => data.type === 'asset' && data.id === match.data.relationships.assets.data[0].id)[0]
                    // populate recent matches below
                    let winPlace = match.included.filter(stat => stat.type == 'participant' && stat.attributes.stats.name == playerName)[0].attributes.stats.winPlace
                    prevMatchArr.push({ matchId: match.data.id, telemetryURL: match.included.filter(data => data.type == 'asset')[0].attributes.URL, winPlace: winPlace, winner: winPlace == 1, attributes: match.data.attributes, stats: match.included.filter(stat => stat.type == 'participant' && stat.attributes.stats.name == playerName)[0] })
                    assetsArr.push(matchData)
                })
                // ADD RECVENT MATVCH PERECENT
                let missedAttacks = []
                let enemiesHit = []
                let attackers = []
                let hits = []
                // let pAttacks = []
                // let pHits = []
                let kills = []
                let soloKills = 0
                let soloDeaths = 0
                let duoKills = 0
                let duoDeaths= 0
                let squadKills = 0
                let squadDeaths = 0
                let killer = []
                let knocks = []
                let knocker = []
                // let pKills = []
                let deaths = []
                // let allDeaths = 0
                // let pDeath = []
                let prevMatch = {}
                let teamMates = []
                let allMatchStats = []
                let soloKD = []
                let duoKD = []
                let squadKD = []
                //get general stats
                // console.log(matchArr[0])
                //get last match telemetry below
                let prevMatchTempArr = []
                prevMatchTempArr.push(assetsArr[0])
                // console.log(matchArr.length)
                allMatchStats = matchArr.map(match => match.included.filter(data => data.type === 'participant' && data.attributes.stats.name === playerName)[0].attributes.stats)
                allMatchStats.map(( stats, i ) => {
                    switch(matchArr[i].data.attributes.gameMode) {
                        case ('solo') : {
                            soloKills += stats.kills
                            if (stats.deathType !== '') soloDeaths++
                        }
                            break
                        case ('duo') : {
                            duoKills += stats.kills
                            if (stats.deathType !== '') duoDeaths++
                        }
                            break
                        case ('squad') : {
                            squadKills += stats.kills
                            if (stats.deathType !== '') squadDeaths++
                        }
                            break
                    }
                })
                console.log('kills, solo duo squad', soloKills, duoKills, squadKills)
                console.log('deaths, solo duo squad', soloDeaths, duoDeaths, squadDeaths)
                q.getMatchTelemetry(prevMatchTempArr).then(response => {
                    response.map(data => {
                        //get prev match telemetry below
                        let prevTelem = data.filter(telem => telem.character && telem.character.name === playerName)
                        // console.log(prevTelem)
                        //sort prev telem data below
                        let teamMates = []
                        data.map(telem => {
                            //get attacks below
                            if (telem.attacker) {
                                if (telem.attacker.name === playerName){
                                    // console.log('attack', telem)
                                    if (!telem.victim && telem.attackType === 'Weapon' && telem.weapon.itemId !== '') {
                                        missedAttacks.push(telem)
                                    }
                                    if (telem.victim && telem.victim.name !== playerName){
                                        // console.log('enemy hit!', telem)
                                        if (telem.dBNOId){
                                            knocks.push(telem)
                                        }
                                        hits.push(telem)
                                        hits.map(hit => {
                                            if (!enemiesHit.includes(hit.victim.name)) enemiesHit.push(hit.victim.name)
                                        })
                                    }
                                }
                                if (telem.victim && telem.victim.name === playerName && telem.attacker.name !== playerName) {
                                    // console.log('hurt', telem)
                                    if (telem.dBNOId) {
                                        knocker.push(telem)
                                    }
                                    attackers.push(telem)
                                }
                            }

                            if (telem.killer){
                                if (telem.killer.name === playerName) {
                                    // console.log('kill!', telem)
                                    kills.push(telem)
                                }
                                if (telem.victim.name === playerName) {
                                    // console.log('dead...', telem)
                                    killer.push(telem)
                                }
                            }
                            if (telem.character && telem.character.name !== playerName && telem.character.teamId === prevTelem[0].character.teamId && !teamMates.includes(telem.character.name)) {
                                teamMates.push(telem.character.name)
                            }
                        })

                        let accuracy = (hits.length / (missedAttacks.length + hits.length) * 100).toFixed(2);
                        prevMatch.accuracy = isNaN(accuracy) ? '0.0' : accuracy;
                        prevMatch.teamMates = teamMates
                        // prevMatch.missedAttacks = missedAttacks;
                        // prevMatch.attackCount = missedAttacks.length;
                        // prevMatch.hitCount = hits.length;
                        // prevMatch.hits = hits;
                        // prevMatch.telemetry = response; //respond with all telemetry
                        prevMatch.mapName = matchArr[0].data.attributes.mapName
                        prevMatch.matchId = matchArr[0].data.id
                        prevMatch.stats = allMatchStats[0]
                        prevMatch.gameMode = matchArr[0].data.attributes.gameMode
                        prevMatch.killer = killer;
                        prevMatch.kills = kills;
                        prevMatch.attackers = attackers;
                        prevMatch.enemiesHit = enemiesHit;
                        prevMatch.knocks = knocks;
                        prevMatch.knocker = knocker;
                        playerData.prevMatch = prevMatch;
                        playerData.prevMatches = prevMatchArr;
                        playerData.soloKD = isNaN(soloKills/soloDeaths) ? '0.00' : (soloKills/soloDeaths).toFixed(2)
                        playerData.duoKD = isNaN(duoKills/duoDeaths) ? '0.00' : (duoKills/duoDeaths).toFixed(2)
                        playerData.squadKD = isNaN(squadKills/squadDeaths) ? '0.00' : (squadKills/squadDeaths).toFixed(2)
                        res.json(playerData);
                    })
                })
            })
        }
    });
})

router.get('/:shard/player/:playerName/match/:matchId/', (req, res, next) => {
    let shard = req.params.shard;
    let playerName = req.params.playerName
    let matchId = []
    matchId.push({id: req.params.matchId})

    console.log('match route hit')

    q.getMatchData(shard, matchId).then(response => {
        console.log('get match res', response)
       res.json(response)
    })
})

    router.use((req, res, next) => {
        let err = new Error('Enter a valid player route for that sweet data');
        next(err);
    })

    module.exports = router;
