import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PersonEvent } from "@/lib/genealogy/types";

// Fix default marker icons (Vite doesn't resolve leaflet's asset URLs).
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 6 });
  }, [map, points]);
  return null;
}

export function MigrationMap({ events }: { events: PersonEvent[] }) {
  const withGeo = events.filter((e) => e.geo);
  const ordered = [...withGeo].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const points: [number, number][] = ordered.map((e) => [e.geo!.lat, e.geo!.lng]);

  if (points.length === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        Aucun lieu géolocalisé pour cette personne.
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-lg border">
      <MapContainer center={points[0]} zoom={5} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={points} pathOptions={{ color: "hsl(var(--primary))", weight: 3, dashArray: "6 6" }} />
        {ordered.map((e, i) => (
          <Marker key={e.id} position={[e.geo!.lat, e.geo!.lng]} icon={icon}>
            <Popup>
              <div className="text-xs">
                <div className="font-semibold">
                  {i + 1}. {e.place}
                </div>
                <div className="text-muted-foreground">{e.date}</div>
                {e.description && <div className="mt-1">{e.description}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
