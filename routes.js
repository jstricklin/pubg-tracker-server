const express = require('express');
const router = express.Router();
const queries = require('./queries.js');

router.get('/', (req, res, next) => {
    res.send('incoming!')
})


module.exports = router;
