import {LENGTH,SCENES,POSTER,storyTime,clamp,mix,progress,sceneAt,add,sub,mul,dot,norm,cross,cameraAt,signalAt,foldAt,screenPoint,cardPoint,galleryPoint,ribbonPoint,orbitPoint} from './signal-journey.js';
export {LENGTH,SCENES,POSTER,clamp,sceneAt};
const PI=Math.PI,TAU=PI*2;
const C={paper:'#f3fbf7',blue:'#2922eb',cyan:'#17c5e0',mint:'#00e7b6',yellow:'#ffe456',white:'#ffffff',ink:'#161281',pale:'#b8eef1'};
const palette=[C.cyan,C.blue,C.mint,C.yellow];
const colorMix=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(mix(parseInt(a.slice(i,i+2),16),parseInt(b.slice(i,i+2),16),t)).toString(16).padStart(2,'0')).join('');
const faceZ=(x,y,z,w,h)=>[[x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z]];
export class SignalFilm{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.time=0;this.items=[];this.observer=new ResizeObserver(()=>{this.resize();this.draw(this.time);});this.observer.observe(canvas.parentElement);this.resize();}
 resize(){const r=this.canvas.parentElement.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.4);this.canvas.width=Math.max(1,Math.round(r.width*d));this.canvas.height=Math.max(1,Math.round(r.height*d));this.W=this.canvas.width/this.canvas.height*900;this.H=900;this.focal=Math.min(this.W*.9,940);}
 view(p){const d=sub(p,this.camera.eye);return[dot(d,this.camera.right),dot(d,this.camera.down),dot(d,this.camera.forward)];}
 project(p){return[this.W/2+p[0]*this.focal/p[2],450+p[1]*this.focal/p[2]];}
 clip(v){const out=[];let a=v.at(-1);for(const b of v){if((a[2]>=24)!==(b[2]>=24)){const u=(24-a[2])/(b[2]-a[2]);out.push(a.map((x,i)=>mix(x,b[i],u)));}if(b[2]>=24)out.push(b);a=b;}return out;}
 mesh(points,fill,stroke=null,width=1,alpha=1){
  if(alpha<.002)return;const v=points.map(p=>this.view(p));if(v.every(p=>p[2]<24)||v.every(p=>p[2]>3400))return;
  const clipped=this.clip(v);if(clipped.length<3)return;const pts=clipped.map(p=>this.project(p));
  if(pts.every(p=>p[0]<-20)||pts.every(p=>p[0]>this.W+20)||pts.every(p=>p[1]<-20)||pts.every(p=>p[1]>920))return;
  this.items.push({pts,fill,stroke,width,alpha,closed:true,layer:this.layer||0,depth:v.reduce((s,p)=>s+p[2],0)/v.length});
 }
 line(points,stroke,width=1,alpha=1){
  if(alpha<.002)return;const v=points.map(p=>this.view(p));let section=[];
  const flush=()=>{if(section.length>1)this.items.push({pts:section.map(p=>this.project(p)),stroke,width,alpha,closed:false,layer:this.layer||0,depth:section.reduce((s,p)=>s+p[2],0)/section.length});section=[];};
  for(let i=0;i<v.length;i++){const b=v[i],a=v[i-1];if(a&&(a[2]>=24)!==(b[2]>=24)){const u=(24-a[2])/(b[2]-a[2]);section.push(a.map((x,k)=>mix(x,b[k],u)));if(b[2]<24)flush();}if(b[2]>=24)section.push(b);}flush();
 }
 box(x,y,z,w,h,d,color,alpha=1){
  if(w*h*d<.1)return;const p=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,e])=>[x+a*w/2,y+b*h/2,z+e*d/2]);
  for(const [ids,fill]of[[[0,1,2,3],color],[[4,7,6,5],C.blue],[[0,4,5,1],C.pale],[[3,2,6,7],C.ink],[[1,5,6,2],C.blue],[[0,3,7,4],C.cyan]])this.mesh(ids.map(i=>p[i]),fill,null,1,alpha);
 }
 disc(center,right,down,r,fill,alpha=1){this.mesh(Array.from({length:64},(_,i)=>add(center,add(mul(right,Math.cos(i/64*TAU)*r),mul(down,Math.sin(i/64*TAU)*r)))),fill,null,1,alpha);}
 ring(center,right,down,r,w,color,alpha=1){for(let i=0;i<64;i++){const a=i/64*TAU,b=(i+1)/64*TAU;const p=(d,k)=>add(center,add(mul(right,Math.cos(k)*d),mul(down,Math.sin(k)*d)));this.mesh([p(r,a),p(r,b),p(r-w,b),p(r-w,a)],color,null,1,alpha);}}
 rotor(t,center,r,appear,phase){
  const unfold=progress(t,.38,1.65),turn=t*1.35+phase,thickness=22*unfold;
  const point=(rr,a,z=0)=>add(center,[Math.cos(a)*rr,Math.sin(a)*rr,z]);
  for(let i=0;i<8;i++){
   const a=i/8*TAU+turn,end=a+mix(.05,.58,unfold),inner=r*mix(.05,.37,unfold),outer=r*unfold;
   for(let j=0;j<9;j++){const aa=mix(a,end,j/9),bb=mix(a,end,(j+1)/9);this.mesh([point(inner,aa),point(outer,aa),point(outer,bb),point(inner,bb)],palette[i%4],null,1,appear);this.mesh([point(outer,aa),point(outer,aa,thickness),point(outer,bb,thickness),point(outer,bb)],C.blue,null,1,appear);}
  }
  const solid=progress(t,1.25,2.05);this.ring(add(center,[0,0,thickness]),[1,0,0],[0,1,0],r*unfold,r*.09,C.blue,appear*solid);
  this.ring(center,[1,0,0],[0,1,0],r*unfold,r*.065,C.cyan,appear*solid);
  this.ring(add(center,[0,0,-2]),[1,0,0],[0,1,0],r*.92*unfold,2,C.white,appear);
  this.disc(add(center,[0,0,-4]),[1,0,0],[0,1,0],r*.18,C.yellow,appear*unfold);
  this.disc(add(center,[0,0,-5]),[1,0,0],[0,1,0],r*.055,C.blue,appear*unfold);
 }
 machine(t){
  this.rotor(t,[-420,-180,30],220,1,0);
  const second=progress(t,1.9,2.7),assemble=progress(t,1.85,3.1);
  this.rotor(t,[-115,-140,95],125*second,second,.5);
  // The first wheel never gets replaced: the casing assembles under its axle.
  const lift=(1-assemble)*180;
  this.box(-300,90+lift,115,410*assemble,220*assemble,170,C.blue,assemble);
  this.box(-300,235+lift,130,550*assemble,25*assemble,230,C.blue,assemble);
  for(const x of[-480,-100])this.box(x,192+lift,125,22,94*assemble,38,C.blue,assemble);
  this.mesh(faceZ(-320,85+lift,27,260*assemble,125*assemble),C.white,null,1,assemble);
  for(let i=0;i<9;i++)this.box(-425+i*25,85+lift,23,9,84*assemble,5,C.cyan,assemble);
  this.line([[-420,-180,65],[-510,-35+lift,135],[-390,25+lift,135]],C.blue,9,assemble);
  this.line([[-115,-140,125],[-80,-45+lift,125],[-210,0+lift,125]],C.blue,7,assemble);
  this.line([[-420,-180,18],[-310,-280,30],[-115,-140,82]],C.blue,3,assemble);
  this.disc([-155,45+lift,23],[1,0,0],[0,1,0],17,C.yellow,assemble);
  const lens=progress(t,2.5,3.3);
  this.box(-70,60,115,95*lens,110*lens,120,C.blue,lens);
  this.ring([-18,60,115],[0,0,1],[0,1,0],65*lens,22,C.yellow,lens);
  this.disc([-20,60,115],[0,0,1],[0,1,0],40*lens,C.ink,lens);
 }
 beam(t){
  const light=progress(t,3.12,3.65),screen=progress(t,3.35,4.25);if(light<.001)return;
  const origin=[-12,60,115],endx=mix(0,700,light),w=310*screen,h=230*screen;
  const corners=[[endx,-h,160-w],[endx,-h,160+w],[endx,h,160+w],[endx,h,160-w]];
  for(let i=0;i<4;i++)this.mesh([origin,corners[i],corners[(i+1)%4]],i%2?C.cyan:C.mint,null,1,.055*light);
  for(let i=0;i<=14;i++){const z=160-w+i/14*w*2;this.line([origin,[endx,-h,z]],C.mint,1,.35*light);this.line([origin,[endx,h,z]],C.cyan,.75,.25*light);}
 }
 screen(t){
  const appear=progress(t,3.35,4.1),fold=foldAt(t);if(appear<.001)return;
  for(const side of[-1,1]){
   const p=(u,v)=>screenPoint(t,side,u,v);
   // Every colored cell and line stays attached as the screen hinges into the room.
   for(let i=0;i<4;i++)for(let j=0;j<4;j++){
    const u0=i/4,u1=(i+1)/4,v0=-1+j*.5,v1=v0+.5;
    this.mesh([p(u0,v0),p(u1,v0),p(u1,v1),p(u0,v1)],(i+j)%3===0?C.yellow:(side<0?C.cyan:C.pale),C.white,3,appear);
    const offset=side*.9;
    const q=(u,v)=>add(p(u,v),[-offset*.15,0,-offset*fold]);
    this.line([q(u0+.04,v0+.13),q(u1-.04,v0+.13)],C.white,1.4,appear);
    this.line([q(u0+.04,v0+.25),q(u1-.07,v0+.25)],C.white,.8,appear);
    this.disc(q(u0+.045,v0+.38),norm(sub(p(u0+.1,v0),p(u0,v0))),[0,1,0],4,C.blue,appear);
   }
   this.line([p(0,-1),p(1,-1),p(1,1),p(0,1),p(0,-1)],C.blue,5,appear);
   const hinge=p(0,1);this.disc(hinge,[0,0,1],[0,1,0],10,C.mint,appear);
  }
  // The screen’s lower edge extends into the floor with its printed rays.
  const extent=mix(8,1080,fold),left=-150,right=470;
  const bottom=(x,z)=>[700+x,230-Math.sin(fold*PI/2)*12,z];
  for(let i=0;i<18;i++){const a=extent*i/18,b=extent*(i+1)/18;this.mesh([bottom(a,left),bottom(a,right),bottom(b,right),bottom(b,left)],i%4===0?C.blue:C.cyan,null,1,appear);}
  for(let j=0;j<=12;j++){const z=mix(left,right,j/12);this.line([bottom(0,z),bottom(extent,z)],j%3===0?C.yellow:C.white,1.1,appear);}
  // Top edge becomes a canopy. Tiles swing out from it while the camera moves inside.
  for(let i=0;i<8;i++){
   const unfold=progress(t,4.8+i*.1,5.75+i*.1),x=700+i*133;
   for(const side of[-1,1]){const z=160+side*mix(305,120,unfold),y=-230-Math.sin(unfold*PI)*95;
    this.mesh([[x,-230,160+side*310],[x+115,-230,160+side*310],[x+115,y,z],[x,y,z]],i%2?C.white:C.blue,null,1,appear*fold);}
  }
 }
 innerWorld(t){
  const grow=progress(t,4.3,5.5);if(grow<.001)return;
  // One room-scale mechanism is already visible behind the unfolding screen.
  const center=[1510,0,160],right=[0,0,1],down=[0,1,0],open=progress(t,5.4,7.4);
  this.ring(center,right,down,190,12,C.cyan,grow);
  this.ring([1515,0,160],right,down,215,4,C.yellow,grow);
  for(let j=0;j<4;j++){
   const pts=[];for(let i=0;i<=70;i++){const a=i/70*TAU;pts.push([1520+Math.sin(a+t)*j*9,Math.sin(a)*(130+j*12),160+Math.cos(a)*(130+j*12)]);}this.line(pts,j%2?C.white:C.cyan,1,grow);
  }
  // Attached cards share one persistent parametrization with the gallery and ribbon.
  this.gallery(t,grow);
  // The room's back wall hinges down into the gallery platform.
  const fold=progress(t,8,9.55)*PI/2;
  const back=(u,v)=>[1790+(310-v)*Math.sin(fold),310+(v-310)*Math.cos(fold),160+u*420];
  for(let j=0;j<6;j++)for(let i=0;i<4;i++){
   const u0=-1+i*.5,u1=u0+.5,v0=-350+j*110,v1=v0+110;
   this.mesh([back(u0,v0),back(u1,v0),back(u1,v1),back(u0,v1)],(i+j)%5?C.pale:C.white,C.white,.7,grow);
  }
  for(let i=0;i<20;i++){const a=i/20*TAU;this.line([back(Math.cos(a)*.2,Math.sin(a)*80),back(Math.cos(a),Math.sin(a)*310)],C.white,1,grow);}
  // Floor arcs and attached panels extend the projected artwork into depth.
  for(let i=0;i<12;i++){const z=-130+i*52,pts=[];for(let j=0;j<=30;j++){const x=1000+j*45;pts.push([x,218+Math.sin(j*.1+t)*3,z+Math.sin(j*.11)*30]);}this.line(pts,i%3===0?C.yellow:C.white,1,grow);}
  for(let side of[-1,1])for(let i=0;i<4;i++){
   const x=1410+i*180,z=160+side*280,y=Math.sin(i+t)*40;
   this.mesh([[x,-165+y,z],[x+130,-165+y,z],[x+130,105+y,z],[x,105+y,z]],i%2?C.blue:C.yellow,C.white,2,grow);
   for(let k=0;k<6;k++)this.line([[x+15,-140+y+k*38,z-side*2],[x+115,-140+y+k*38,z-side*2]],C.white,1,grow);
  }
 }
 gallery(t,alpha){
  const spread=progress(t,7.9,9.8),bend=progress(t,10,11.65);
  for(let i=0;i<6;i++){
   const p=(u,v)=>cardPoint(t,i,u,v),rows=i===0?80:1;
   for(let row=0;row<rows;row++){
    const v=-1+row/rows*2,next=-1+(row+1)/rows*2;
    this.mesh([p(-1,v),p(1,v),p(1,next),p(-1,next)],i===0?(row%12<3?C.cyan:C.blue):(i%2?C.yellow:C.blue),null,1,alpha);
   }
   for(const edge of[-1,1]){
    const pts=[];for(let j=0;j<=80;j++)pts.push(p(edge,-1+j/40));this.line(pts,C.white,1.6,alpha);
   }
   // Perforations are already visible on the card and stay on the unfolding band.
   const holes=i===0?38:10;
   for(let j=0;j<holes;j++)for(const edge of[-1,1]){
    const v=-.94+j/(holes-1)*1.88,dv=i===0?.014:.035;
    this.mesh([p(edge*.82-.04,v-dv),p(edge*.82+.04,v-dv),p(edge*.82+.04,v+dv),p(edge*.82-.04,v+dv)],C.white,null,1,alpha);
   }
   const points=[];for(let j=0;j<=100;j++){const v=-.92+j/100*1.84;points.push(p(Math.sin(v*9+t*.5)*.28,v));}this.line(points,i%2?C.blue:C.yellow,2,alpha);
   if(i!==0){
    if(i===1){
     for(let r=0;r<7;r++){const pts=[];for(let j=0;j<=48;j++){const a=j/48*TAU;pts.push(p(Math.cos(a)*(.1+r*.09),Math.sin(a)*(.1+r*.11)));}this.line(pts,C.blue,2,alpha);}
    }else if(i===2){
     for(let x=0;x<6;x++)for(let y=0;y<6;y++)if((x+y)%2===0){const u=-.7+x*.23,v=-.7+y*.23;this.mesh([p(u,v),p(u+.23,v),p(u+.23,v+.23),p(u,v+.23)],C.white,null,1,alpha);}
    }else if(i===3){
     for(let j=0;j<18;j++){const a=j/18*TAU;this.mesh([p(0,0),p(Math.cos(a)*.7,Math.sin(a)*.8),p(Math.cos(a+.1)*.7,Math.sin(a+.1)*.8)],C.blue,null,1,alpha);}
    }else if(i===4){
     for(let j=0;j<4;j++){const a=j/4*TAU+t*.2,pts=[p(0,0)];for(let k=0;k<=18;k++){const b=k/18*Math.PI;pts.push(p(Math.cos(a)*Math.sin(b)*.65+Math.sin(a)*Math.cos(b)*.2,Math.sin(a)*Math.sin(b)*.7-Math.cos(a)*Math.cos(b)*.2));}this.mesh(pts,C.mint,null,1,alpha);}
    }else{
     for(let j=0;j<5;j++){const r=.15+j*.14;this.line([p(-r,-r),p(r,-r),p(r,r),p(-r,r),p(-r,-r)],C.blue,3,alpha);}
    }
   }else{
    // A printed spoke becomes a lifted little rotor beside the ribbon.
    const lift=progress(t,11.7,13.3),hub=ribbonPoint(.44,0);
    for(let k=0;k<8;k++){
     const a=k/8*TAU+t*.8;
     const uv=[[Math.cos(a)*.08,Math.sin(a)*mix(.06,.016,bend)-.12],[Math.cos(a)*.48,Math.sin(a)*mix(.28,.07,bend)-.12],[Math.cos(a+.45)*.48,Math.sin(a+.45)*mix(.28,.07,bend)-.12],[Math.cos(a+.45)*.08,Math.sin(a+.45)*mix(.06,.016,bend)-.12]];
     const shape=uv.map(([u,v])=>p(u,v).map((n,j)=>n-(j===1?lift*110:0)));
     this.mesh(shape,k%2?C.mint:C.white,null,1,alpha);
    }
    if(lift>0)this.line([hub,[hub[0],hub[1]-110*lift,hub[2]]],C.yellow,3,alpha);
   }
   if(spread<1){const a=i/6*TAU+Math.min(t,8)*.23;this.line([[1510,Math.sin(a)*190,160+Math.cos(a)*190],galleryPoint(t,i,0,0)],C.blue,1,alpha*(1-spread));}
  }
  // A drawn connector grows between the actual gallery cards, never a screen-space wipe.
  if(spread>0){for(let i=1;i<6;i++)this.line([galleryPoint(t,i,0,0),galleryPoint(t,0,0,0)],C.cyan,1,alpha*spread*(1-bend));}
 }
 launchDetails(t){
  const open=progress(t,.45,1.3),assemble=progress(t,1.8,3.1),depart=progress(t,3.2,4.5);
  for(let i=0;i<18;i++){
   const a=i/18*TAU+t*.65,r=260+Math.sin(i*2)*22;
   const source=[-420+Math.cos(a)*r,-180+Math.sin(a)*r,30+Math.sin(a*2)*45];
   const end=[650,-210+i%6*80,-125+Math.floor(i/6)*260],p=source.map((n,k)=>mix(n,end[k],depart));
   const size=mix(3,12,assemble)*(1-depart*.5),alpha=open*(1-progress(t,4.1,4.8));
   this.box(...p,size,size,size,palette[i%4],alpha);
   this.line([p,add(p,[Math.cos(a)*16,Math.sin(a)*16,0])],C.blue,1,alpha);
  }
  // A travelling film strip wraps the two reels before feeding the projector.
  const alpha=progress(t,2,2.5)*(1-progress(t,3.7,4.5));
  for(let j=0;j<28;j++){
   const x=-480+j*18,y=-340+Math.sin(j*.22-t*3)*22,z=80;
   this.mesh([[x,y,z],[x+14,y+2,z],[x+14,y+22,z],[x,y+20,z]],j%3?C.blue:C.yellow,null,1,alpha);
  }
 }
 kineticRibbon(t){
  const appear=progress(t,10.7,11.5);if(appear<.002)return;
  // The perforated band grows side flaps; each flap keeps its hinge on the band.
  for(let i=0;i<17;i++){
   const u=.1+i*.045,center=ribbonPoint(u),tangent=norm(sub(ribbonPoint(u+.003),ribbonPoint(u-.003))),right=norm(cross(tangent,[0,1,0]));
   for(const side of[-1,1]){
    const base=ribbonPoint(u,side),lift=progress(t,11.3+u*2,12.4+u*2),wave=.7+.3*Math.sin(i*.6-t*2.4),a=lift*(.5+wave*.9),length=200+180*Math.sin(u*Math.PI);
    const point=(along,out)=>add(base,add(mul(tangent,along),add(mul(right,side*out*length*Math.cos(a)),[0,-out*length*Math.sin(a),0])));
    this.mesh([point(-34,0),point(34,0),point(34,1),point(-34,1)],palette[(i+(side>0?2:0))%4],null,1,appear);
    this.line([point(-25,.05),point(-25,.94),point(25,.94)],C.white,1.4,appear);
    const tip=point(0,1);this.disc(tip,this.camera.right,this.camera.down,5,C.yellow,appear);
   }
  }
  // One broad helical aperture grows from the strip, with a clear central passage.
  const grow=progress(t,11.8,13.4),hub=[3790,-110,510];
  for(let i=0;i<44;i++){
   const a=i/44*TAU*1.55+t*.1,aa=a+.065,rr=440*grow;
   const q=(angle,rad)=>[hub[0]+(i/44-.5)*660,hub[1]+Math.sin(angle)*rad,hub[2]+Math.cos(angle)*rad];
   this.mesh([q(a,rr),q(aa,rr),q(aa,rr+36*grow),q(a,rr+36*grow)],i%3===0?C.yellow:C.cyan,null,1,appear*grow);
   if(i%4===0)this.line([q(a,rr),q(a,rr+72*grow)],C.white,2,appear*grow);
  }
  // Fragments from the edge travel toward the garden, indicating the next destination.
  for(let i=0;i<24;i++){
   const u=((t*.16+i/24)%1),p=ribbonPoint(u,Math.sin(i)*2.3);
   p[1]-=80+Math.sin(i*2+t)*70;
   this.disc(p,this.camera.right,this.camera.down,3+i%3,C.mint,appear*.75);
  }
 }
 constellation(t){
  const grow=progress(t,20.2,23.8);if(grow<.002)return;
  // Tiles peel away from the existing outer orbit into a rotating spatial constellation.
  const pts=[];
  for(let i=0;i<54;i++){
   const a=i/54*TAU,origin=orbitPoint(t,2,a),latitude=Math.acos(1-2*(i+.5)/54),longitude=i*2.39996+t*.32;
   const r=560+80*Math.sin(t*.65+i),dest=[5400+Math.sin(latitude)*Math.cos(longitude)*r,Math.cos(latitude)*r,160+Math.sin(latitude)*Math.sin(longitude)*r];
   const p=origin.map((n,k)=>mix(n,dest[k],grow));pts.push(p);
   const right=norm([Math.cos(longitude),.4*Math.sin(t+i),Math.sin(longitude)]),down=norm(cross(right,[0,0,1]));
   const size=mix(2,18+i%4*5,grow);
   this.mesh([add(p,mul(right,-size)),add(p,mul(down,size)),add(p,mul(right,size)),add(p,mul(down,-size))],palette[i%4],C.white,.7,grow);
  }
  for(let i=0;i<pts.length;i++){if(i%3!==0)this.line([pts[i],pts[(i+3)%pts.length]],C.cyan,.8,grow*.32);}
 }
 orbitalGarden(t){
  const appear=progress(t,11.6,13.1);if(appear<.002)return;
  const center=[5400,366,160],ground={right:[1,0,0],down:[0,0,1]},rise=progress(t,16.7,18.9);
  // This blue plane is visible below the approaching ribbon well before landing.
  this.layer=-2;
  for(let i=0;i<72;i++){const a=i/72*TAU,b=(i+1)/72*TAU;this.mesh([center,[5400+Math.cos(a)*850,366,160+Math.sin(a)*850],[5400+Math.cos(b)*850,366,160+Math.sin(b)*850]],C.blue,null,1,appear);}
  this.layer=-1;
  for(let k=0;k<13;k++)this.ring([5400,364,160],ground.right,ground.down,90+k*55,1.3,k%3===0?C.cyan:C.white,appear*.8);
  this.layer=0;
  for(let ring=0;ring<3;ring++){
   const pts=[];for(let j=0;j<=110;j++)pts.push(orbitPoint(t,ring,j/110*TAU));this.line(pts,ring===1?C.yellow:C.cyan,ring===1?5:4,appear);
   // Small radial ribs make the printed orbit read as a physical band when it lifts.
   for(let j=0;j<56;j++){
    const a=j/56*TAU,p=orbitPoint(t,ring,a),hub=[5400,350-rise*230,160];
    this.line([p,add(p,mul(sub(hub,p),.018))],ring===1?C.yellow:C.cyan,2,appear);
   }
   for(let i=0;i<8;i++){
    const a=i/8*TAU+t*(.14+ring*.04),p=orbitPoint(t,ring,a),radius=mix(4,10,rise);
    this.disc(p,this.camera.right,this.camera.down,radius,i%3?C.white:C.yellow,appear);
    if(i%2===0){
     const q=(dy,dz)=>[p[0]+dy*Math.sin(a),p[1]-dy*Math.cos(a)*rise,p[2]+dz];
     this.mesh([q(-35,-15),q(35,-15),q(35,15),q(-35,15)],i%4===0?C.yellow:C.white,C.blue,1,appear);
     this.line([q(-20,0),q(20,0)],C.cyan,2,appear);
    }
   }
  }
  // The garden's printed rosette hinges upright with its surrounding orbits.
  const crystallize=progress(t,20.6,23.4),centerY=350-rise*230-progress(t,20,23)*120,tilt=rise*Math.PI/2;
  const petal=(r,a,k)=>{
   const source=[5400+Math.cos(a)*r,centerY-Math.sin(a)*r*Math.sin(tilt),160+Math.sin(a)*r*Math.cos(tilt)];
   const twist=a+(t-20)*.5,rr=clamp((r-46)/134)*290,target=[5400+Math.cos(twist)*rr,centerY+(1-rr/290)*(k%2?-260:260),160+Math.sin(twist)*rr];
   return source.map((n,k)=>mix(n,target[k],crystallize));
  };
  for(let k=0;k<8;k++){
   const a=k/8*TAU+t*.28,span=mix(mix(.4,.61,rise),Math.PI/4,crystallize),outer=mix(95,180,rise);
   for(let j=0;j<8;j++){
    const a0=a+span*j/8,a1=a+span*(j+1)/8;
    this.mesh([petal(46,a0,k),petal(outer,a0,k),petal(outer,a1,k),petal(46,a1,k)],palette[k%4],null,1,appear);
    if(crystallize>0){
     const apex=petal(46,a0,k),back=[apex[0],mix(apex[1],centerY*2-apex[1],crystallize),apex[2]];
     this.mesh([back,petal(outer,a0,k),petal(outer,a1,k)],palette[(k+1)%4],null,1,appear*crystallize);
    }

   }
   this.line([petal(52,a+.08,k),petal(outer-12,a+.08,k)],C.white,1.5,appear);
   if(crystallize>0)this.line([petal(46,a,k),petal(outer,a,k),petal(46,a,k).map((n,i)=>i===1?centerY*2-n:n)],C.white,1.2,appear*crystallize);
  }
  this.disc([5400,centerY-2,158],[1,0,0],[0,-Math.sin(tilt),Math.cos(tilt)],34,C.white,appear);
  // The band's far end joins the printed rings through a small articulated landing strip.
  const tail=ribbonPoint(1),join=[5400,350,160];
  for(let j=0;j<15;j++){const a=j/15,b=(j+1)/15;const point=(u,side)=>[mix(tail[0],join[0],u),mix(tail[1],join[1],u),mix(tail[2],join[2],u)+side*mix(160,35,u)];this.mesh([point(a,-1),point(a,1),point(b,1),point(b,-1)],j%4?C.cyan:C.yellow,C.white,.7,appear);}
 }
 signal(t){
  const p=signalAt(t),r=mix(mix(8,18,progress(t,.25,1.4)),32,progress(t,17.6,19.5)),star=progress(t,.3,.8),right=this.camera.right,down=this.camera.down;
  const verts=[];for(let i=0;i<8;i++){const a=i/8*TAU+t*.5,d=r*(i%2?mix(1,.28,star):1);verts.push(add(p,add(mul(right,Math.cos(a)*d),mul(down,Math.sin(a)*d))));}this.mesh(verts,C.mint,C.blue,1.1);
  if(t>2.5){const trail=[];for(let i=0;i<24;i++)trail.push(signalAt(Math.max(2.5,t-i*.017)));this.line(trail,C.yellow,2.6,.9);}
  const ripple=progress(t,.1,.55)*(1-progress(t,1,1.55));for(let i=0;i<3;i++)this.ring([-420,-150,40],[1,0,0],[0,.15,1],35+i*35+t*35,1.5,C.blue,ripple*.65);
 }
 background(t){
  const c=this.ctx,night=progress(t,10.4,12.5),violet=progress(t,19.7,22),warm=progress(t,7.5,9.6)*(1-night);
  C.cyan=colorMix('#17c5e0','#52eeec',night);C.mint=colorMix('#00e7b6','#ff69b9',progress(t,11,14));
  C.yellow=colorMix('#ffe456','#ffaf61',violet);palette.splice(0,4,C.cyan,C.blue,C.mint,C.yellow);
  const top=colorMix(colorMix('#ffffff','#ffe8f1',warm),colorMix('#090d34','#260c41',violet),night),bottom=colorMix('#b8eef1',colorMix('#181a70','#6a2459',violet),night);
  const g=c.createLinearGradient(0,0,this.W,900);g.addColorStop(0,top);g.addColorStop(1,bottom);c.fillStyle=g;c.fillRect(0,0,this.W,900);
  const reveal=progress(t,2,3.5);
  for(let i=0;i<15;i++){const z=-450+i*100;this.line([[-900,265,z],[6400,265,z]],night>.5?C.cyan:C.blue,.65,mix(.065,.14,night)*reveal);}
  for(let i=0;i<49;i++){const x=-900+i*150;this.line([[x,265,-450],[x,265,950]],night>.5?C.cyan:C.blue,.65,mix(.065,.14,night)*reveal);}
  // Distant points respond only to the continuous camera drift; the set remains in one world.
  for(let i=0;i<85;i++){
   const x=((i*173.71-t*9)%this.W+this.W)%this.W,y=(i*91.37)%780;
   c.globalAlpha=night*(.15+.3*(.5+.5*Math.sin(i+t*.6)));c.fillStyle=i%5?C.white:C.mint;
   c.fillRect(x,y,i%9===0?3:1.5,i%9===0?3:1.5);
  }c.globalAlpha=1;
 }
 paint(){
  const c=this.ctx;this.items.sort((a,b)=>a.layer-b.layer||b.depth-a.depth);
  for(const o of this.items){c.globalAlpha=o.alpha;c.beginPath();o.pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(o.closed)c.closePath();if(o.fill){c.fillStyle=o.fill;c.fill();}if(o.stroke){c.strokeStyle=o.stroke;c.lineWidth=o.width;c.stroke();}}c.globalAlpha=1;
 }
 draw(time){
  this.time=clamp(time,0,LENGTH);const t=storyTime(this.time),c=this.ctx;c.setTransform(this.canvas.height/900,0,0,this.canvas.height/900,0,0);c.globalAlpha=1;c.lineJoin='round';c.lineCap='round';this.camera=cameraAt(t);this.items=[];
  this.background(t);this.machine(t);this.launchDetails(t);this.beam(t);this.screen(t);this.innerWorld(t);this.kineticRibbon(t);this.orbitalGarden(t);this.constellation(t);this.signal(t);this.paint();
  c.font='11px monospace';c.fillStyle=t>12?C.white:C.blue;c.globalAlpha=.5;c.textAlign='left';c.fillText('ONE LITTLE SIGNAL / 010',this.W*.045,865);c.textAlign='right';c.fillText('A CONTINUOUS MOTION STUDY',this.W*.955,865);c.globalAlpha=1;
  const ending=progress(t,24.8,25.8);if(ending>0){c.globalAlpha=ending;c.textAlign='center';c.fillStyle=C.white;c.font=`600 ${Math.min(this.W*.031,32)}px Arial`;c.strokeStyle=C.blue;c.lineWidth=5;c.strokeText('STAY CURIOUS. KEEP MOVING.',this.W/2,740);c.fillText('STAY CURIOUS. KEEP MOVING.',this.W/2,740);c.globalAlpha=1;}
  this.canvas.dataset.camera=this.camera.eye.map(n=>n.toFixed(2)).join(',');
 }
 dispose(){this.observer.disconnect();}
}
