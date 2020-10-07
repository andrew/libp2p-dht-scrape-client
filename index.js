
const fetch = require('node-fetch')
const toIterable = require('stream-to-it')
const ndjson = require('iterable-ndjson')
const log = require('log-update')
const fs = require('fs')

async function main () {
  let dataPoints = 0
  const peers = new Map() // peerID -> { peerID, addresses, agentVersion, protocols }
  const versions = new Map() // agentVersion -> count

  const res = await fetch('http://51.158.108.61:3000/peers')
  if (!res.ok) {
    throw new Error('not ok!')
  }

  const source = ndjson(toIterable(res.body))

  for await (const { peerID, addresses, agentVersion, protocols } of source) {
    dataPoints++
    const peerData = peers.get(peerID)

    if (agentVersion) {
      if (!peerData || !peerData.agentVersion) {
        versions.set(agentVersion, (versions.get(agentVersion) || 0) + 1)
      }
    }

    peers.set(peerID, mergePeerData(peerData, { peerID, addresses, agentVersion, protocols }))

    const stortedVersions = Array.from(versions).sort((a, b) => b[1] - a[1])

    log(`Data points: ${dataPoints}
Unique peers: ${peers.size}
Versions:
${stortedVersions.slice(0, 20).map(([k, v]) => `  ${v}x ${k}`).join('\n')}
  ...and ${stortedVersions.slice(20).length} more
`)

    if(peers.size % 100 == 0){
      fs.writeFile('output.json', JSON.stringify(Object.fromEntries(peers)), 'utf8', function(){});
    }

  }
}

function mergePeerData (p0 = {}, p1 = {}) {
  return {
    peerID: p0.peerID || p1.peerID,
    addresses: mergeStringArrays(p0.addresses, p1.addresses),
    agentVersion: p0.agentVersion || p1.agentVersion,
    protocols: mergeStringArrays(p0.protocols, p1.protocols)
  }
}

function mergeStringArrays (a0 = [], a1 = []) {
  if(a1 === null){
    return a0;
  }
  return [...new Set(a0.concat(a1))]
}

main().catch(console.error)
