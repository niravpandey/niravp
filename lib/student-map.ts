import { geoArea, geoCentroid, geoEqualEarth, geoPath } from "d3-geo";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import { feature } from "topojson-client";
import type { Feature, Geometry, MultiPolygon, Polygon } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import world110m from "world-atlas/countries-110m.json";
import world50m from "world-atlas/countries-50m.json";
import { cohorts } from "@/lib/students";

countries.registerLocale(en);

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 470;

const ANTARCTICA_ID = "010";

/** Where the library's short name reads oddly. */
const NAME_OVERRIDES: Record<string, string> = { NL: "Netherlands" };

export type MapCountry = {
  id: string;
  d: string;
};

export type MapPlace = {
  code: string;
  name: string;
  /** Numeric ISO id, matching a base map outline when `inBaseMap`. */
  id: string;
  /** Small countries (e.g. Singapore) have no outline on the base map and are drawn as a dot. */
  inBaseMap: boolean;
  x: number;
  y: number;
};

export type CohortCounts = {
  id: string;
  label: string;
  title: string;
  /** Country code -> number of students. */
  counts: Record<string, number>;
};

export type StudentMapData = {
  width: number;
  height: number;
  countries: MapCountry[];
  /** Every country with students in any cohort, keyed by country code. */
  places: Record<string, MapPlace>;
  cohorts: CohortCounts[];
};

type CountryFeature = Feature<Geometry, { name: string }>;

function toFeatures(topology: unknown): CountryFeature[] {
  const topo = topology as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  return feature(topo, topo.objects.countries).features.map((f) => ({ ...f, id: f.id === undefined ? undefined : String(f.id) }));
}

/** Centroid of the biggest landmass, so e.g. France isn't pulled out to sea by French Guiana. */
function mainCentroid(geometry: Geometry): [number, number] {
  if (geometry.type !== "MultiPolygon") return geoCentroid(geometry as Polygon);
  const polygons = (geometry as MultiPolygon).coordinates.map((coordinates): Polygon => ({ type: "Polygon", coordinates }));
  const largest = polygons.reduce((best, polygon) => (geoArea(polygon) > geoArea(best) ? polygon : best));
  return geoCentroid(largest);
}

/** Projects the world map and student locations to SVG coordinates on the server. */
export function getStudentMapData(): StudentMapData | null {
  const base = toFeatures(world110m).filter((f) => f.id !== ANTARCTICA_ID);
  const baseIds = new Set(base.map((f) => f.id));
  // The detailed map is only used to locate small countries (e.g. Hong Kong) missing from the base map.
  const detailed = new Map(toFeatures(world50m).map((f) => [f.id, f]));

  const projection = geoEqualEarth().fitSize([MAP_WIDTH, MAP_HEIGHT], { type: "FeatureCollection", features: base });
  const path = geoPath(projection).digits(1);

  const places: Record<string, MapPlace> = {};

  function locate(code: string): MapPlace | null {
    const alpha2 = code.toUpperCase();
    if (places[alpha2]) return places[alpha2];

    const id = countries.alpha2ToNumeric(alpha2);
    const shape = id ? detailed.get(id) : undefined;
    const point = shape ? projection(mainCentroid(shape.geometry)) : null;

    if (!id || !point) {
      console.warn(`[student-map] Unknown country code "${code}", skipping.`);
      return null;
    }

    return {
      code: alpha2,
      name: NAME_OVERRIDES[alpha2] ?? countries.getName(alpha2, "en", { select: "alias" }) ?? alpha2,
      id,
      inBaseMap: baseIds.has(id),
      x: Math.round(point[0] * 10) / 10,
      y: Math.round(point[1] * 10) / 10,
    };
  }

  const cohortCounts = cohorts.flatMap(({ id, label, title, countries: entries }) => {
    const counts: Record<string, number> = {};
    for (const { code, students } of entries) {
      const place = locate(code);
      if (!place) continue;
      places[place.code] = place;
      counts[place.code] = (counts[place.code] ?? 0) + Math.max(1, students ?? 1);
    }
    return Object.keys(counts).length > 0 ? [{ id, label, title, counts }] : [];
  });

  if (cohortCounts.length === 0) return null;

  return {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    countries: base.flatMap((f, index) => {
      const d = path(f);
      // A few disputed territories have no ISO id; keep their outline so the map has no holes.
      return d ? [{ id: f.id ? String(f.id) : `unlisted-${index}`, d }] : [];
    }),
    places,
    cohorts: cohortCounts,
  };
}
