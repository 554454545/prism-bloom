import './study.css';
import {SignalFilm,LENGTH,POSTER,sceneAt,clamp} from './signal-film.js';
import {SignalScore} from './signal-sound.js';
const $=s=>document.querySelector(s);
document.querySelector('#app').innerHTML=`
<header><a href="/">bunnyjudy<span>✳</span></a><span class="edition">EXPERIMENTS IN MOTION / 010</span><span class="header-tag"><i></i> 20 SEC JOURNEY</span></header>
<main><section class="intro"><div><span class="eyebrow">A LITTLE SIGNAL. A LOT OF POSSIBILITIES.</span><h1>Prism <em>bloom.</em><span>↗</span></h1></div><p>棱镜绽放。<br><span>跟着一束光，穿过想象的形状</span></p></section>
<section class="player"><div class="stage" id="stage" tabindex="0" aria-label="二十秒连续变化短片，空格播放暂停"><canvas id="study" role="img" aria-label="一颗光点展开为轮盘，组装进放映装置，投影面板折成空间，卡片延展成长带，镜头沿带进入轨道花园，再折成晶体、散开成星群"></canvas><div class="stage-top"><span>ONE LITTLE SIGNAL</span><span>KINETIC REMIX / 20″</span></div><button id="start"><span class="play-symbol">▶</span><span id="start-label">让信号出发</span><small>PLAY THE EXPERIMENT</small></button><div id="end" hidden><button id="replay">再玩一次 <span>↻</span></button></div></div>
<div class="controls"><button id="play" aria-label="播放">▶</button><span class="time"><b id="elapsed">00:00</b> / 00:20</span><label class="sr-only" for="seek">播放进度</label><input id="seek" type="range" min="0" max="20" value="0" step="0.01"><button id="sound" aria-pressed="true">声音 开</button><button id="fullscreen" aria-label="进入全屏"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/></svg></button></div></section>
<footer><span>光点 → 轮盘 → 装置 → 图像 → 空间</span><span>STAY CURIOUS. KEEP MOVING.</span></footer><p id="status" role="status" class="sr-only"></p></main>`;
const film=new SignalFilm($('#study')),score=new SignalScore();
let time=0,playing=false,started=false,frame=0,last=0;
function render(){const visual=started?time:POSTER;film.draw(visual);$('#stage').dataset.time=time.toFixed(3);const scene=sceneAt(visual);$('#stage').dataset.scene=scene;
 $('#elapsed').textContent=`00:${Math.floor(time).toString().padStart(2,'0')}`;$('#seek').value=time;$('#seek').style.setProperty('--progress',`${time/LENGTH*100}%`);
}
function sync(){$('#start').hidden=started;$('#end').hidden=time<LENGTH||playing;$('#play').textContent=playing?'Ⅱ':'▶';$('#play').setAttribute('aria-label',playing?'暂停':'播放');$('#stage').classList.toggle('playing',playing);}
function pause(){playing=false;cancelAnimationFrame(frame);last=0;score.reset();sync();}
async function play(restart=false){if(restart||time>=LENGTH)time=0;started=true;playing=true;last=0;render();sync();cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);const ok=await score.start();if(!ok)$('#status').textContent='音频暂时无法开启，画面仍可播放。';if(!playing)score.reset();}
function tick(now){if(!playing)return;const dt=last?Math.min((now-last)/1000,.5):0;last=now;time=clamp(time+dt,0,LENGTH);render();score.tick(time);if(time>=LENGTH){pause();return;}frame=requestAnimationFrame(tick);}
function seek(t){time=clamp(t,0,LENGTH);started=true;last=0;score.reset();render();if(time>=LENGTH)pause();sync();}
$('#start').onclick=()=>play(true);$('#replay').onclick=()=>play(true);$('#play').onclick=()=>playing?pause():play();$('#seek').oninput=e=>seek(+e.target.value);
$('#sound').onclick=()=>{score.setEnabled(!score.enabled);$('#sound').textContent=score.enabled?'声音 开':'声音 关';$('#sound').setAttribute('aria-pressed',String(score.enabled));if(playing&&score.enabled)score.start();};
async function fullscreen(){const player=$('.player');if(player.classList.contains('expanded')){player.classList.remove('expanded');$('#fullscreen').setAttribute('aria-label','进入全屏');return;}try{if(document.fullscreenElement)await document.exitFullscreen();else await player.requestFullscreen();}catch{player.classList.toggle('expanded');$('#fullscreen').setAttribute('aria-label',player.classList.contains('expanded')?'退出全屏':'进入全屏');}}
$('#fullscreen').onclick=fullscreen;document.addEventListener('fullscreenchange',()=>$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'进入全屏'));
document.addEventListener('keydown',e=>{if(e.code==='Escape'){$('.player').classList.remove('expanded');$('#fullscreen').setAttribute('aria-label','进入全屏');}if(e.target.matches('input,button,a')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.code==='Space'){e.preventDefault();playing?pause():play();}if(e.code==='ArrowRight'){e.preventDefault();seek(time+1);}if(e.code==='ArrowLeft'){e.preventDefault();seek(time-1);}if(e.code==='KeyF')fullscreen();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();score.context?.suspend();}});window.addEventListener('pagehide',()=>{pause();score.context?.suspend();});
$('#stage').dataset.ready='true';render();sync();
