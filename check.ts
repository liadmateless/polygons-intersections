import {
  Feature,
  Polygon,
  MultiPolygon,
  GeoJsonProperties,
} from 'geojson';
import * as turf from '@turf/turf';

// Type for allowed geometries
type PolygonFeature = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

export function globalIntersection(
  polygons: PolygonFeature[]
): PolygonFeature | null {
  if (polygons.length === 0) return null;

  // Sort by area (small → large)
  const sorted = [...polygons].sort(
    (a, b) => turf.area(a) - turf.area(b)
  );

  let result: PolygonFeature = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Fast bbox check
    if (!turf.booleanIntersects(result, next)) {
      return null;
    }

    const intersection = turf.intersect(result, next);

    if (!intersection) return null;

    result = intersection as PolygonFeature;
  }

  return result;
}