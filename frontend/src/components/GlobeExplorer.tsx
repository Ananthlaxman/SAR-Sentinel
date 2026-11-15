
import { useMemo, useRef, useState, useEffect } from "react";
import Globe from "react-globe.gl";
import { Search, LocateFixed, Globe2 } from "lucide-react";

export interface PlaceSelection {
  label: string;
  country: string;
  state: string;
  lat: number;
  lng: number;
}

const countryOptions = [
  "India",
  "United States",
  "Brazil",
  "Canada",
  "Australia",
  "Japan",
  "Indonesia",
  "China",
  "Nepal",
  "United Kingdom",
  "France",
  "Germany",
  "New Zealand",
  "Iceland",
  "Kenya"
];

const indiaStates: Record<string, [number, number]> = {
  "Tamil Nadu": [11.1271, 78.6569],
  Kerala: [10.8505, 76.2711],
  Assam: [26.2006, 92.9376],
  Uttarakhand: [30.0668, 79.0193],
  Karnataka: [15.3173, 75.7139],
  Maharashtra: [19.7515, 75.7139],
  "Andhra Pradesh": [15.9129, 79.7400],
  Telangana: [18.1124, 79.0193],
  "West Bengal": [22.9868, 87.8550],
  "Himachal Pradesh": [31.1048, 77.1734],
  Odisha: [20.9517, 85.0985],
  Rajasthan: [27.0238, 74.2179],
  Gujarat: [22.2587, 71.1924],
  "Madhya Pradesh": [22.9734, 78.6569],
  "Uttar Pradesh": [26.8467, 80.9462],
  "Jammu and Kashmir": [33.7782, 76.5762],
  "New Delhi": [28.6139, 77.2090]
};

const countryCenters: Record<string, [number, number]> = {
  India: [20.5937, 78.9629],
  "United States": [39.8283, -98.5795],
  Brazil: [-14.2350, -51.9253],
  Canada: [56.1304, -106.3468],
  Australia: [-25.2744, 133.7751],
  Japan: [36.2048, 138.2529],
  Indonesia: [-0.7893, 113.9213],
  China: [35.8617, 104.1954],
  Nepal: [28.3949, 84.1240],
  "United Kingdom": [55.3781, -3.4360],
  France: [46.2276, 2.2137],
  Germany: [51.1657, 10.4515],
  "New Zealand": [-40.9006, 174.8860],
  Iceland: [64.9631, -19.0208],
  Kenya: [-0.0236, 37.9062]
};

interface Props {
  onSelect: (place: PlaceSelection) => void;
  selected: PlaceSelection;
}

export default function GlobeExplorer({ onSelect, selected }: Props) {
  const globeRef = useRef<any>(null);

  const [country, setCountry] = useState(selected.country || "India");
  const [state, setState] = useState(selected.state || "Tamil Nadu");
  const [query, setQuery] = useState("");
  const [clicked, setClicked] = useState<[number, number] | null>(null);

  // Calculate the position where the globe should focus.
  const center = useMemo(() => {
    if (clicked) {
      return {
        lat: clicked[0],
        lng: clicked[1],
        altitude: 1.55
      };
    }

    if (country === "India" && indiaStates[state]) {
      return {
        lat: indiaStates[state][0],
        lng: indiaStates[state][1],
        altitude: 1.45
      };
    }

    const position = countryCenters[country] || countryCenters.India;

    return {
      lat: position[0],
      lng: position[1],
      altitude: 1.65
    };
  }, [country, state, clicked]);

  // Move the globe toward the selected location.
  useEffect(() => {
    globeRef.current?.pointOfView(center, 1000);
  }, [center]);

  const filtered = countryOptions.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  function selectPlace() {
    const coords =
      clicked ||
      (country === "India" && indiaStates[state]
        ? indiaStates[state]
        : countryCenters[country] || countryCenters.India);

    const label = country === "India" ? `${state}, India` : country;

    onSelect({
      label,
      country,
      state: country === "India" ? state : "",
      lat: coords[0],
      lng: coords[1]
    });
  }

  return (
    <section className="globe-workspace">
      <div className="globe-topline">
        <div>
          <span className="eyebrow">
            <span className="live-dot" />
            GLOBAL EARTH OBSERVATION
          </span>

          <h2>Explore the living Earth</h2>

          <p>
            Choose a region to discover available NISAR radar observations.
          </p>
        </div>

        <span className="globe-status">
          <Globe2 size={15} />
          GLOBAL VIEW
        </span>
      </div>

      <div className="globe-layout">
        <div className="globe-stage">
          <div className="globe-halo" />

          <Globe
            ref={globeRef}
            width={760}
            height={560}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="https://unpkg.com/three-globe/example/img/earth-topology.png"
            showAtmosphere
            atmosphereColor="#4dbdff"
            atmosphereAltitude={0.19}
            animateIn
            enablePointerInteraction
            onGlobeClick={({ lat, lng }) => {
              setClicked([lat, lng]);

              onSelect({
                label: `Custom location (${lat.toFixed(3)}, ${lng.toFixed(3)})`,
                country,
                state: "",
                lat,
                lng
              });
            }}
            pointsData={[
              {
                lat: selected.lat,
                lng: selected.lng,
                size: 0.65
              }
            ]}
            pointLat="lat"
            pointLng="lng"
            pointAltitude={0.025}
            pointColor={() => "#5bd5ff"}
            pointRadius="size"
            pointResolution={12}
          />

          <div className="globe-hint">
            <LocateFixed size={13} />
            Drag to rotate · Scroll to zoom · Click to choose coordinates
          </div>
        </div>

        <aside className="location-panel">
          <div className="location-panel-title">
            <div className="mini-icon">
              <Search size={17} />
            </div>

            <div>
              <strong>Choose study area</strong>
              <small>Country and state selection</small>
            </div>
          </div>

          <label className="field-label" htmlFor="country-search">
            Search country
          </label>

          <div className="search-field">
            <Search size={15} />

            <input
              id="country-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a country..."
            />
          </div>

          <label className="field-label" htmlFor="country-select">
            Country
          </label>

          <select
            id="country-select"
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setClicked(null);
            }}
          >
            {filtered.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {country === "India" && (
            <>
              <label className="field-label" htmlFor="state-select">
                State / Union Territory
              </label>

              <select
                id="state-select"
                value={state}
                onChange={(event) => {
                  setState(event.target.value);
                  setClicked(null);
                }}
              >
                {Object.keys(indiaStates)
                  .sort()
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </>
          )}

          <div className="selected-location">
            <span>SELECTED LOCATION</span>
            <strong>{selected.label}</strong>
            <small>
              {selected.lat.toFixed(4)}°, {selected.lng.toFixed(4)}°
            </small>
          </div>

          <button
            className="primary-button location-submit"
            onClick={selectPlace}
          >
            <LocateFixed size={16} />
            Explore this location
          </button>

          <p className="location-note">
            A clicked point provides coordinates. Country/state boundaries
            and global ASF search coverage require further backend integration.
          </p>
        </aside>
      </div>
    </section>
  );
}
