// Cue points describe overlapping actions within one world, not replacement scenes.
export const LENGTH=20;
export const storyTime=t=>t*1.3;
export const POSTER=2.75/1.3;
export const SCENES=[
 {at:0,name:'光点',sample:.45},{at:1.1,name:'展开',sample:1.5},
 {at:2.35,name:'组装',sample:2.8},{at:3.5,name:'投射',sample:4.2},
 {at:5.05,name:'折起',sample:5.5},{at:6.6,name:'进入',sample:7.3},
 {at:8.25,name:'展馆',sample:9.2},{at:10.25,name:'延展',sample:11.1},
 {at:12.4,name:'沿带',sample:13.4},{at:15.1,name:'落入',sample:16.1},
 {at:17.1,name:'生长',sample:18.2},{at:19,name:'回响',sample:19.6},
 {at:21.3,name:'裂变',sample:22.2},{at:23.7,name:'星群',sample:25},
].map(cue=>({...cue,at:cue.at/1.3,sample:Math.round(cue.sample/1.3*100)/100}));
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const progress=(t,a,b)=>smooth((t-a)/(b-a));
export const sceneAt=t=>Math.max(0,SCENES.findLastIndex(s=>t>=s.at));
export const add=(a,b)=>a.map((v,i)=>v+b[i]);
export const sub=(a,b)=>a.map((v,i)=>v-b[i]);
export const mul=(a,s)=>a.map(v=>v*s);
export const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const norm=a=>mul(a,1/(Math.hypot(...a)||1));
function spline(nodes,t){
 t=clamp(t,nodes[0][0],nodes.at(-1)[0]);let i=Math.min(nodes.length-2,nodes.findLastIndex(n=>n[0]<=t));
 const [ta,a]=nodes[i],[tb,b]=nodes[i+1],prev=nodes[Math.max(0,i-1)],next=nodes[Math.min(nodes.length-1,i+2)],u=(t-ta)/(tb-ta),u2=u*u,u3=u2*u;
 return a.map((v,k)=>{const m0=(b[k]-prev[1][k])/(tb-prev[0])*(tb-ta),m1=(next[1][k]-v)/(next[0]-ta)*(tb-ta);return (2*u3-3*u2+1)*v+(u3-2*u2+u)*m0+(-2*u3+3*u2)*b[k]+(u3-u2)*m1;});
}
const eyes=[
 [0,[-420,-180,-900]],[.8,[-420,-180,-820]],[1.5,[-420,-190,-760]],
 [2.35,[-560,-240,-1210]],[3.1,[-550,-220,-1280]],[3.7,[-380,-180,-1030]],
 [4.4,[80,-115,-770]],[5.15,[380,-60,-380]],[5.9,[760,-35,70]],
 [6.7,[965,-55,85]],[7.4,[1080,-35,140]],[8,[1140,-15,160]],
 [8.8,[1210,-110,20]],[9.7,[1590,-110,-30]],[10.5,[1910,-95,45]],
 [11.4,[2310,-140,145]],[12.3,[2790,-200,410]],[13.2,[3350,-300,700]],
 [14.2,[3900,-390,550]],[15.1,[4450,-650,180]],[16,[4880,-650,-370]],
 [17,[5270,-460,-570]],[18,[5440,-300,-660]],[19,[5480,-270,-960]],[20,[5570,-220,-940]],
 [21,[5950,-330,-740]],[22,[6260,-460,-160]],[23,[6030,-380,800]],
 [24,[5500,-270,1260]],[25,[4970,-250,1350]],[26,[4840,-250,1420]],
];
const targets=[
 [0,[-420,-180,40]],[1.5,[-420,-180,40]],[2.35,[-300,-55,80]],
 [3.1,[-110,-20,150]],[3.7,[200,-10,160]],[4.4,[700,0,160]],
 [5.15,[930,0,160]],[5.9,[1300,0,160]],[6.7,[1500,0,160]],
 [7.4,[1510,0,160]],[8,[1510,0,160]],
 [8.8,[1960,-20,160]],[9.7,[2250,0,160]],[10.5,[2460,100,210]],
 [11.4,[2800,150,430]],[12.3,[3210,140,550]],[13.2,[3820,145,460]],
 [14.2,[4400,160,160]],[15.1,[5000,260,0]],[16,[5380,300,160]],
 [17,[5400,240,160]],[18,[5400,150,160]],[19,[5400,120,160]],[20,[5400,100,160]],
 [21,[5400,60,160]],[23,[5400,0,160]],[26,[5400,0,160]],
];
export function cameraAt(t){
 const eye=spline(eyes,t),target=spline(targets,t),forward=norm(sub(target,eye));
 let right=norm(cross([0,1,0],forward)),down=norm(cross(forward,right));
 const roll=-.13*progress(t,1.5,2.8)+.24*progress(t,3.15,4.5)-.20*progress(t,5.2,6.7)+.20*progress(t,9.6,11.4)-.29*progress(t,12.5,14.4)+.18*progress(t,15.1,17.2)+.3*Math.sin(progress(t,20,25)*Math.PI*2);
 const r=add(mul(right,Math.cos(roll)),mul(down,Math.sin(roll)));down=add(mul(down,Math.cos(roll)),mul(right,-Math.sin(roll)));right=r;
 return {eye,target,forward,right,down};
}
const signalNodes=[
 [0,[-420,-180,15]],[2.5,[-420,-180,15]],[3,[-240,-50,45]],
 [3.5,[-55,40,80]],[4.15,[690,0,160]],[4.8,[740,0,160]],
 [5.6,[1170,-25,160]],[6.6,[1470,-15,160]],[8,[1480,0,160]],
 [9,[1920,-20,160]],[10,[2220,-10,160]],[11,[2640,40,320]],
 [12,[3090,35,540]],[13,[3650,45,530]],[14,[4230,50,235]],
 [15,[4800,90,-100]],[16,[5310,180,-80]],[17,[5400,280,160]],
 [18,[5400,115,160]],[19,[5400,100,160]],[20,[5400,100,160]],
 [21,[5400,60,160]],[23,[5400,0,160]],[26,[5400,0,160]],
];
export const signalAt=t=>t<=2.5?[-420,-180,15]:spline(signalNodes,t);
export const foldAt=t=>progress(t,4.65,5.85);
// These exact vertices carry the projected pattern from the flat screen into the walls.
export function screenPoint(t,side,u,v){
 const fold=foldAt(t),angle=fold*Math.PI/2,length=310*(1+fold*1.2);
 return [700+Math.sin(angle)*u*length,v*230,160+side*(310-Math.cos(angle)*u*length)];
}

