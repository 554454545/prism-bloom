import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('artifacts',{recursive:true});
import assert from 'node:assert/strict';
import {SCENES,LENGTH} from '../src/signal-film.js';
const browser=await chromium.launch({headless:true});const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1360,height:1100},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.goto((process.env.TEST_URL||'http://localhost:4180')+'/study.html',{waitUntil:'networkidle'});await page.waitForSelector('[data-ready=true]');
 assert.equal(await page.evaluate(()=>document.visibilityState),'visible');
 assert.equal(await page.locator('#seek').getAttribute('max'),String(LENGTH));
 await page.screenshot({path:'artifacts/study-desktop.png',fullPage:true});
 assert.ok(await page.locator('#study').evaluate(c=>c.width>0&&c.height>0));
 const frames=[];
 for(const t of SCENES.map(s=>s.sample)){
  await page.locator('#seek').fill(String(t));await page.locator('#stage').screenshot({path:`artifacts/study-${t}.png`});
  frames.push(await page.locator('#study').evaluate(c=>c.toDataURL()));

 }
 assert.equal(new Set(frames).size,SCENES.length);
 await page.locator('#seek').fill(String(SCENES[3].sample));assert.equal(await page.locator('#study').evaluate(c=>c.toDataURL()),frames[3]);
 await page.locator('#seek').fill('0');await page.locator('#play').click();await page.waitForTimeout(700);await page.locator('#play').click();
 const paused=+await page.locator('#stage').getAttribute('data-time');assert.ok(paused>.3);await page.waitForTimeout(180);assert.equal(+await page.locator('#stage').getAttribute('data-time'),paused);
 await page.locator('#seek').fill(String(LENGTH-.2));await page.locator('#play').click();await page.waitForSelector('#end:not([hidden])');
 await page.locator('#replay').click();await page.waitForTimeout(200);assert.ok(+await page.locator('#stage').getAttribute('data-time')<1);await page.locator('#play').click();
 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
 await page.locator('#fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement||document.querySelector('.player').classList.contains('expanded'));await page.evaluate(()=>document.fullscreenElement?document.exitFullscreen():null);await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.reload();await page.waitForSelector('[data-ready=true]');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/study-mobile.png',fullPage:true});
 for(const t of SCENES.map(s=>s.sample)){await page.locator('#seek').fill(String(t));await page.locator('#stage').screenshot({path:`artifacts/study-mobile-${t}.png`});}
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForSelector('[data-ready=true]');assert.equal(await page.locator('#start').isVisible(),true);
 // Render the complete score offline: finite, non-clipped output with energy throughout the complete study.
 const audio=await page.evaluate(async()=>{
  const {SignalScore,STEP}=await import('/src/signal-sound.js');
  const {LENGTH,SCENES}=await import('/src/signal-journey.js');
  const c=new OfflineAudioContext(2,44100*(LENGTH+1),44100),score=new SignalScore();score.setup(c);
  for(let step=0;step<LENGTH/STEP;step++)score.scheduleStep(step,step*STEP);
  SCENES.forEach((s,i)=>score.accent(i,s.at));
  const buffer=await c.startRendering();let peak=0;const energy=[];
  for(let second=0;second<LENGTH;second++){let sum=0;for(let ch=0;ch<2;ch++){const d=buffer.getChannelData(ch);for(let i=second*44100;i<(second+1)*44100;i++){peak=Math.max(peak,Math.abs(d[i]));sum+=d[i]*d[i];}}energy.push(Math.sqrt(sum/88200));}
  return {peak,energy};
 });
 assert.ok(Number.isFinite(audio.peak)&&audio.peak>.05&&audio.peak<.99,JSON.stringify(audio));assert.ok(audio.energy.slice(0,LENGTH-2).every(v=>v>.004),JSON.stringify(audio));
 console.log(JSON.stringify({audio}));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,errors,checks:'visible canvas, all action cues in the shared world, deterministic seek, playback/pause, ending/replay, sound, fullscreen, mobile, reduced motion'}));
}finally{await browser.close();console.log('Owned headless browser closed');}
