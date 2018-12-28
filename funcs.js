const q = require('./queries.js')
module.exports = {
    // getPlayerKD: (matchArr) => {

    // },
    sortAllMatchStats: (shard, matchArr, playerName) => {
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
        stats.duoKD = isNaN(duoKills / duoDeaths) ? '0.0' : (duoKills/duoDeaths).toFixed(2)
        stats.squadKD = isNaN(squadKills / squadDeaths) ? '0.0' : (squadKills/squadDeaths).toFixed(2)
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
        let sortedHits = []
        let attackers = []
        // let sortedHits = {}
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

                                // start memoizing below
                                hits.map((hit) => {
                                    if (!Object.values(sortedHits).filter(val => val.name === hit.victim.name).length) {
                                        let sortedCache = {}
                                        let cache = hits.filter(el => {console.log('filter names', hit.victim.name, el.victim.name ); return el.victim.name === hit.victim.name })
                                        // console.log('checking hit cache')
                                        console.log('hits unfiltered', hits)
                                        // console.log('hits filter', hits.filter(el => el.victim.name === 'One-Eyed-Kakuja'))
                                        // console.log('test filter', hits.filter(el=> el.victim.name == 'One-Eyed-Kakuja'))
                                        console.log('cache', cache.length, cache[0].victim.name, cache)
                                        cache.map(hitData => {
                                            console.log('hitData', hitData.victim.name, hitData)
                                            sortedCache.name = hitData.victim.name
                                            // console.log('hitData', hitData)
                                            // console.log('sorted cache weapon check', sortedCache.weapon, hitData.victim.name)
                                            if(sortedCache.weapon && sortedCache.weapon[hitData.damageCauserName]){
                                                console.log('adding weapon damage amt', hitData.damageCauserName)
                                                sortedCache.weapon[hitData.damageCauserName] = hitData.damage
                                            } else if (sortedCache.weapon) {
                                                console.log('adding additional weapon')
                                            } else {
                                                console.log('adding first weapon', hitData.damageCauserName)
                                                sortedCache.weapon = hitData.damageCauserName
                                                sortedCache.weapon[hitData.damageCauserName] = hitData.damage
                                            }
                                        })
                                        // console.log('sortedCache', sortedCache)
                                        sortedHits.push(sortedCache)
                                    }
                                    // console.log('sorted cache', sortedCache)
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
                matchData.sortedHits = sortedHits
                matchData.killer = killer[0];
                matchData.kills = kills;
                matchData.attackers = attackers;
                matchData.enemiesHit = enemiesHit;
                matchData.knocks = knocks;
                matchData.knocker = knocker;
                console.log('sorted hits', sortedHits)
                return matchData
            })
        }).catch(err => console.log(err))
    }
}
