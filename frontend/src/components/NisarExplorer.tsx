import { useState } from "react";
import { Search, Satellite, Database, Calendar, RefreshCw, Eye } from "lucide-react";
import { searchNisar, type NisarObservation } from "../services/nisarApi";
import "./NisarExplorer.css";

interface Props {
  initialRegion?: string;
  onObservationSelect?: (url: string | null) => void;
}

export default function NisarExplorer({ initialRegion, onObservationSelect }: Props) {
  const supportedRegions = ["Tamil Nadu, India", "Kerala, India", "Assam, India", "Uttarakhand, India"];
  const [region, setRegion] = useState(supportedRegions.includes(initialRegion || "") ? initialRegion! : "Tamil Nadu, India");
  const [product, setProduct] = useState("GCOV");
  const [observations, setObservations] = useState<NisarObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setSelected(null);
    onObservationSelect?.(null);
    try {
      const result = await searchNisar(region, product, 20);
      setObservations(result.observations);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to search");
      setObservations([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function browseUrl(item: NisarObservation): string | null {
    if (Array.isArray(item.browse_url)) return item.browse_url[0] || null;
    return item.browse_url || null;
  }

  return (
    <div className="explorer-page">
      <div className="explorer-heading">
        <div><span className="eyebrow">NASA / ISRO DATA DISCOVERY</span><h2>NISAR Data Explorer</h2><p>Discover available Synthetic Aperture Radar observations.</p></div>
        <Satellite size={35}/>
      </div>
      <div className="panel explorer-search">
        <h3><Search size={18}/> Search Satellite Observations</h3>
        <div className="explorer-fields">
          <label>Geographic Region<select value={region} onChange={e => setRegion(e.target.value)}>{supportedRegions.map(r => <option key={r}>{r}</option>)}</select></label>
          <label>Product Type<select value={product} onChange={e => setProduct(e.target.value)}><option value="GCOV">NISAR GCOV</option><option value="GSLC">NISAR GSLC</option><option value="RSLC">NISAR RSLC</option><option value="RIFG">NISAR RIFG</option><option value="RUNW">NISAR RUNW</option></select></label>
          <button className="primary-button search-button" onClick={handleSearch} disabled={loading}>{loading ? <RefreshCw className="spin"/> : <Search size={17}/>} {loading ? "Searching..." : "Search NISAR"}</button>
        </div>
        <p className="catalog-note">The current backend supports these four configured regional search centers. Global coordinate-based catalog search is a required next backend upgrade.</p>
      </div>
      <div className="explorer-results">
        <div className="results-heading"><h3><Database size={18}/> Observation Results</h3><span>{observations.length} observations</span></div>
        {loading && <p>Searching the ASF catalog...</p>}
        {error && <div className="explorer-message error-message">Search failed: {error}</div>}
        {!loading && !error && searched && observations.length === 0 && <div className="explorer-message">No matching observations were returned. Try another region or product type.</div>}
        {!searched && !loading && <div className="explorer-message">Select a region and product type to discover NISAR observations.</div>}
        {observations.map((item, index) => {
          const id = item.file_id || item.scene_name || String(index);
          const url = browseUrl(item);
          return <div className={`observation-card ${selected === id ? "selected" : ""}`} key={id}>
            <div className="observation-info"><Satellite size={22}/><div><strong>{item.scene_name || "NISAR Observation"}</strong><small>Product: {item.product}</small><small><Calendar size={12}/> {item.start_time || "Date unavailable"}</small><small>Orbit: {item.orbit ?? "Not available"}</small></div></div>
            <button className="select-observation" onClick={() => {
              const next = selected === id ? null : id;
              setSelected(next);
              onObservationSelect?.(next ? url : null);
            }}><Eye size={14}/> {selected === id ? "Selected" : "Inspect"}</button>
            {selected === id && <div className="observation-details">
              <p><strong>Product ID:</strong> {item.file_id || "Unavailable"}</p>
              <p><strong>Acquisition end:</strong> {item.stop_time || "Unavailable"}</p>
              <p><strong>Frame:</strong> {item.frame ?? "Unavailable"}</p>
              <p><strong>Browse image:</strong> {url ? "Available — selected for map preview" : "Not supplied by catalog"}</p>
              <p><strong>HDF5 product:</strong> {item.download_url ? "Available for download" : "Unavailable"}</p>
            </div>}
          </div>;
        })}
      </div>
    </div>
  );
}
