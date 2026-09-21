const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),e=require(path.join(root,'engine.js')),c=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'))).artists;
const before=require('./before.json'),after=require('./after.json');
assert.equal(after.length,50);assert.equal(c.length,3014);
for(const row of after){
 const a=c.find(a=>a.artist===row.artist);
 for(const mode of ['Similar','Adjacent','Wildcard']){
  const r=e.recommend(a,c,mode,12);assert.equal(r.length,12);assert.equal(new Set(r.map(x=>x.artist.artist)).size,12);
  assert(r.every(x=>x.artist.artist!==a.artist&&Number.isFinite(x.score)&&x.score>=0&&x.score<=1));
  const blocked=new Set(r.slice(0,3).map(x=>x.artist.artist));
  const filtered=e.recommend(a,c,mode,12,blocked);assert.equal(filtered.length,12);assert(filtered.every(x=>!blocked.has(x.artist.artist)));
  assert.deepEqual(r.map(x=>x.artist.artist),row.results[mode].map(x=>x.artist));
 }
}
const list=(name,mode='Similar')=>after.find(x=>x.artist===name).results[mode].map(x=>x.artist);
assert.equal(list('HEALTH')[0],'Nine Inch Nails');assert.equal(list('Mdou Moctar')[0],'Tinariwen');
assert(!list('Mdou Moctar','Adjacent').includes('Gustav Holst'));
assert(!list('Justice','Wildcard').includes('Karlheinz Stockhausen'));
assert(list('Dolly Parton','Adjacent').slice(0,5).includes('Charley Pride'));
assert.deepEqual(list("Her's").slice(0,5),before.find(x=>x.artist==="Her's").results.Similar.slice(0,5).map(x=>x.artist));
for(const name of ['Daft Punk','Nirvana','A Tribe Called Quest'])assert.deepEqual(list(name).slice(0,5),before.find(x=>x.artist===name).results.Similar.slice(0,5).map(x=>x.artist));
console.log('PASS: 50 seeds × 3 modes, result integrity, dislikes, snapshot reproducibility and targeted regressions.');
