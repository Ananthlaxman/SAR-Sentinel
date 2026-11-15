import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./MapView.css";

interface MapViewProps {
  region: string;
  coordinates?: [number, number];
  browseImageUrl?: string | null;
}

const locations: Record<string, [number, number]> = {
  "Tamil Nadu, India": [11.1271, 78.6569],
  "Kerala, India": [10.8505, 76.2711],
  "Assam, India": [26.2006, 92.9376],
  "Uttarakhand, India": [30.0668, 79.0193]
};

const markerIcon = L.divIcon({
  className: "sar-map-marker",
  html: '<div class="marker-pulse"><div class="marker-core"></div></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function MapView({ region, coordinates, browseImageUrl }: MapViewProps) {
  const position = coordinates || locations[region] || locations["Tamil Nadu, India"];
  const [showPreview, setShowPreview] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageEndpoint = browseImageUrl
    ? `http://127.0.0.1:8000/api/nisar/browse-image?image_url=${encodeURIComponent(browseImageUrl)}`
    : null;

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [browseImageUrl]);

  return <div className="sar-map-wrapper">
    <MapContainer key={`${region}-${position.join(",")}`} center={position} zoom={6} scrollWheelZoom zoomControl={false} className="sar-leaflet-map">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
      <ZoomControl position="topright"/>
      <Marker position={position} icon={markerIcon}><Popup><strong>{region}</strong><br/>Selected study area<br/>Coordinates: {position[0].toFixed(4)}, {position[1].toFixed(4)}</Popup></Marker>
    </MapContainer>
    <button className="nisar-preview-toggle" onClick={() => setShowPreview(v => !v)}>{showPreview ? "Hide NISAR Preview" : "Show NISAR Preview"}</button>
    {showPreview && <div className="nisar-preview-panel">
      <div className="nisar-preview-header"><strong>NISAR SAR Preview</strong><button onClick={() => setShowPreview(false)} aria-label="Close preview">×</button></div>
      {!browseImageUrl && <p>Open SAR Explorer and inspect an observation to load its browse image.</p>}
      {browseImageUrl && !imageLoaded && !imageError && <p>Loading NISAR image...</p>}
      {imageError && <p>Unable to load image. Check the FastAPI connection and credentials.</p>}
      {imageEndpoint && <img src={imageEndpoint} alt="NISAR LATLON browse image" onLoad={() => setImageLoaded(true)} onError={() => setImageError(true)} style={{ display: imageLoaded && !imageError ? "block" : "none" }}/>}
      <small>NASA–ISRO NISAR · Browse preview (not a georeferenced map overlay)</small>
    </div>}
  </div>;
}
