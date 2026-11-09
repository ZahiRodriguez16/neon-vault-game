import { describe,it,expect } from 'vitest';
import { LEVELS,verifyLevels } from './levels';
describe('level integrity',()=>{
 it('contains six levels',()=>expect(LEVELS).toHaveLength(6));
 it('has valid dimensions and essential objects',()=>expect(verifyLevels()).toEqual([]));
 it('makes every collectible and exit accessible',()=>{
  for(const level of LEVELS){
   const start=level.map.flatMap((row,y)=>[...row].map((c,x)=>c==='P'?[x,y]:null)).find(Boolean);
   expect(start).toBeTruthy();
   const queue:[number,number][]=[start as [number,number]];
   const seen=new Set([`${start![0]},${start![1]}`]);
   for(let i=0;i<queue.length;i++){
    const [x,y]=queue[i];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
     if(ny<0||ny>=level.map.length||nx<0||nx>=level.map[ny].length||level.map[ny][nx]==='#'||seen.has(key))continue;
     seen.add(key);queue.push([nx,ny]);
    }
   }
   level.map.forEach((row,y)=>[...row].forEach((c,x)=>{
    if(c==='C'||c==='X')expect(seen.has(`${x},${y}`),`unreachable ${c} at ${x},${y} in ${level.name}`).toBe(true);
   }));
  }
 });
});
