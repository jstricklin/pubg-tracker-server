const express = require('express')
const app = express()
const port = process.env.PORT || 3000
const morgan = require('morgan')
const cors = require('cors')
const routes = require('./routes')

app.use('/', routes)
app.use(cors())
app.use(morgan('combined'))
require('dotenv').config()

const listener = () => console.log( `PUBG Stat Party on port: ${port}` )

app.listen(port, listener)
