const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const morgan = require('morgan')
const cors = require('cors')
const routes = require('./player-routes')

app.use('/player', routes)
app.use(cors())
app.use(morgan('combined'))
require('dotenv').config()

app.use((req, res, next) => {
    let err = new Error('Nothing Found...')
    err.status = 404
    next(err)
})

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message })
})

const listener = () => console.log( `PUBG Stat Party on port: ${port}` )

app.listen(port, listener)


