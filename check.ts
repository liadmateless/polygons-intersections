import * as turf from '@turf/turf';

type Poly = turf.Feature<turf.Polygon | turf.MultiPolygon>;

export function getSmallestIntersections(polygons: Poly[]) {
  const results: { indexes: number[]; intersection: any }[] = [];
  const n = polygons.length;

  // helper: intersect multiple polygons
  function intersectGroup(indexes: number[]) {
    let res = polygons[indexes[0]];

    for (let i = 1; i < indexes.length; i++) {
      const fc = turf.featureCollection([res, polygons[indexes[i]]]);
      const inter = turf.intersect(fc);

      if (!inter) return null;
      res = inter as any;
    }

    return res;
  }

  // helper: generate combinations
  function combinations(arr: number[], size: number): number[][] {
    const res: number[][] = [];

    function backtrack(start: number, path: number[]) {
      if (path.length === size) {
        res.push([...path]);
        return;
      }

      for (let i = start; i < arr.length; i++) {
        path.push(arr[i]);
        backtrack(i + 1, path);
        path.pop();
      }
    }

    backtrack(0, []);
    return res;
  }

  const allIndexes = Array.from({ length: n }, (_, i) => i);

  // 🔥 Step 1: try bigger groups first
  for (let size = n; size >= 2; size--) {
    const groups = combinations(allIndexes, size);

    for (const group of groups) {
      // skip if already covered by bigger result
      const covered = results.some(r =>
        group.every(i => r.indexes.includes(i))
      );
      if (covered) continue;

      const inter = intersectGroup(group);
      if (inter) {
        results.push({ indexes: group, intersection: inter });
      }
    }
  }

  return results;
}

import * as turf from '@turf/turf';
import { getSmallestIntersections } from './your-function-file';

// helper to create square polygon
function square(x: number, y: number, size: number) {
  return turf.polygon([[
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
    [x, y],
  ]]);
}

// 🔷 Build test polygons

// A overlaps B
const A = square(0, 0, 10);

// B overlaps A and C
const B = square(5, 0, 10);

// C overlaps B only
const C = square(10, 0, 10);

// D overlaps E
const D = square(30, 0, 10);
const E = square(35, 0, 10);

// No triple intersection between A,B,C
const polygons = [A, B, C, D, E];

// 🚀 Run
const results = getSmallestIntersections(polygons);

// 🧾 Print nicely
console.log('RESULTS:\n');

results.forEach((r, i) => {
  const area = turf.area(r.intersection);

  console.log(`Result ${i + 1}`);
  console.log('Indexes:', r.indexes);
  console.log('Area:', area);
  console.log('---');
});