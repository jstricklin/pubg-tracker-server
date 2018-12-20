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
    let playerData = { PlayerName: playerName }     //initialize playerData object
    // console.log('hit')
    // console.log('req params', req.params)

    q.getPlayerData(shard, playerName).then(response => {
        if (response instanceof Error){
            next({ message: 'Player not found...' })
        } else if (response.relationships.matches.data.length == 0) {
            // console.log('no matches', response.relationships.matches)
            next({ message: 'No recent match data found' })
        }
        else {
            // console.log('matches found', response.relationships.matches)
            // get matchStats below
            q.getMatchData(shard, response.relationships.matches.data).then(matchArr => {
                // raw matches below
                let assetsArr = [];
                let matchTelemArr = [];
                let prevMatchArr = []
                matchArr.map(match => {
                    let matchData = match.included.filter( data => data.type === 'asset' && data.id === match.data.relationships.assets.data[0].id)[0]
                    // populate recent matches below
                    let winPlace = match.included.filter(stat => stat.type == 'participant' && stat.attributes.stats.name == playerName)[0].attributes.stats.winPlace
                    prevMatchArr.push({ matchId: match.data.id, telemetryURL: match.included.filter(data => data.type == 'asset')[0].attributes.URL, winPlace: winPlace, winner: winPlace == 1, attributes: match.data.attributes, stats: match.included.filter(stat => stat.type == 'participant' && stat.attributes.stats.name == playerName)[0] })
                    assetsArr.push(matchData)
                })
                // let pAttacks = []
                // let pHits = []
                let soloKills = 0
                let soloDeaths = 0
                let duoKills = 0
                let duoDeaths= 0
                let squadKills = 0
                let squadDeaths = 0
                // let pKills = []
                let deaths = []
                // let allDeaths = 0
                // let pDeath = []
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
                // sort all-match average stats below
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
                // sort match telem below
                f.sortMatchTelem(prevMatchTempArr, playerName).then(sortedData => {
                    playerData.prevMatch = sortedData
                    res.json(playerData)
                })
                // playerData.TotalMatchesPlayed = response.relationships.matches.data.length;
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
        // console.log('get match res', response)
       res.json(response)
    })
})

    router.use((req, res, next) => {
        let err = new Error('Enter a valid player route for that sweet data');
        next(err);
    })

    module.exports = router;
