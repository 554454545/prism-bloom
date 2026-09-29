import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {LENGTH,storyTime,cameraAt,signalAt,screenPoint,sub,dot} from '../src/signal-journey.js';
assert.equal(LENGTH,20);
let maxStep=0,minFacing=1;
for(let t=.01;t<=LENGTH;t+=.01){const a=cameraAt(storyTime(t-.01)),b=cameraAt(storyTime(t));maxStep=Math.max(maxStep,Math.hypot(...sub(a.eye,b.eye)));minFacing=Math.min(minFacing,dot(a.forward,b.forward));assert.ok([...b.eye,...b.forward,...signalAt(storyTime(t))].every(Number.isFinite));}
assert.ok(maxStep<15&&minFacing>.998,JSON.stringify({maxStep,minFacing}));
// Camera must not cross either folding leaf: measure against the actual moving planes.
let clearance=Infinity;
for(let t=4.65;t<=6.6;t+=.005){const eye=cameraAt(t).eye;for(const side of[-1,1]){const a=screenPoint(t,side,0,0),b=screenPoint(t,side,1,0),v=sub(b,a),d=sub(eye,a),u=dot(d,v)/dot(v,v);if(u>=0&&u<=1&&Math.abs(eye[1])<230){const projected=a.map((x,i)=>x+v[i]*u);clearance=Math.min(clearance,Math.hypot(eye[0]-projected[0],eye[2]-projected[2]));}}}
assert.ok(clearance>24,`Camera intersects the folding screen: ${clearance}`);
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto((process.env.TEST_URL||'http://localhost:4180')+'/study.html',{waitUntil:'networkidle'});
 assert.equal(await page.evaluate(()=>document.visibilityState),'visible');
 const seams=await page.evaluate(async()=>{
  const {SignalFilm}=await import('/src/signal-film.js'),canvas=document.querySelector('#study'),film=new SignalFilm(canvas),out=[];
  try{for(const t of [.38,1.1,1.85,2.35,2.5,3.12,3.5,4.3,4.65,5.05,5.85,6.6,7.4,8,8.8,9.55,10,11.65,13,15.1,16.7,18.9,20.2,21.3,23.7,25.8].map(t=>t/1.3)){film.draw(t-.001);const a=film.ctx.getImageData(0,0,canvas.width,canvas.height).data;film.draw(t+.001);const b=film.ctx.getImageData(0,0,canvas.width,canvas.height).data;let diff=0;for(let i=0;i<a.length;i+=16)diff+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);out.push({t,diff:diff/(a.length/16*3*255)});}}finally{film.dispose();}return out;
 });
 assert.ok(seams.every(s=>s.diff<.025),JSON.stringify(seams));assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,duration:LENGTH,maxStep,minFacing,screenClearance:clearance,seams,errors}));
}finally{await browser.close();}
