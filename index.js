
const fetch = require('node-fetch')
const toIterable = require('stream-to-it')
const ndjson = require('iterable-ndjson')
const log = require('log-update')

async function main () {
  let dataPoints = 0
  let peers = new Map() // peerID -> { peerID, addresses, agentVersion, protocols }

  const res = await fetch('http://dht.scrape.stream/peers')
  if (!res.ok) {
    throw new Error('not ok!')
  }

  const source = ndjson(toIterable(res.body))

  for await (const { peerID, addresses, agentVersion, protocols } of source) {
    dataPoints++

    const peerData = peers.get(peerID)

    peers.set(peerID, mergePeerData(peerData, { peerID, addresses, agentVersion, protocols }))

    if(dataPoints % 500 == 0){
      console.log(dataPoints)
      fetch(`http://${process.env.EXPLORER_URL}/nodes/report`, {
              method: 'post',
              redirect: 'follow',
              body:    JSON.stringify({peers: Object.fromEntries(peers)}),
              headers: { 'Content-Type': 'application/json' },
          }).catch(err => console.error(err));

      peers = new Map()
      dataPoints = 0
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
