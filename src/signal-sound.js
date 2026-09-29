import {SCENES,LENGTH} from './signal-journey.js';
// Original 132 BPM electro groove. Sixteenths share the film's absolute timeline.
export const STEP=60/132/4;
const LEVEL=.58;
const frequency=midi=>440*2**((midi-69)/12);
export class SignalScore{
 constructor(){this.context=null;this.enabled=true;this.nextStep=null;this.voices=new Set();this.offset=0;this.nextScene=0;}
 setup(c){
  this.context=c;this.master=c.createGain();this.master.gain.value=this.enabled?LEVEL:0;
  const compressor=c.createDynamicsCompressor();compressor.threshold.value=-14;compressor.knee.value=10;compressor.ratio.value=6;compressor.attack.value=.003;compressor.release.value=.13;
  this.master.connect(compressor);compressor.connect(c.destination);
  this.echo=c.createDelay(.5);this.echo.delayTime.value=.1875;const wet=c.createGain();wet.gain.value=.14;this.echo.connect(wet);wet.connect(this.master);
  this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.noise.getChannelData(0);let seed=8741;
  for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
 }
 async start(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return false;if(!this.context)this.setup(new Audio());await this.context.resume();return this.context.state==='running';}catch{return false;}}
 setEnabled(on){this.enabled=on;this.reset();if(this.master)this.master.gain.setTargetAtTime(on?LEVEL:0,this.context.currentTime,.025);}
 reset(){this.nextStep=null;if(!this.context)return;const now=this.context.currentTime;for(const v of this.voices){try{v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(0,now,.008);v.source.stop(now+.04);}catch{}}}
 voice(source,when,length,volume,{cutoff=9000,filterType='lowpass',pan=0,echo=false,attack=.004}={}){
  const c=this.context,gain=c.createGain(),filter=c.createBiquadFilter(),stereo=c.createStereoPanner();filter.type=filterType;filter.frequency.value=cutoff;stereo.pan.value=pan;
  gain.gain.setValueAtTime(0,when);gain.gain.linearRampToValueAtTime(volume,when+attack);gain.gain.exponentialRampToValueAtTime(.0001,when+Math.max(attack+.01,length));
  source.connect(filter);filter.connect(gain);gain.connect(stereo);stereo.connect(this.master);if(echo)stereo.connect(this.echo);
  const v={source,gain};this.voices.add(v);source.onended=()=>{this.voices.delete(v);source.disconnect();filter.disconnect();gain.disconnect();stereo.disconnect();};source.start(when);source.stop(when+length+.02);
 }
 tone(when,hz,length,volume,type='sine',options={}){const osc=this.context.createOscillator();osc.type=type;osc.frequency.setValueAtTime(hz,when);if(options.endHz)osc.frequency.exponentialRampToValueAtTime(options.endHz,when+length);this.voice(osc,when,length,volume,options);}
 hiss(when,length,volume,cutoff,pan=0){const source=this.context.createBufferSource();source.buffer=this.noise;this.voice(source,when,length,volume,{cutoff,filterType:'highpass',pan});}
 accent(index,when){
  if(index===0)return;
  const pan=index%2?.4:-.4;
  if(index%4===0){this.tone(when,170,.32,.25,'sine',{endHz:42});this.hiss(when,.24,.1,1800,pan);}
  else if(index%4===1){this.tone(when,1600,.21,.08,'triangle',{endHz:180,pan,echo:true});this.hiss(when,.09,.08,4200,-pan);}
  else if(index%4===2){for(let i=0;i<3;i++)this.tone(when+i*.045,330*2**(i*.5),.12,.07,'square',{cutoff:2100,pan:(i-1)*.4});}
  else{this.hiss(when,.28,.11,1600,pan);this.tone(when,120,.25,.14,'sine',{endHz:65});}
 }
 scheduleStep(step,when){
  const beat=step%16,bar=Math.floor(step/16),t=step*STEP;
  if(t>=LENGTH)return;
  const outro=t>=LENGTH-1.5,breakdown=bar===7; // Eleven bars: a brief half-time breath before the final orbit.
  if(outro){if(step===Math.ceil((LENGTH-1.5)/STEP)){[60,64,67,74].forEach((m,i)=>this.tone(when,frequency(m),1.3,.08,'triangle',{echo:true,pan:(i-1.5)*.3}));this.tone(when,frequency(36),1.25,.3);}return;}
  if(SCENES.some(s=>s.at>0&&Math.abs(t-(s.at-.25))<.001)){
   this.tone(when,250,.23,.045,'sawtooth',{endHz:1600,cutoff:2400,pan:-.2,attack:.13});
  }
  const full=t>=1;
  if(beat%4===0&&(!breakdown||beat===0||beat===8)){
   this.tone(when,155,.27,.78,'sine',{endHz:43});this.hiss(when,.018,.09,6500);
  }
  if(full&&(beat===4||beat===12)&&(!breakdown||beat===12)){
   this.hiss(when,.15,.24,1200,-.08);this.tone(when,185,.105,.13,'triangle',{endHz:95});
   for(let j=1;j<=2;j++)this.hiss(when+j*.012,.055,.07,1900,.12);
  }
  const swing=step%2?.014:0;
  if(full&&(!breakdown||beat%4===2)){
   this.hiss(when+swing,beat%4===2?.12:.027,beat%4===2?.105:.045,6500,step%2?.35:-.3);
   if(bar>=6&&beat===15)this.hiss(when+.060,.025,.04,7500,.4);
  }
  const root=[36,36,32,34,36,32,36,39,34,36][bar%10];
  if([0,3,6,8,10,14].includes(beat)&&!breakdown){const octave=beat===6||beat===14?12:0;
   this.tone(when+swing,frequency(root+octave),beat===0?.20:.13,.24,'sawtooth',{cutoff:beat===0?450:850,pan:0});
   this.tone(when+swing,frequency(root),.16,.15,'sine');
  }
  if(full&&(beat===2||beat===10||breakdown&&beat===6)){
   [12,19,22,26].forEach((interval,i)=>this.tone(when+swing,frequency(root+interval),.22,.055,'triangle',{cutoff:2600,pan:(i-1.5)*.32,echo:true}));
  }
  const motif=[72,null,79,76,null,74,67,71];const midi=motif[Math.floor(beat/2)];
  if(beat%2===0&&midi!==null&&bar>=2){this.tone(when,frequency(midi+(bar%3===1?-5:0)),.14,.083,'triangle',{echo:true,pan:Math.sin(step)*.4});this.tone(when,frequency(midi+12),.08,.025,'sine',{pan:-.2});}
  if(bar>=3&&beat===15&&!breakdown){this.hiss(when,.055,.08,2300);this.hiss(when+.065,.03,.06,3400);}
 }
 tick(t){
  if(!this.context||this.context.state!=='running'||!this.enabled)return;
  const now=this.context.currentTime;
  if(this.nextStep===null||Math.abs(now-(this.offset+t))>.15){
   this.offset=now-t;this.nextStep=Math.ceil((t-.001)/STEP);this.nextScene=SCENES.findIndex(s=>s.at>=t-.015);if(this.nextScene<0)this.nextScene=SCENES.length;
  }
  const horizon=Math.min(LENGTH,t+.12);
  while(this.nextStep*STEP<horizon){const when=this.offset+this.nextStep*STEP;if(when>=now-.02)this.scheduleStep(this.nextStep,Math.max(now,when));this.nextStep++;}
  while(this.nextScene<SCENES.length&&SCENES[this.nextScene].at<horizon){const when=this.offset+SCENES[this.nextScene].at;if(when>=now-.02)this.accent(this.nextScene,Math.max(now,when));this.nextScene++;}
 }
}
