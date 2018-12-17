const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const morgan = require('morgan')
const cors = require('cors')
const routes = require('./routes')

app.use('/shard', routes)
app.use(cors())
app.use(morgan('combined'))

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


