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

    q.getPlayerData(shard, playerName).then(baseMatchData => {
        if (baseMatchData instanceof Error) {
            next({ message: 'Player not found...' })
        } else if (baseMatchData.relationships.matches.data.length == 0) {
            // console.log('no matches', baseMatchData.relationships.matches)
            next({ message: 'No recent match data found' })
        }
        else {
            // get matchStats below
            return q.getMatchData(shard, baseMatchData.relationships.matches.data).then(matchData => {
                // console.log('baesMatchData', baseMatchData.relationships.matches.data[0])
                // console.log('match data', matchData[0])
                let prevMatchData = []
                let prevMatchAsset = []
                //populate previous match list below
                let prevMatchList =[]
                matchData.map((match, i) => {
                    if (i < 15) {
                        prevMatchList.push({ attributes: match.data.attributes, id: match.data.id, stats: match.included.filter(data => data.type === 'participant' && data.attributes.stats.name === playerName)[0].attributes.stats })
                    }
                })
                prevMatchData.push(matchData[0])
                prevMatchAsset.push(prevMatchData[0].included.filter(asset => asset.type === 'asset')[0])
                // prevMatch.push(prevMatchData[0].included)
                let generalStats = f.sortAllMatchStats(shard, matchData, playerName)
                // sort match telem below
                // console.log('stats', generalStats)
                f.sortMatchTelem(prevMatchAsset, playerName).then(sortedData => {
                    // console.log('telem', sortedData)
                    playerData.prevMatch = sortedData
                    playerData.generalStats = generalStats
                    playerData.prevMatchList = prevMatchList
                    res.json(playerData)
                })
                playerData.TotalMatchesPlayed = baseMatchData.relationships.matches.data.length;
            })
        }
    })
})

router.get('/:shard/player/:playerName/match/:matchId/', (req, res, next) => {
    let shard = req.params.shard;
    let playerName = req.params.playerName
    let matchId = []
    matchId.push({id: req.params.matchId})

    console.log('match route hit')

    q.getMatchData(shard, matchId).then(response => {
        // console.log('get match res', response)
        let matchAsset = []
        matchAsset.push(response[0].included.filter(asset => asset.type === 'asset')[0])
        f.sortMatchTelem(matchAsset, playerName).then(sortedTelem => {
            res.json(sortedTelem)
        })
    })
})

router.use((req, res, next) => {
    let err = new Error('Enter a valid player route for that sweet data');
    next(err);
})

module.exports = router;
