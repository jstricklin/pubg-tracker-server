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
    q.getPlayerData(playerName).then(response => res.json({ PlayerName: playerName, MatchesPlayed: response.relationships.matches.data.length }));
})

router.use((req, res, next) => {
    let err = new Error('Enter a valid player name for that sweet player data');
    next(err);
})

module.exports = router;