// The same six tabs migrate from the first room's ring to a suspended gallery.
export function galleryPoint(t,i,u,v){
 const phase=Math.min(t,8),open=progress(t,5.4,7.4),a=i/6*Math.PI*2+phase*.23,r=205+open*75;
 const y=Math.sin(a)*r,z=160+Math.cos(a)*r,x=1500+Math.sin(a)*35,w=28+open*50,h=20+open*74,lean=Math.sin(phase+i)*.45*open;
 const source=[x+v*h/2*Math.sin(lean),y+v*h/2*Math.cos(lean),z+u*w/2];
 const targets=[[2250,0,160],[2180,-260,-220],[2210,250,-220],[2100,-260,540],[2160,250,540],[2450,30,660]];
 const center=targets[i],spread=progress(t,7.85+i*.055,9.55+i*.055),pitch=(i%2?1:-1)*.17;
 const target=[center[0]+u*35*Math.sin(pitch),center[1]+v*(i===0?110:105),center[2]+u*(i===0?160:135)];
 return source.map((n,k)=>mix(n,target[k],spread));
}
export function ribbonPoint(u,side=0){
 const a=u*Math.PI*2*.9,x=2250+3000*u,y=165+Math.sin(u*Math.PI*2)*55,z=160+Math.sin(a)*400;
 const tangent=norm([3000,0,Math.cos(a)*400*Math.PI*2*.9]),right=[-tangent[2],0,tangent[0]];
 return add([x,y,z],mul(right,side*160));
}
export function cardPoint(t,i,u,v){
 const initial=galleryPoint(t,i,u,v);if(i!==0)return initial;
 const unfold=progress(t,10,11.65),target=ribbonPoint((v+1)/2,u);
 return initial.map((n,k)=>mix(n,target[k],unfold));
}
export function orbitPoint(t,ring,a){
 const rise=progress(t,16.7,18.9),bloom=progress(t,20.5,23.8),r=(240+ring*125)*(1+bloom*.12),tilt=rise*(.72+ring*.31)+bloom*.4*Math.sin(a*3+t),yaw=rise*ring*.7+bloom*(t-20)*.35;
 const x=Math.cos(a)*r,z=Math.sin(a)*r,y=-z*Math.sin(tilt),zz=z*Math.cos(tilt);
 return [5400+x*Math.cos(yaw)+zz*Math.sin(yaw),350-rise*230-progress(t,20,23)*120+y,160-x*Math.sin(yaw)+zz*Math.cos(yaw)];
}
