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
                let matchTelemArr = [];
                playerData.TotalMatchesPlayed = response.relationships.matches.data.length;
                matchArr.map(match => {
                    assetsArr.push(match.included.filter( data => data.type === 'asset' && data.id === match.data.relationships.assets.data[0].id)[0])
                })
                let attacks = []
                let hits = []
                let pAttacks = []
                let pHits = []
                let kills = []
                let pKills = []
                let deaths = []
                let pDeath = []
                let prevMatch = {}
                let prevMatchArr = []
                let teamMates = []
                let allMatchStats = []
                //get general stats
                // console.log(matchArr[0])
                //get last match telemetry below
                let prevMatchTempArr = []
                prevMatchTempArr.push(assetsArr[0])
                allMatchStats = matchArr.map(match => match.included.filter(data => data.type === 'participant' && data.attributes.stats.name === playerName)[0].attributes.stats)
                // console.log(matchArr[0].included.filter(data => data.type === 'participant' && data.attributes.stats.name === playerName)[0].attributes.stats)
                q.getMatchTelemetry(prevMatchTempArr).then(response => {
                    response.map(data => {
                        //get prev match telemetry below
                        let prevTelem = data.filter(telem => telem.character && telem.character.name === playerName)
                        // console.log(prevTelem)
                        //sort prev telem data below
                        let teamMates = []
                        data.map(telem => {
                            if (telem.attacker) {
                                if (telem.attacker.name === playerName){
                                    // console.log('attack', telem)
                                    if (telem.victim){
                                        console.log('enemy hit!', telem)
                                    }
                                }
                                if (telem.victim && telem.victim.name === playerName) {
                                    // console.log('hurt', telem)
                                }
                            }

                            if (telem.killer){
                                if (telem.killer.name === playerName) {
                                    console.log('kill!', telem)
                                }
                                if (telem.victim.name === playerName) {
                                    console.log('dead...', telem)
                                }
                            }
                            if (telem.character && telem.character.name !== playerName && telem.character.teamId === prevTelem[0].character.teamId && !teamMates.includes(telem.character.name)) {
                                teamMates.push(telem.character.name)
                            }
                        })
                        prevMatch.teamMates = teamMates
                        prevMatch.mapName = matchArr[0].data.attributes.mapName
                        prevMatch.matchId = matchArr[0].data.id
                        prevMatch.stats = allMatchStats[0]
                        prevMatch.gameMode = matchArr[0].data.attributes.gameMode
                        // console.log(matchArr[0])
                        playerData.prevMatch = prevMatch
                        res.json(playerData)
                    })
                   // let teamNum = telem.filter(data => data.character && data.character.name == playerName)[0].character.teamId
                   // telem.map(data => data.character && data.character.name !== playerName && data.character.teamId === teamNum && !teamMates.includes(data.character.name) ? teamMates.push(data.character.name) : data)
                })
                // console.log('assets arr', assetsArr)
                //q.getMatchTelemetry(assetsArr) // get telemetry
                //    .then(res => res.map(telem => matchTelemArr.push(telem)))
                //    .then(response => {
                //        //sort telemetry below
                //        let attacks = []
                //        let hits = []
                //        let pAttacks = []
                //        let pHits = []
                //        let kills = []
                //        let pKills = []
                //        let deaths = []
                //        let pDeath = []
                //        let prevMatch = {}
                //        let prevMatchArr = []
                //        let teamMates = []
                //        //sort recent match data below for all recent matches and prev match
                //        matchTelemArr.map((el, i) => {
                //            if (i == 0) {
                //                let teamNum = el.filter(telem => telem.character && telem.character.name == playerName)[0].character.teamId
                //                el.map(telem => telem.character && telem.character.name !== playerName && telem.character.teamId === teamNum && !teamMates.includes(telem.character.name) ? teamMates.push(telem.character.name) : telem)
                //            }
                //            //find base prev match survival times etc below
                //            el.map((telem, i) => {
                //                if (telem.character) {
                //                    // console.log('base telem', telem)
                //                }
                //            })
                //            if (i < 6) {
                //                //populate previous match list below
                //                prevMatchArr.push({ id: matchArr[i].data.id, attributes: { MatchType: matchArr[i].data.attributes.gameMode, URL: assetsArr[i].attributes.URL, map: matchArr[i].data.attributes.mapName, timeStart: matchArr[i].data.attributes.createdAt } })
                //                // prevMatch.MatchTelemetry = el
                //                // prevMatch.Kills =
                //            }
                //            el.map(telem => {
                //            if (i < 1 && telem.characters){
                //                // console.log('telem', matchArr[i].data.attributes)
                //                //get teammates below
                //                // console.log('telem', telem)
                //            }
                //            //get kills below
                //            if (telem.killer && telem.killer.name === playerName && telem.victim.name !== playerName) {
                //                if (i == 0) {
                //                    pKills.push(telem)
                //                }
                //                kills.push({ MatchType: matchArr[i].data.attributes.gameMode, data: telem })
                //                // console.log('kill!', telem)
                //            }
                //            if (telem.killer && telem.victim.name == playerName) {
                //                // console.log('deeeeath', telem)
                //                if (i == 0) {
                //                    pDeath.push(telem)
                //                }
                //                deaths.push({ MatchType: matchArr[i].data.attributes.gameMode, data: telem })
                //            }

                //            //get attacks and hits below
                //            if (telem.attackId && telem.attacker) {
                //                if (telem.attacker.name === playerName) {
                //                    if (telem.attackType === 'Weapon') {
                //                        if (i == 0) {
                //                            pAttacks.push(telem)
                //                        }
                //                        attacks.push(telem)
                //                    }
                //                    if (telem.victim && telem.victim.name !== playerName){
                //                        // console.log('victim..?', telem)
                //                        if (i == 0) {
                //                            pHits.push(telem)
                //                        }
                //                        hits.push(telem)
                //                    }
                //                }
                //            }
                //            })
                //        })
                        // console.log('prevMatches', prevMatchArr)
                        //last match data

