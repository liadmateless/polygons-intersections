import * as turf from '@turf/turf';
import {
  Feature,
  Polygon,
  MultiPolygon,
  GeoJsonProperties
} from 'geojson';

type Poly = Feature<Polygon | MultiPolygon>;

type IntersectionResult = {
  indexes: number[];
  intersection: Feature<Polygon | MultiPolygon, GeoJsonProperties>;
};

function bboxOverlap(b1: number[], b2: number[]): boolean {
  return !(
    b2[0] > b1[2] ||
    b2[2] < b1[0] ||
    b2[1] > b1[3] ||
    b2[3] < b1[1]
  );
}

export function getMaximalIntersections(
  polygons: Poly[]
): IntersectionResult[] {
  const n = polygons.length;
  const bboxes = polygons.map(p => turf.bbox(p));

  const results: IntersectionResult[] = [];
  const queue: IntersectionResult[] = [];

  // 🔹 Step 1: seed with pairs
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {

      if (!bboxOverlap(bboxes[i], bboxes[j])) continue;

      const inter = turf.intersect(
        turf.featureCollection([polygons[i], polygons[j]])
      );

      if (!inter) continue;

      queue.push({
        indexes: [i, j],
        intersection: inter as Poly
      });
    }
  }

  // 🔹 Step 2: BFS expansion
  const seen = new Set<string>();

  while (queue.length) {
    const current = queue.shift()!;
    const sortedIndexes = [...current.indexes].sort((a, b) => a - b);
    const key = sortedIndexes.join(',');

    if (seen.has(key)) continue;
    seen.add(key);

    let expanded = false;

    const currentBBox = turf.bbox(current.intersection);

    for (let k = 0; k < n; k++) {
      if (current.indexes.includes(k)) continue;

      if (!bboxOverlap(currentBBox, bboxes[k])) continue;

      const next = turf.intersect(
        turf.featureCollection([current.intersection, polygons[k]])
      );

      if (next) {
        expanded = true;

        queue.push({
          indexes: [...current.indexes, k],
          intersection: next as Poly
        });
      }
    }

    // 🔹 Step 3: if cannot expand → it's maximal
    if (!expanded) {
      results.push({
        indexes: sortedIndexes,
        intersection: current.intersection
      });
    }
  }

  // 🔹 Step 4: remove subsets
  return results.filter(r =>
    !results.some(other =>
      other !== r &&
      other.indexes.length > r.indexes.length &&
      r.indexes.every(i => other.indexes.includes(i))
    )
  );
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