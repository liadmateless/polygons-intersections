import * as turf from '@turf/turf';

function getSmallestIntersections(polygons) {
  const results = [];
  const n = polygons.length;

  // helper: intersect multiple polygons
  function intersectGroup(indexes) {
    let res = polygons[indexes[0]];

    for (let i = 1; i < indexes.length; i++) {
      const fc = turf.featureCollection([res, polygons[indexes[i]]]);
      const inter = turf.intersect(fc);

      if (!inter) return null;
      res = inter;
    }

    return res;
  }

  // helper: combinations
  function combinations(arr, size) {
    const res = [];

    function backtrack(start, path) {
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

  // 🔥 try larger groups first
  for (let size = n; size >= 2; size--) {
    const groups = combinations(allIndexes, size);

    for (const group of groups) {
      // skip if already covered
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



// helper: square polygon
function square(x, y, size) {
  return turf.polygon([[
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
    [x, y],
  ]]);
}

// 🔷 CASE 1: A-B, B-C, no triple
const A = square(0, 0, 10);
const B = square(5, 0, 10);
const C = square(10, 0, 10);

// 🔷 CASE 2: D-E separate group
const D = square(30, 0, 10);
const E = square(35, 0, 10);
// 🔷 CASE 3: F-H intersected group
const F = square(50, 0, 15);
const G = square(55, 0, 15);
const H = square(60, 0, 15);

const polygons = [A, B, C, D, E, F, G, H];

// run
const results = getSmallestIntersections(polygons);

console.log('\n=== RESULTS ===\n');

results.forEach((r, i) => {
  const area = turf.area(r.intersection);

  console.log(`Result ${i + 1}`);
  console.log('Indexes:', r.indexes);
  console.log('Area:', area);
  console.log('---');
});