//                         prevMatch.TimeStart = matchArr[0].data.attributes.createdAt
//                         prevMatch.MatchType = matchArr[0].data.attributes.gameMode
//                         prevMatch.Shard = matchArr[0].data.attributes.shardId
//                         prevMatch.Map = matchArr[0].data.attributes.mapName
//                         // prevMatch.TimeSurvived = // look for type : participant for relevant data in postman
//                         // check teammates
//                         let prevAccuracy = ((pHits.length / pAttacks.length) * 100).toFixed(2)
//                         pDeath ? prevMatch.Killer = pDeath[0] : prevMatch.Winner = true
//                         prevMatch.KillCount = pKills.length
//                         prevMatch.KillData = pKills
//                         prevMatch.TeamMates = teamMates ? teamMates : null
//                         prevMatch.Accuracy = isNaN(prevAccuracy) ? 0 : prevAccuracy
//                         prevMatch.matchID = matchArr[0].data.id
//                         playerData.PrevMatch = prevMatch
//                         playerData.PrevMatchList = prevMatchArr
//                         let kDSquad = (kills.filter(kill => kill.MatchType == 'squad').length / deaths.filter(death => death.MatchType == 'squad').length).toFixed(2)
//                         let kDDuo = (kills.filter(kill => kill.MatchType == 'duo').length / deaths.filter(death => death.MatchType == 'duo').length).toFixed(2)
//                         let kDSolo = (kills.filter(kill => kill.MatchType == 'solo').length / deaths.filter(death => death.MatchType == 'solo').length).toFixed(2)
//                         playerData.KDSquad = isNaN(kDSquad) ? 0 : kDSquad;
//                         playerData.KDDuo = isNaN(kDDuo) ? 0 : kDDuo;
//                         playerData.KDSolo = isNaN(kDSolo) ? 0 : kDSolo;   // playerData.Hits = hits.length;
//                         // playerData.pattacks = pAttacks;
//                         // playerData.phits = pHits;
//                         // playerData.prevMatches = matchTelemArr[0]
//                         // playerData.prevMatches = matchArr[0]
//                         playerData.AverageAccuracy = (hits.length/attacks.length * 100).toFixed(2)
//                         res.json(playerData)
//                     })
            })
        }
    });
})

router.use((req, res, next) => {
    let err = new Error('Enter a valid player name for that sweet player data');
    next(err);
})

module.exports = router;
