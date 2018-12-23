const q = require('./queries.js')

module.exports = {
    // getPlayerKD: (matchArr) => {

    // },
    sortMatchStats: (shard, matchArr, playerName) => {
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
        let stats = {}
        stats.soloKD = isNaN(soloKills / soloDeaths) ? '0.0' : (soloKills/soloDeaths).toFixed(2)
        console.log('stats', stats)
        console.log('kills, solo duo squad', soloKills, duoKills, squadKills)
        console.log('deaths, solo duo squad', soloDeaths, duoDeaths, squadDeaths)
        return stats
    },
    sortMatchTelem: (matchArr, playerName) => {
        // console.log('new matcharr', matchArr)
        let matchData = {}
        // ADD RECENT MATCH PERECENT
        let missedAttacks = []
        let enemiesHit = []
        let attackers = []
        let hits = []
        let kills = []
        let killer = []
        let knocks = []
        let knocker = []
        return q.getMatchTelemetry(matchArr).then(response => {
            return response.map(data => {
                //get prev match telemetry below
                let playerTelem = data.filter(telem => telem.character && telem.character.name === playerName)
                // console.log(playerTelem)
                //sort prev telem data below
                let teamMates = []
                data.map(telem => {
                    //get attacks below
                    if (telem.attacker) {
                        if (telem.attacker.name === playerName){
                            // console.log('attack', telem)
                            if (!telem.victim && telem.attackType === 'Weapon' && telem.weapon.itemId !== '') {
                                missedAttacks.push(telem)
                            }
                            if (telem.victim && telem.victim.name !== playerName){
                                // console.log('enemy hit!', telem)
                                if (telem.dBNOId){
                                    knocks.push(telem)
                                }
                                hits.push(telem)
                                hits.map(hit => {
                                    if (!enemiesHit.includes(hit.victim.name)) enemiesHit.push(hit.victim.name)
                                })
                            }
                        }
                        if (telem.victim && telem.victim.name === playerName && telem.attacker.name !== playerName) {
                            // console.log('hurt', telem)
                            if (telem.dBNOId) {
                                knocker.push(telem)
                            }
                            attackers.push(telem)
                        }
                    }

                    if (telem.killer){
                        if (telem.killer.name === playerName) {
                            // console.log('kill!', telem)
                            kills.push(telem)
                        }
                        if (telem.victim.name === playerName) {
                            // console.log('dead...', telem)
                            killer.push(telem)
                        }
                    }
                    if (telem.character && telem.character.name !== playerName && telem.character.teamId === playerTelem[0].character.teamId && !teamMates.includes(telem.character.name)) {
                        teamMates.push(telem.character.name)
                    }
                })

                let accuracy = (hits.length / (missedAttacks.length + hits.length) * 100).toFixed(2);
                matchData.accuracy = isNaN(accuracy) ? '0.0' : accuracy;
                matchData.teamMates = teamMates
                // matchData.missedAttacks = missedAttacks;
                // matchData.attackCount = missedAttacks.length;
                // matchData.hitCount = hits.length;
                // matchData.hits = hits;
                // matchData.telemetry = response; //respond with all telemetry
                // matchData.mapName = matchArr[0].data.attributes.mapName
                // matchData.matchId = matchArr[0].data.id
                // matchData.stats = allMatchStats[0]
                // matchData.gameMode = matchArr[0].data.attributes.gameMode
                matchData.killer = killer;
                matchData.kills = kills;
                matchData.attackers = attackers;
                matchData.enemiesHit = enemiesHit;
                matchData.knocks = knocks;
                matchData.knocker = knocker;
                return matchData
            })
        }).catch(err => console.log(err))
    }
}
