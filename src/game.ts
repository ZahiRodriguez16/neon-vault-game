import { COLS, LEVELS, ROWS, TILE } from './levels';
export type Mode = 'menu'|'playing'|'paused'|'dead'|'complete';
export interface Snapshot { mode:Mode; level:number; score:number; best:number; lives:number; collected:number; total:number; time:number; dash:number; muted:boolean; }
type Vec = {x:number;y:number};
type Drone = Vec & { vx:number;vy:number;phase:number; };
type Particle = Vec & {vx:number;vy:number;life:number;max:number;color:string;size:number};
const WIDTH = COLS*TILE, HEIGHT=ROWS*TILE;
const storage = {get:(key:string)=>{try{return localStorage.getItem(key)}catch{return null}},set:(key:string,val:string)=>{try{localStorage.setItem(key,val)}catch{ /* private mode */}}};
export class Game {
 private ctx:CanvasRenderingContext2D; private raf=0;private last=0;private ticks=0;private broadcast=0;
 private keys=new Set<string>();private touch:Vec={x:0,y:0};private dashPressed=false;
 private player:Vec={x:72,y:72}; private spawn:Vec={x:72,y:72};private exit:Vec={x:0,y:0};
 private walls=new Set<string>();private cells:Vec[]=[];private hazards:Vec[]=[];private batteries:Vec[]=[];private drones:Drone[]=[];private particles:Particle[]=[];
 private mode:Mode='menu';private level=0;private score=0;private lives=3;private total=0;private collected=0;private time=0;
 private invuln=0;private dashCooldown=0;private dashTime=0;private dashVec:Vec={x:0,y:0};private clock=0;private muted=storage.get('nv_muted')==='1';private best=Number(storage.get('nv_best')||'0');
 private audio?:AudioContext;private onChange:(state:Snapshot)=>void;
 constructor(private canvas:HTMLCanvasElement,onChange:(state:Snapshot)=>void){
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas 2D not available');this.ctx=ctx;this.onChange=onChange;
  this.canvas.width=WIDTH*2;this.canvas.height=HEIGHT*2;this.ctx.setTransform(2,0,0,2,0,0);
  this.load(0);this.mode='menu';this.send();this.raf=requestAnimationFrame(this.frame);
 }
 getState():Snapshot{return {mode:this.mode,level:this.level,score:this.score,best:this.best,lives:this.lives,collected:this.collected,total:this.total,time:Math.ceil(this.time),dash:this.dashCooldown,muted:this.muted}}
 private send(){this.onChange(this.getState())}
 private tileKey(c:number,r:number){return `${c},${r}`}
 private load(index:number){
  const data=LEVELS[index];this.level=index;this.walls.clear();this.cells=[];this.hazards=[];this.batteries=[];this.drones=[];this.particles=[];this.collected=0;this.total=0;this.time=data.timer;this.invuln=1.1;this.dashTime=0;this.dashCooldown=0;
  data.map.forEach((line,r)=>[...line].forEach((tile,c)=>{
    const pos={x:c*TILE+TILE/2,y:r*TILE+TILE/2};
    if(tile==='#')this.walls.add(this.tileKey(c,r));
    if(tile==='P')this.player=this.spawn={...pos};
    if(tile==='X')this.exit=pos;
    if(tile==='C')this.cells.push(pos);
    if(tile==='H')this.hazards.push(pos);
    if(tile==='B')this.batteries.push(pos);
    if(tile==='E')this.drones.push({...pos,vx:(this.drones.length%2===0?1:-1)*63,vy:0,phase:this.drones.length*.9});
  }));this.total=this.cells.length;
 }
 start(){this.score=0;this.lives=3;this.load(0);this.mode='playing';this.beep(520);this.send()}
 restart(){this.start()}
 togglePause(){if(this.mode==='playing')this.mode='paused';else if(this.mode==='paused')this.mode='playing';this.send()}
 nextLevel(){if(this.mode!=='playing')return;if(this.level===LEVELS.length-1){this.mode='complete';this.saveBest();this.beep(880);this.send();return}this.score+=Math.ceil(this.time)*5;this.load(this.level+1);this.beep(780);this.send()}
 toggleMute(){this.muted=!this.muted;storage.set('nv_muted',this.muted?'1':'0');this.send()}
 keyDown(code:string){this.keys.add(code);if(code==='Space'||code==='ShiftLeft'||code==='ShiftRight')this.dashPressed=true;if(code==='Escape'||code==='KeyP')this.togglePause()}
 keyUp(code:string){this.keys.delete(code)}
 setMove(x:number,y:number){this.touch={x,y}}
 requestDash(){this.dashPressed=true}
 private saveBest(){if(this.score>this.best){this.best=this.score;storage.set('nv_best',String(this.best))}}
 private beep(freq:number){if(this.muted)return;try{this.audio??=new AudioContext();const osc=this.audio.createOscillator();const gain=this.audio.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.065,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,this.audio.currentTime+.13);osc.connect(gain).connect(this.audio.destination);osc.start();osc.stop(this.audio.currentTime+.14)}catch{/* audio optional */}}
 private hitWall(x:number,y:number,r=13){for(const dx of [-r,r])for(const dy of [-r,r]){const c=Math.floor((x+dx)/TILE),row=Math.floor((y+dy)/TILE);if(c<0||row<0||c>=COLS||row>=ROWS||this.walls.has(this.tileKey(c,row)))return true}return false}
 private move(entity:Vec,dx:number,dy:number,r=13):boolean{let collided=false;if(!this.hitWall(entity.x+dx,entity.y,r))entity.x+=dx;else collided=true;if(!this.hitWall(entity.x,entity.y+dy,r))entity.y+=dy;else collided=true;return collided}
 private dist(a:Vec,b:Vec){return Math.hypot(a.x-b.x,a.y-b.y)}
 private burst(p:Vec,color:string,count=12){for(let i=0;i<count;i++){const a=Math.PI*2*i/count,v=60+Math.random()*150;this.particles.push({x:p.x,y:p.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.35+Math.random()*.4,max:.7,color,size:2+Math.random()*4})}}
 private hurt(){if(this.invuln>0||this.mode!=='playing')return;this.lives--;this.invuln=1.8;this.dashTime=0;this.burst(this.player,'#fb7185',24);this.beep(160);if(this.lives<=0){this.mode='dead';this.saveBest()}else this.player={...this.spawn};this.send()}
 private update(dt:number){
  this.ticks+=dt;this.clock+=dt;this.invuln=Math.max(0,this.invuln-dt);this.dashCooldown=Math.max(0,this.dashCooldown-dt);this.dashTime=Math.max(0,this.dashTime-dt);
  this.time=Math.max(0,this.time-dt);if(this.time===0){this.hurt();if(this.mode==='playing')this.time=25;}
  let x=Number(this.keys.has('ArrowRight')||this.keys.has('KeyD'))-Number(this.keys.has('ArrowLeft')||this.keys.has('KeyA'))+this.touch.x;
  let y=Number(this.keys.has('ArrowDown')||this.keys.has('KeyS'))-Number(this.keys.has('ArrowUp')||this.keys.has('KeyW'))+this.touch.y;
  const mag=Math.hypot(x,y);if(mag>0){x/=mag;y/=mag}
  if(this.dashPressed&&this.dashCooldown<=0&&mag>0){this.dashTime=.20;this.dashCooldown=2.35;this.dashVec={x,y};this.burst(this.player,'#5af9db',8);this.beep(400)}this.dashPressed=false;
  let speed=175;if(this.dashTime>0){x=this.dashVec.x;y=this.dashVec.y;speed=530;if(Math.random()<.75)this.particles.push({x:this.player.x,y:this.player.y,vx:0,vy:0,life:.22,max:.22,color:'#5af9db',size:9})}
  this.move(this.player,x*speed*dt,y*speed*dt,13);
  for(const drone of this.drones){drone.phase+=dt;const collided=this.move(drone,drone.vx*dt,drone.vy*dt,14);if(collided){drone.vx=-drone.vx;drone.vy=-drone.vy}if(Math.sin(drone.phase*1.8)>0.97){const old=drone.vx;drone.vx=-drone.vy||63;drone.vy=old||0}if(this.dist(drone,this.player)<28&&this.dashTime<=0)this.hurt()}
  for(let i=this.cells.length-1;i>=0;i--){const cell=this.cells[i];if(this.dist(this.player,cell)<27){this.cells.splice(i,1);this.collected++;this.score+=100+Math.ceil(this.time/10);this.burst(cell,'#fbbf24');this.beep(740);this.send()}}
  for(let i=this.batteries.length-1;i>=0;i--){if(this.dist(this.player,this.batteries[i])<28){const p=this.batteries.splice(i,1)[0];this.lives=Math.min(5,this.lives+1);this.score+=25;this.burst(p,'#4ade80');this.beep(970);this.send()}}
  for(const hazard of this.hazards)if(this.dist(this.player,hazard)<25)this.hurt();
  if(this.collected===this.total&&this.dist(this.player,this.exit)<31)this.nextLevel();
  this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.98;p.vy*=.98}
  this.broadcast+=dt;if(this.broadcast>.16){this.broadcast=0;this.send()}
 }
 private rounded(x:number,y:number,w:number,h:number,r:number){this.ctx.beginPath();this.ctx.roundRect(x,y,w,h,r)}
 private draw(){const ctx=this.ctx;const accent=LEVELS[this.level].color;ctx.clearRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle='#090e21';ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.strokeStyle='#182343';ctx.lineWidth=1;ctx.beginPath();for(let x=0;x<=WIDTH;x+=TILE){ctx.moveTo(x,0);ctx.lineTo(x,HEIGHT)}for(let y=0;y<=HEIGHT;y+=TILE){ctx.moveTo(0,y);ctx.lineTo(WIDTH,y)}ctx.stroke();
  for(const key of this.walls){const [c,r]=key.split(',').map(Number),x=c*TILE,y=r*TILE;ctx.fillStyle='#172342';this.rounded(x+2,y+2,TILE-4,TILE-4,8);ctx.fill();ctx.strokeStyle='#2f4673';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#26385d';ctx.fillRect(x+9,y+8,TILE-18,3)}
  for(const hazard of this.hazards){const s=16+Math.sin(this.ticks*6)*3;ctx.save();ctx.translate(hazard.x,hazard.y);ctx.rotate(this.ticks);ctx.strokeStyle='#fb7185';ctx.lineWidth=4;ctx.shadowColor='#fb7185';ctx.shadowBlur=15;ctx.strokeRect(-s,-s,s*2,s*2);ctx.restore()}
  const unlocked=this.collected===this.total;const glow=unlocked?'#5af9db':'#526381';ctx.save();ctx.translate(this.exit.x,this.exit.y);ctx.shadowColor=glow;ctx.shadowBlur=unlocked?28:5;ctx.strokeStyle=glow;ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,17+Math.sin(this.ticks*3)*2,0,Math.PI*2);ctx.stroke();ctx.rotate(this.ticks*.8);ctx.strokeRect(-10,-10,20,20);ctx.restore();
  for(const cell of this.cells){const bob=Math.sin(this.ticks*3+cell.x)*4;ctx.save();ctx.translate(cell.x,cell.y+bob);ctx.rotate(this.ticks*.7);ctx.fillStyle='#fbbf24';ctx.shadowColor='#fbbf24';ctx.shadowBlur=22;ctx.fillRect(-9,-9,18,18);ctx.restore()}
  for(const item of this.batteries){ctx.save();ctx.translate(item.x,item.y);ctx.fillStyle='#4ade80';ctx.shadowColor='#4ade80';ctx.shadowBlur=20;this.rounded(-11,-11,22,22,5);ctx.fill();ctx.fillStyle='#092015';ctx.fillRect(-3,-8,6,16);ctx.fillRect(-8,-3,16,6);ctx.restore()}
  for(const drone of this.drones){ctx.save();ctx.translate(drone.x,drone.y);ctx.rotate(Math.sin(drone.phase)*.22);ctx.shadowColor='#fb7185';ctx.shadowBlur=18;ctx.fillStyle='#fb7185';this.rounded(-14,-14,28,28,8);ctx.fill();ctx.fillStyle='#2d0f28';ctx.fillRect(-8,-2,16,7);ctx.fillStyle='#fff';ctx.fillRect(-5,-1,4,4);ctx.fillRect(3,-1,4,4);ctx.restore()}
  if(!(this.invuln>0&&Math.floor(this.ticks*12)%2===0)){ctx.save();ctx.translate(this.player.x,this.player.y);ctx.shadowColor=accent;ctx.shadowBlur=24;ctx.fillStyle=accent;this.rounded(-13,-13,26,26,9);ctx.fill();ctx.fillStyle='#07182a';ctx.fillRect(-7,-4,14,8);ctx.fillStyle='#ffffff';ctx.fillRect(-5,-2,4,4);ctx.fillRect(2,-2,4,4);ctx.restore()}
  for(const p of this.particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size)}ctx.globalAlpha=1;
  if(this.mode==='menu'){ctx.fillStyle='rgba(9,14,33,.22)';ctx.fillRect(0,0,WIDTH,HEIGHT)}
 }
 private frame=(time:number)=>{const dt=Math.min((time-this.last)/1000||0,.035);this.last=time;if(this.mode==='playing')this.update(dt);else this.ticks+=dt;this.draw();this.raf=requestAnimationFrame(this.frame)};
 destroy(){cancelAnimationFrame(this.raf);this.keys.clear();void this.audio?.close()}
}
