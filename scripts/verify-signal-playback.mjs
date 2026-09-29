import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {LENGTH,SCENES} from '../src/signal-journey.js';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.audioStats={started:0,ended:0,contexts:[]};const Original=window.AudioContext;
  window.AudioContext=class extends Original{constructor(...args){super(...args);audioStats.contexts.push(this);}
   createOscillator(){const node=super.createOscillator();audioStats.started++;node.addEventListener('ended',()=>audioStats.ended++);return node;}
  };
 });
 await page.goto((process.env.TEST_URL||'http://localhost:4180')+'/study.html');
 await page.locator('#start').click();
 const playback=await page.evaluate(()=>new Promise((resolve,reject)=>{
  const began=performance.now(),seen=new Set(),deltas=[];let previous=began;
  const timeout=setTimeout(()=>reject(new Error('Playback did not finish within 40 seconds')),40000);
  function tick(now){deltas.push(now-previous);previous=now;seen.add(Number(document.querySelector('#stage').dataset.scene));
   if(document.querySelector('#end').hidden){requestAnimationFrame(tick);return;}
   clearTimeout(timeout);resolve({seconds:(now-began)/1000,frames:deltas.length,scenes:[...seen],meanFrameMs:deltas.reduce((a,b)=>a+b,0)/deltas.length,audioContexts:audioStats.contexts.map(c=>c.state),notes:audioStats.started});
  }requestAnimationFrame(tick);
 }));
 assert.equal(playback.scenes.length,SCENES.length);assert.ok(playback.seconds>=LENGTH-1&&playback.seconds<LENGTH+5);assert.ok(playback.notes>LENGTH*8);assert.deepEqual(playback.audioContexts,['running']);assert.deepEqual(errors,[]);
 await page.waitForTimeout(400);
 const remaining=await page.evaluate(()=>audioStats.started-audioStats.ended);assert.equal(remaining,0);
 console.log(JSON.stringify({passed:true,...playback,remainingOscillators:remaining,errors}));
}finally{await browser.close();}
