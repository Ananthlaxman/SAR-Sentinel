
import { useEffect, useState } from "react";
import {
  Database,
  Satellite,
  Search,
  RefreshCw,
  Download,
  Calendar,
  HardDrive,
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

import {
  searchNisar,
  startNisarDownload,
  getDownloadStatus,
  type NisarObservation,
  type DownloadJob,
} from "../services/nisarApi";

import "./DataSources.css";

const REGIONS = [
  "Tamil Nadu, India",
  "Kerala, India",
  "Assam, India",
  "Uttarakhand, India",
];

const PRODUCTS = ["GCOV", "GSLC", "RSLC", "RIFG", "RUNW"];

function formatBytes(bytes: number): string {
  if (!bytes) return "Unknown";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

export default function DataSources() {
  const [region, setRegion] = useState(REGIONS[0]);
  const [product, setProduct] = useState("GCOV");

  const [observations, setObservations] = useState<NisarObservation[]>([]);
  const [selected, setSelected] = useState<NisarObservation | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const [job, setJob] = useState<DownloadJob | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const [startingDownload, setStartingDownload] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setSelected(null);
    setObservations([]);

    try {
      const result = await searchNisar(region, product, 20);
      setObservations(result.observations || []);
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "NISAR search failed"
      );
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!selected?.download_url) return;

    setStartingDownload(true);
    setDownloadError("");
    setJob(null);

    try {
      const response = await startNisarDownload(
        selected.download_url
      );

      setJob({
        job_id: response.job_id,
        status: "queued",
        progress: 0,
        downloaded_bytes: 0,
        total_bytes: 0,
        result: null,
        error: null,
      });
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Download could not start"
      );
    } finally {
      setStartingDownload(false);
    }
  }

  useEffect(() => {
    if (
      !job?.job_id ||
      job.status === "completed" ||
      job.status === "failed"
    ) {
      return;
    }

    let active = true;

    const timer = window.setInterval(async () => {
      try {
        const latest = await getDownloadStatus(job.job_id);

        if (active) {
          setJob(latest);
        }
      } catch (err) {
        if (active) {
          setDownloadError(
            err instanceof Error
              ? err.message
              : "Unable to check download progress"
          );
        }
      }
    }, 1500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [job?.job_id, job?.status]);

  return (
    <div className="data-page">
      <div className="data-heading">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            NASA / ISRO EARTH OBSERVATION
          </div>
          <h1>Data Sources</h1>
          <p>
            Discover, inspect and download real NISAR satellite
            observations from the ASF catalog.
          </p>
        </div>

        <div className="data-heading-icon">
          <Database size={28} />
        </div>
      </div>

      <div className="data-stat-grid">
        <div className="data-stat">
          <Satellite />
          <div>
            <small>PRIMARY DATA SOURCE</small>
            <strong>NASA / ISRO NISAR</strong>
          </div>
        </div>

        <div className="data-stat">
          <Database />
          <div>
            <small>CATALOG PROVIDER</small>
            <strong>ASF DAAC</strong>
          </div>
        </div>

        <div className="data-stat">
          <HardDrive />
          <div>
            <small>PRODUCT FORMATS</small>
            <strong>HDF5</strong>
          </div>
        </div>
      </div>

      <section className="panel data-search-panel">
        <div className="data-section-title">
          <Search size={19} />
          <div>
            <h3>Search NISAR Catalog</h3>
            <p>Search real satellite acquisitions by region and product.</p>
          </div>
        </div>

        <div className="data-search-fields">
          <label>
            Geographic region
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
            {loading ? "Searching..." : "Search Catalog"}
          </button>
        </div>

        <p className="catalog-note">
          Searches use the four geographic centers currently configured
          in your backend. This is not yet a global polygon search.
        </p>
      </section>

      <section className="panel data-results-panel">
        <div className="data-results-heading">
          <div>
            <h3>
              <Database size={18} /> Available Observations
            </h3>
            <p>Results returned by the ASF NISAR catalog.</p>
          </div>

          <span className="data-count">
            {observations.length} RESULTS
          </span>
        </div>

        {loading && (
          <div className="data-message">
            <RefreshCw className="spin" />
            Searching satellite observations...
          </div>
        )}

        {!loading && error && (
          <div className="data-message data-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!loading && !error && !searched && (
          <div className="data-message">
            Select a region and product to search the catalog.
          </div>
        )}

        {!loading && !error && searched && observations.length === 0 && (
          <div className="data-message">
            No observations were returned for this search.
          </div>
        )}

        <div className="data-observation-list">
          {observations.map((item, index) => (
            <button
              key={item.file_id || item.scene_name || index}
              className={`data-observation ${
                selected === item ? "selected" : ""
              }`}
              onClick={() => setSelected(item)}
            >
              <Satellite size={20} />

              <span className="data-observation-info">
                <strong>{item.scene_name || "NISAR Observation"}</strong>
                <small>{item.product} · Orbit {item.orbit ?? "N/A"}</small>
                <small>
                  <Calendar size={12} />
                  {item.start_time || "Acquisition date unavailable"}
                </small>
              </span>

              <span className="data-select-label">
                {selected === item ? "SELECTED" : "INSPECT"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <section className="panel data-detail-panel">
          <div className="data-results-heading">
            <div>
              <h3>
                <Satellite size={18} /> Observation Details
              </h3>
              <p>{selected.scene_name || "NISAR observation"}</p>
            </div>

            <span className="data-count">{selected.product}</span>
          </div>

          <div className="metadata-grid">
            <div>
              <small>FILE ID</small>
              <strong>{selected.file_id || "Unavailable"}</strong>
            </div>

            <div>
              <small>PRODUCT TYPE</small>
              <strong>{selected.product}</strong>
            </div>

            <div>
              <small>ACQUISITION START</small>
              <strong>{selected.start_time || "Unavailable"}</strong>
            </div>

            <div>
              <small>ACQUISITION END</small>
              <strong>{selected.stop_time || "Unavailable"}</strong>
            </div>

            <div>
              <small>ORBIT</small>
              <strong>{selected.orbit ?? "Unavailable"}</strong>
            </div>

            <div>
              <small>FRAME</small>
              <strong>{selected.frame ?? "Unavailable"}</strong>
            </div>
          </div>

          <div className="data-download-action">
            <div>
              <strong>HDF5 Scientific Product</strong>
              <small>
                {selected.download_url
                  ? "Catalog download URL available"
                  : "No download URL supplied"}
              </small>
            </div>

            <button
              className="primary-button"
              disabled={!selected.download_url || startingDownload}
              onClick={handleDownload}
            >
              {startingDownload ? (
                <RefreshCw className="spin" size={16} />
              ) : (
                <Download size={16} />
              )}
              {startingDownload ? "Starting..." : "Download HDF5"}
            </button>
          </div>
        </section>
      )}

      {downloadError && (
        <div className="data-message data-error">
          <AlertCircle size={18} />
          {downloadError}
        </div>
      )}

      {job && (
        <section className="panel download-panel">
          <div className="data-results-heading">
            <div>
              <h3>
                <Activity size={18} /> Download Monitor
              </h3>
              <p>Job ID: {job.job_id}</p>
            </div>

            <span className={`job-status ${job.status}`}>
              {job.status.toUpperCase()}
            </span>
          </div>

          <div className="download-progress-track">
            <div
              className="download-progress-fill"
              style={{
                width: `${job.progress ?? 0}%`,
              }}
            />
          </div>

          <div className="download-metrics">
            <span>
              {job.progress === null
                ? "Progress unavailable"
                : `${job.progress.toFixed(2)}%`}
            </span>

            <span>
              {formatBytes(job.downloaded_bytes)} /{" "}
              {formatBytes(job.total_bytes)}
            </span>
          </div>

          {job.status === "completed" && (
            <div className="data-success">
              <CheckCircle2 size={18} />
              Download completed and the backend reported success.
            </div>
          )}

          {job.status === "failed" && (
            <div className="data-error">
              <AlertCircle size={18} />
              {job.error || "Download failed"}
            </div>
          )}

          {job.status === "queued" && (
            <div className="data-message">
              <Clock size={17} /> Waiting for download worker...
            </div>
          )}

          {job.status === "downloading" && (
            <div className="data-message">
              <RefreshCw size={17} className="spin" />
              Downloading HDF5 product...
            </div>
          )}

          {job.result !== null && (
            <details className="download-result">
              <summary>Download result details</summary>
              <pre>{JSON.stringify(job.result, null, 2)}</pre>
            </details>
          )}
        </section>
      )}
    </div>
  );
}
