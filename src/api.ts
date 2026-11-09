export interface LeaderboardEntry { id:number; name:string; score:number; level:number; created_at:string }
const API = (import.meta.env.VITE_API_URL as string|undefined)?.replace(/\/$/,'');
export const hasOnline=Boolean(API);
export async function getLeaderboard():Promise<LeaderboardEntry[]>{if(!API)return[];const res=await fetch(`${API}/api/leaderboard`);if(!res.ok)throw Error('Leaderboard unavailable');return res.json() as Promise<LeaderboardEntry[]>}
export async function submitScore(name:string,score:number,level:number){if(!API)throw Error('Online leaderboard not configured');const res=await fetch(`${API}/api/scores`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,score,level})});if(!res.ok)throw Error('Could not save score');return res.json()}
