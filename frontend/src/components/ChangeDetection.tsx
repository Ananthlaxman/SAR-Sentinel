
import { useState } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Calendar,
  Satellite,
  AlertCircle,
} from "lucide-react";

import {
  searchNisar,
  type NisarObservation,
} from "../services/nisarApi";

import ChangeComparison from "./ChangeComparison";
import "./ChangeDetection.css";

const REGIONS = [
  "Tamil Nadu, India",
  "Kerala, India",
  "Assam, India",
  "Uttarakhand, India",
];

const PRODUCTS = ["GCOV", "GSLC", "RSLC", "RIFG", "RUNW"];

function getBrowseUrl(item: NisarObservation): string | null {
  const url = item.browse_url as unknown;

  if (Array.isArray(url)) {
    return url[0] || null;
  }

  return typeof url === "string" ? url : null;
}

function getDate(item: NisarObservation): number {
  if (!item.start_time) return 0;

  const date = new Date(item.start_time).getTime();

  return Number.isNaN(date) ? 0 : date;
}

export default function ChangeDetection() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [product, setProduct] = useState("GCOV");

  const [observations, setObservations] =
    useState<NisarObservation[]>([]);

  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setObservations([]);
    setBeforeId("");
    setAfterId("");
    setSearched(false);

    try {
      const response = await searchNisar(region, product, 100);

      const sorted = [...response.observations].sort(
        (a, b) => getDate(a) - getDate(b)
      );

      setObservations(sorted);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve NISAR observations"
      );
    } finally {
      setLoading(false);
    }
  }

  const beforeObservation = observations.find(
    (item) => (item.file_id || item.scene_name) === beforeId
  );

  const afterObservation = observations.find(
    (item) => (item.file_id || item.scene_name) === afterId
  );

  const beforeUrl = beforeObservation
    ? getBrowseUrl(beforeObservation)
    : null;

  const afterUrl = afterObservation
    ? getBrowseUrl(afterObservation)
    : null;

  const validSelection =
    !!beforeObservation &&
    !!afterObservation &&
    beforeId !== afterId &&
    getDate(beforeObservation) > 0 &&
    getDate(afterObservation) > getDate(beforeObservation);

  return (
    <div className="change-detection-page">

      <header className="change-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            SAR TEMPORAL ANALYSIS
          </div>

          <h1>Change Detection</h1>

          <p>
            Compare historical and newer NISAR satellite
            observations from the same study region.
          </p>
        </div>

        <Activity size={32} />
      </header>

      <section className="panel change-search-panel">
        <h3>
          <Search size={18} />
          Find Satellite Acquisitions
        </h3>

        <div className="change-search-fields">
          <label>
            Study region
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            NISAR product
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
            >
              {PRODUCTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            className="primary-button"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="spin" size={17} />
            ) : (
              <Search size={17} />
            )}

            {loading ? "Searching..." : "Find Acquisitions"}
          </button>
        </div>

        <p className="catalog-note">
          Select acquisitions from the same region and product type.
          Geographic overlap and scientific compatibility must still
          be verified before interpreting changes.
        </p>
      </section>

      {error && (
        <div className="change-message change-error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {searched && (
        <section className="panel acquisition-panel">

          <div className="change-section-heading">
            <div>
              <h3>
                <Satellite size={18} />
                Available Acquisitions
              </h3>

              <p>
                {observations.length} observations returned by ASF
              </p>
            </div>
          </div>

          {observations.length === 0 ? (
            <div className="change-message">
              No observations found. Try another region or product.
            </div>
          ) : (
            <>
              <div className="acquisition-selectors">

                <label>
                  <span className="before-text">
                    BEFORE — Historical
                  </span>

                  <select
                    value={beforeId}
                    onChange={(e) => setBeforeId(e.target.value)}
                  >
                    <option value="">
                      Select older observation
                    </option>

                    {observations.map((item, index) => {
                      const id = item.file_id || item.scene_name || "";

                      return (
                        <option
                          key={id || index}
                          value={id}
                          disabled={!id || id === afterId}
                        >
                          {item.start_time || "Unknown date"} —{" "}
                          {item.scene_name || item.file_id || "Observation"}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  <span className="after-text">
                    AFTER — Newer
                  </span>

                  <select
                    value={afterId}
                    onChange={(e) => setAfterId(e.target.value)}
                  >
                    <option value="">
                      Select newer observation
                    </option>

                    {observations.map((item, index) => {
                      const id = item.file_id || item.scene_name || "";

                      return (
                        <option
                          key={id || index}
                          value={id}
                          disabled={!id || id === beforeId}
                        >
                          {item.start_time || "Unknown date"} —{" "}
                          {item.scene_name || item.file_id || "Observation"}
                        </option>
                      );
                    })}
                  </select>
                </label>

              </div>

              <div className="acquisition-list">

                {observations.map((item, index) => {
                  const id =
                    item.file_id ||
                    item.scene_name ||
                    String(index);

                  return (
                    <div className="acquisition-row" key={id}>

                      <Calendar size={17} />

                      <div>
                        <strong>
                          {item.scene_name || "NISAR Observation"}
                        </strong>

                        <small>
                          {item.start_time || "Date unavailable"} ·
                          Orbit {item.orbit ?? "N/A"} · {item.product}
                        </small>
                      </div>

                      <span
                        className={
                          id === beforeId
                            ? "before-text"
                            : id === afterId
                              ? "after-text"
                              : ""
                        }
                      >
                        {id === beforeId
                          ? "BEFORE"
                          : id === afterId
                            ? "AFTER"
                            : "AVAILABLE"}
                      </span>

                    </div>
                  );
                })}

              </div>
            </>
          )}

        </section>
      )}

      {beforeId && afterId && !validSelection && (
        <div className="change-message change-error">
          Select two different observations with valid dates.
          The After observation must be newer than Before.
        </div>
      )}

      {validSelection && (
        <section className="panel comparison-workspace">

          <div className="change-section-heading">
            <div>
              <h3>
                <Activity size={18} />
                Before and After Comparison
              </h3>

              <p>
                {region} · {product}
              </p>
            </div>
          </div>

          {!beforeUrl || !afterUrl ? (
            <div className="change-message">
              One or both observations do not have browse images.
              Select observations with available browse images.
            </div>
          ) : (
            <ChangeComparison
              beforeUrl={beforeUrl}
              afterUrl={afterUrl}
              beforeDate={beforeObservation.start_time || "Before"}
              afterDate={afterObservation.start_time || "After"}
            />
          )}

        </section>
      )}

    </div>
  );
}
