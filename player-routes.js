const express = require('express');
const router = express.Router();
const queries = require('./queries.js');
const morgan = require('morgan')
router.use(morgan('combined'))

router.get('/:name', (req, res, next) => {
    let playerName = req.params.name;
    res.json({ PlayerName: playerName });
})

router.use((req, res, next) => {
    let err = new Error('Enter a valid player name for that sweet player data')
    next(err)
})

module.exports = router;
