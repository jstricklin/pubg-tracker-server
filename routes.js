const express = require('express');
const router = express.Router();
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser');
const f = require('./funcs.js');

const q = require('./queries.js')

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
                // generalStats is K/D for now
                let generalStats = f.sortAllMatchStats(shard, matchData, playerName)
                // sort match telem below
                // console.log('stats', generalStats)
                playerData.TotalMatchesPlayed = baseMatchData.relationships.matches.data.length;
                f.sortMatchTelem(prevMatchAsset, playerName).then(sortedData => {
                    sortedData[0].matchStats = prevMatchList[0].stats;
                    sortedData[0].matchId = prevMatchList[0].id;
                    sortedData[0].map = prevMatchList[0].attributes.mapName;
                    sortedData[0].gameMode = prevMatchList[0].attributes.gameMode;
                    sortedData[0].matchTime = prevMatchList[0].attributes.createdAt;
                    sortedData[0].shard = shard;
                    playerData.prevMatch = sortedData[0];
                    playerData.generalStats = generalStats;
                    playerData.prevMatchList = prevMatchList;
                    res.json(playerData);
                })
            })
        }
    })
})

router.get('/:shard/player/:playerName/match/:matchId/', (req, res, next) => {
    let shard = req.params.shard;
    let playerName = req.params.playerName
    let matchId = []
    matchId.push({id: req.params.matchId})
    let matchData = {}

    // console.log('match route hit')

    q.getMatchData(shard, matchId).then(match => {
        // console.log('get match res', response)
        let matchAsset = []
        // console.log('match', match[0])
        matchAsset.push(match[0].included.filter(asset => asset.type === 'asset')[0])
        f.sortMatchTelem(matchAsset, playerName).then(sortedData => {
            sortedData[0].matchStats = match[0].included.filter(data => data.type === 'participant' && data.attributes.stats.name === playerName)[0].attributes.stats
            sortedData[0].matchId = match[0].id
            sortedData[0].map = match[0].data.attributes.mapName
            sortedData[0].gameMode = match[0].data.attributes.gameMode
            sortedData[0].matchTime = match[0].data.attributes.createdAt
            sortedData[0].shard = shard;
            matchData.prevMatch = sortedData[0]
            // matchData.generalStats = generalStats
            matchData = (sortedData[0])
            res.json(matchData)
        })
    })
})

router.use((req, res, next) => {
    let err = new Error('Enter a valid player route for that sweet data');
    next(err);
})

module.exports = router;
