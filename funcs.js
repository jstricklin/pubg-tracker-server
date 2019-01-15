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
        // console.log('stats', stats)
        // console.log('kills, solo duo squad', soloKills, duoKills, squadKills)
        // console.log('deaths, solo duo squad', soloDeaths, duoDeaths, squadDeaths)
        return stats
    },
    sortMatchTelem: (matchArr, playerName) => {
        // console.log('new matcharr', matchArr)
        let matchData = {}
        // ADD RECENT MATCH PERECENT
        let missedAttacks = []
        let sortedHits = []
        let attackers = []
        let sortedAttackers = []
        let hits = []
        let kills = []
        let killer = []
        let sortedKiller = {}
        let sortedKills = []
        let knocks = []
        let sortedKnocks = []
        let knocker = []
        let sortedKnocker = []
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
                // start memoizing data below
                // memo knocker
                knocker.map(knock => {
                    sortedKnocker.push({
                        name: knock.attacker.name,
                        teamId: knock.attacker.teamId,
                        weapon: knock.damageCauserName,
                        damageReason: knock.damageReason,
                        distance: knock.distance,
                        // knockerLoc: knocker[0].attacker.location,
                        // playerLoc: knocker[0].victim.location
                    })
                })
                // memo killer
                killer.length ? sortedKiller = {
                    name: killer[0].killer.name,
                    teamId: killer[0].killer.teamId,
                    weapon: killer[0].damageCauserName,
                    damageReason: killer[0].damageReason,
                    distance: killer[0].distance,
                    // killerLoc: killer[0].killer.location,
                    // playerLoc: killer[0].victim.location
                }
                    : sortedKiller = null
                // memo attackers
                attackers.map(attacker => {
                    if (!Object.values(sortedAttackers).filter(val => val.attacker.name === attacker.attacker.name).length) {
                        let sortedCache = {}
                        let cache = attackers.filter(el => {
                            return el.attacker.name === attacker.attacker.name
                        })
                        cache.map(hitData => {
                            sortedCache.attacker = { name: hitData.attacker.name, teamId: hitData.attacker.teamId }
                            if (sortedCache.weapon) {
                                if (sortedCache.weapon.filter(weapon => weapon.name === hitData.damageCauserName).length > 0) {
                                    sortedCache.weapon.map(weapon => {if (weapon.name === hitData.damageCauserName) weapon.totalDmg += hitData.damage || 0 })
                                    // console.log('adding weapon damage', sortedCache.weapon)
                                } else {
                                    sortedCache.weapon.push({ name: hitData.damageCauserName, totalDmg: hitData.damage })
                                    // console.log('adding additional weapon', sortedCache.weapon)
                                }
                            } else {
                                sortedCache.weapon = []
                                sortedCache.weapon.push({ name: hitData.damageCauserName, totalDmg: hitData.damage })
                                // console.log('adding first weapon', sortedCache.weapon)
                            }
                        })
                        sortedAttackers.push(sortedCache)
                    }
                })

                // memo hits
                hits.map((hit) => {
                    // memo player hits below
                    if (!Object.values(sortedHits).filter(val => val.victim.name === hit.victim.name).length) {
                        let sortedCache = {}
                        let cache = hits.filter(el => { return el.victim.name === hit.victim.name })
                        cache.map(hitData => {
                            sortedCache.victim = { name: hitData.victim.name, teamId: hitData.victim.teamId }
                            if (sortedCache.weapon) {
                                if (sortedCache.weapon.filter(weapon => weapon.name === hitData.damageCauserName).length > 0) {
                                    sortedCache.weapon.map(weapon => {if (weapon.name === hitData.damageCauserName) weapon.totalDmg += hitData.damage || 0 })
                                    // console.log('adding weapon damage', sortedCache.weapon, hitData.damage)
                                } else {
                                    sortedCache.weapon.push({ name: hitData.damageCauserName, totalDmg: hitData.damage })
                                    // console.log('adding additional weapon', sortedCache.weapon)
                                }
                            } else {
                                sortedCache.weapon = []
                                sortedCache.weapon.push({ name: hitData.damageCauserName, totalDmg: hitData.damage })
                                // console.log('adding first weapon', sortedCache.weapon)
                            }
                        })
                        sortedHits.push(sortedCache)
                    }
                })
                // memo knocks
                knocks.map(knock => {
                    let sortKnock = {
                        victim: {
                            name: knock.victim.name,
                            teamId: knock.victim.teamId
                        },
                        weapon: knock.damageCauserName,
                        damageReason: knock.damageReason,
                        distance: knock.distance,
                    }
                    sortedKnocks.push(sortKnock)
                })
                // memo kills
                kills.map(kill => {
                    let sortKill = {
                        victim: {
                            name: kill.victim.name,
                            teamId: kill.victim.teamId
                        },
                        weapon: kill.damageCauserName,
                        damageReason: kill.damageReason,
                        distance: kill.distance,
                    }
                    sortedKills.push(sortKill)
                })

                // end hit memos
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
                // matchData.gameMode = matchArr[0].data.attributes.gameMode
                matchData.sortedHits = sortedHits
                matchData.killer = sortedKiller;
                // matchData.unsortKiller = killer[0]
                // matchData.kills = kills;
                matchData.sortedKills = sortedKills
                // matchData.attackers = attackers;
                matchData.sortedAttackers = sortedAttackers;
                // matchData.knocks = knocks;
                matchData.sortedKnocks = sortedKnocks;
                matchData.sortedKnocker = sortedKnocker;
                // matchData.knocker = knocker;
                // console.log('sorted hits', sortedHits)
                return matchData
            })
        }).catch(err => console.log(err))
    }
}
