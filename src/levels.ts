export const TILE = 48;
export const COLS = 20;
export const ROWS = 11;
export interface Level { name: string; subtitle: string; color: string; timer: number; map: string[] }
// # wall, . floor, P player, C collectible, E enemy, X exit, H hazard, B battery/health.
export const LEVELS: Level[] = [
 { name:'THE AWAKENING',subtitle:'Find the cells. Open the gate.',color:'#5af9db',timer:95,map:[
 '####################',
 '#P..C......#......X#',
 '#.####.###.#.####..#',
 '#....#.....#....#..#',
 '###..#.########.#..#',
 '#C...#....C.....#..#',
 '#.######.######.#..#',
 '#......#....E...#..#',
 '#.####.#######.##..#',
 '#...C..............#',
 '####################'] },
 { name:'SECURITY BREACH',subtitle:'The drones have spotted you.',color:'#a78bfa',timer:105,map:[
 '####################',
 '#P.....#......C...X#',
 '#.###..#.########..#',
 '#...#..#.....E.....#',
 '###.#..######.####.#',
 '#C..#......C..#....#',
 '#.######.######.##.#',
 '#....E...#.....#...#',
 '#.######.#.###.#.###',
 '#.......C#.....B...#',
 '####################'] },
 { name:'RED ALERT',subtitle:'Danger zones drain your shield.',color:'#fb7185',timer:110,map:[
 '####################',
 '#P..C......#......X#',
 '#.####.###.#.####..#',
 '#....#..H..#....#..#',
 '###..#.########.#..#',
 '#C...#..E.C.....#..#',
 '#.######.######.#..#',
 '#...H..#....E...#..#',
 '#.####.#######.##..#',
 '#...C..........B...#',
 '####################'] },
 { name:'THE LABYRINTH',subtitle:'Dash through a shifting world.',color:'#fbbf24',timer:115,map:[
 '####################',
 '#P..#.......#.....X#',
 '#.#.#.#####.#.###..#',
 '#.#...#C....#...#..#',
 '#.#####.########.#.#',
 '#.....#....E.....#.#',
 '#####.######.#####.#',
 '#C....#...H....#C..#',
 '#.#####.#####..###.#',
 '#...E....C.....B...#',
 '####################'] },
 { name:'CORE MELTDOWN',subtitle:'Get out before it is too late.',color:'#38bdf8',timer:105,map:[
 '####################',
 '#P...H...#...E....X#',
 '#.#####..#.#####...#',
 '#C....#..#...C.#...#',
 '#####.#..###.#.#.###',
 '#...E.#......#.#...#',
 '#.##########.#.###.#',
 '#..C...H...#.#...C.#',
 '#.########.#.###.#.#',
 '#........B...E.....#',
 '####################'] },
 { name:'FINAL EXTRACTION',subtitle:'One last run. Make it count.',color:'#f472b6',timer:120,map:[
 '####################',
 '#P...C...#...H....X#',
 '#.######.#.######..#',
 '#....E...#..C......#',
 '###.###########.##.#',
 '#C....#....E....#..#',
 '#.###.#.#########..#',
 '#...#....H....#C...#',
 '#.#.#########..###.#',
 '#B#....C....E......#',
 '####################'] }
];
export function verifyLevels(levels: Level[] = LEVELS): string[] {
 const errors: string[] = [];
 levels.forEach((level,i) => {
  if (level.map.length !== ROWS) errors.push(`Level ${i+1} has wrong height`);
  level.map.forEach((row,j) => { if(row.length !== COLS) errors.push(`Level ${i+1}, row ${j+1} has width ${row.length}`); });
  for (const symbol of ['P','X','C']) if (!level.map.join('').includes(symbol)) errors.push(`Level ${i+1} missing ${symbol}`);
 });
 return errors;
}
