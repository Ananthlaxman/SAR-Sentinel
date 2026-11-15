
import { useEffect, useState } from "react";

import {
  Activity,
  ArrowUpRight,
  Bell,
  Database,
  Globe2,
  LayoutDashboard,
  Layers,
  Menu,
  Radio,
  Satellite,
  Settings,
  ShieldCheck,
  Waves,
  Cloud,
} from "lucide-react";

import GlobeExplorer, {
  type PlaceSelection,
} from "./components/GlobeExplorer";

import NisarExplorer from "./components/NisarExplorer";
import DataSources from "./components/DataSources";
import ChangeDetection from "./components/ChangeDetection";
import MapView from "./components/MapView";

import "./App.css";

const API = "http://127.0.0.1:8000";

const initialPlace: PlaceSelection = {
  label: "Tamil Nadu, India",
  country: "India",
  state: "Tamil Nadu",
  lat: 11.1271,
  lng: 78.6569,
};

function App() {
  const [backend, setBackend] = useState("Checking");

  const [activeTab, setActiveTab] = useState("Overview");

  const [place, setPlace] =
    useState<PlaceSelection>(initialPlace);

  const [menuOpen, setMenuOpen] = useState(true);

  const [selectedBrowseUrl, setSelectedBrowseUrl] =
    useState<string | null>(null);

  // ============================================
  // BACKEND HEALTH CHECK
  // ============================================

  useEffect(() => {
    let mounted = true;

    const checkBackend = async () => {
      try {
        const response = await fetch(`${API}/health`);

        if (!response.ok) {
          throw new Error("Backend unavailable");
        }

        if (mounted) {
          setBackend("Online");
        }
      } catch {
        if (mounted) {
          setBackend("Offline");
        }
      }
    };

    checkBackend();

    const interval = window.setInterval(
      checkBackend,
      10000
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  // ============================================
  // SIDEBAR NAVIGATION
  // ============================================

  const navigation = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "SAR Explorer", icon: Satellite },
    { name: "Change Detection", icon: Activity },
    { name: "Data Sources", icon: Database },
    { name: "Reports", icon: Layers },
  ];

  // ============================================
  // PAGE CONTENT
  // ============================================

  function renderPage() {

    // ------------------------------------------
    // DATA SOURCES
    // ------------------------------------------

    if (activeTab === "Data Sources") {
      return <DataSources />;
    }

    // ------------------------------------------
    // SAR EXPLORER
    // ------------------------------------------

    if (activeTab === "SAR Explorer") {
      return (
        <NisarExplorer
          initialRegion={place.label}
          onObservationSelect={(url) => {
            setSelectedBrowseUrl(url);

            // Return to Overview when an observation
            // is inspected so its preview appears on the map.
            if (url) {
              setActiveTab("Overview");
            }
          }}
        />
      );
    }

    // ------------------------------------------
    // CHANGE DETECTION
    // ------------------------------------------

    if (activeTab === "Change Detection") {
      return <ChangeDetection />;
    }

    // ------------------------------------------
    // REPORTS
    // ------------------------------------------

    if (activeTab === "Reports") {
      return (
        <section className="placeholder-page panel">

          <div className="eyebrow">
            <span className="live-dot" />
            SAR-SENTINEL REPORTING
          </div>

          <h1>Reports</h1>

          <p>
            Generate scientific reports using verified
            NISAR observations and completed change
            detection results.
          </p>

          <div className="analysis-empty">

            <div className="empty-icon">
              <Layers size={35} />
            </div>

            <h3>No Analysis Reports Yet</h3>

            <p>
              Reports will become available after
              a valid SAR processing and change
              detection workflow is completed.
            </p>

          </div>

          <button
            className="primary-button"
            onClick={() => setActiveTab("Change Detection")}
          >
            Open Change Detection
            <ArrowUpRight size={17} />
          </button>

        </section>
      );
    }

    // ------------------------------------------
    // OVERVIEW
    // ------------------------------------------

    return (
      <>

        <section className="welcome-row">

          <div>
            <div className="eyebrow">
              <span className="live-dot" />
              EARTH OBSERVATION PLATFORM
            </div>

            <h1>
              Earth Intelligence{" "}
              <span>Dashboard</span>
            </h1>

            <p>
              Explore our planet and investigate
              surface changes using NASA–ISRO
              NISAR radar observations.
            </p>
          </div>

          <div className="date-tag">
            <Satellite size={17} />
            NISAR MISSION
          </div>

        </section>

        {/* DASHBOARD STATISTICS */}

        <section className="stat-grid">

          <div className="stat-card">

            <div className="stat-top">
              <span>DATA SOURCE</span>
              <Satellite size={20} />
            </div>

            <h2>NISAR</h2>

            <p>NASA × ISRO Mission</p>

            <div className="stat-footer">
              SAR OBSERVATION
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-top">
              <span>ANALYSIS ENGINE</span>
              <Activity size={20} />
            </div>

            <h2>READY</h2>

            <p>Processing pipeline pending</p>

            <div className="stat-footer">
              PYTHON ENGINE
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-top">
              <span>BACKEND STATUS</span>
              <Radio size={20} />
            </div>

            <h2
              className={
                backend === "Online"
                  ? "success-text"
                  : "error-text"
              }
            >
              {backend.toUpperCase()}
            </h2>

            <p>FastAPI connection</p>

            <div className="stat-footer">
              SYSTEM MONITOR
            </div>

          </div>

          <div className="stat-card">

            <div className="stat-top">
              <span>STUDY AREA</span>
              <Globe2 size={20} />
            </div>

            <h2>GLOBAL</h2>

            <p>{place.label}</p>

            <div className="stat-footer">
              GEOGRAPHIC EXPLORATION
            </div>

          </div>

        </section>

        {/* GLOBAL GLOBE */}

        <GlobeExplorer
          selected={place}
          onSelect={setPlace}
        />

        {/* MAP AND CHANGE ANALYSIS */}

        <section className="content-grid secondary-grid">

          <div className="panel map-panel">

            <div className="panel-header">

              <div>
                <h3>
                  <Globe2 size={19} />
                  Selected study area
                </h3>

                <p>
                  {place.label} ·{" "}
                  {place.lat.toFixed(4)},{" "}
                  {place.lng.toFixed(4)}
                </p>
              </div>

              <span className="panel-tag">
                2D MAP
              </span>

            </div>

            <div className="map-container">

              <MapView
                region={place.label}
                coordinates={[
                  place.lat,
                  place.lng,
                ]}
                browseImageUrl={selectedBrowseUrl}
              />

            </div>

          </div>

          <div className="panel analysis-panel">

            <div className="panel-header">

              <div>
                <h3>
                  <Activity size={19} />
                  Change Analysis
                </h3>

                <p>
                  Surface change monitoring
                </p>
              </div>

              <Activity
                size={19}
                className="cyan-icon"
              />

            </div>

            <div className="analysis-empty">

              <div className="empty-icon">
                <Waves size={35} />
              </div>

              <h3>Awaiting SAR Data</h3>

              <p>
                Search for compatible NISAR
                acquisitions to begin surface
                change analysis.
              </p>

            </div>

            <button
              className="primary-button"
              onClick={() =>
                setActiveTab("Change Detection")
              }
            >
              Open Change Detection
              <ArrowUpRight size={17} />
            </button>

          </div>

        </section>

        {/* DATA SOURCES AND SYSTEM INFORMATION */}

        <section className="bottom-grid">

          <div className="panel">

            <div className="panel-header">

              <div>
                <h3>
                  <Database size={19} />
                  Data Sources
                </h3>

                <p>Satellite data integration</p>
              </div>

            </div>

            <div className="source-row">

              <div className="source-icon">
                <Satellite />
              </div>

              <div>
                <strong>NISAR L-band</strong>

                <small>
                  NASA / ISRO · Primary source
                </small>
              </div>

              <span className="source-status">
                CONNECTED
              </span>

            </div>

            <div className="source-row">

              <div className="source-icon">
                <Cloud />
              </div>

              <div>
                <strong>Supporting datasets</strong>
                <small>Elevation / Rainfall</small>
              </div>

              <span className="source-status">
                PLANNED
              </span>

            </div>

            <button
              className="primary-button"
              onClick={() =>
                setActiveTab("Data Sources")
              }
            >
              Manage Data Sources
              <ArrowUpRight size={16} />
            </button>

          </div>

          <div className="panel system-panel">

            <div className="panel-header">

              <div>
                <h3>
                  <ShieldCheck size={19} />
                  System Information
                </h3>

                <p>Application services</p>
              </div>

            </div>

            <div className="system-row">
              <span>Frontend</span>
              <strong>Online</strong>
            </div>

            <div className="system-row">

              <span>FastAPI Backend</span>

              <strong
                className={
                  backend === "Online"
                    ? "success-text"
                    : "error-text"
                }
              >
                {backend}
              </strong>

            </div>

            <div className="system-row">
              <span>SAR Processing</span>
              <strong>Not configured</strong>
            </div>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="footer">
          <span>© 2026 ALPHA6GEN</span>
          <span>NASA SPACE APPS CHALLENGE 2026</span>
          <span>EXPLORE · ANALYZE · INNOVATE</span>
        </footer>

      </>
    );
  }

  // ============================================
  // MAIN APPLICATION
  // ============================================

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          menuOpen ? "" : "collapsed"
        }`}
      >

        <div className="brand">

          <div className="brand-icon">
            <Satellite size={26} />
          </div>

          {menuOpen && (
            <div>
              <h2>
                SAR<span>-SENTINEL</span>
              </h2>

              <small>EARTH INTELLIGENCE</small>
            </div>
          )}

        </div>

        {menuOpen && (
          <div className="nav-label">
            WORKSPACE
          </div>
        )}

        {navigation.map((item) => {

          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`nav-item ${
                activeTab === item.name
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveTab(item.name)
              }
              title={item.name}
            >
              <Icon size={19} />

              {menuOpen && (
                <span>{item.name}</span>
              )}

            </button>
          );
        })}

        <div className="sidebar-bottom">

          <button className="nav-item">
            <Settings size={19} />

            {menuOpen && (
              <span>Settings</span>
            )}
          </button>

          {menuOpen && (
            <div className="team-card">

              <div className="team-logo">
                A6
              </div>

              <div>
                <strong>ALPHA6GEN</strong>
                <small>NASA SPACE APPS 2026</small>
              </div>

            </div>
          )}

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">

          <button
            className="icon-button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-label="Toggle sidebar"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            Workspace
            <span>/</span>
            {activeTab}
          </div>

          <div className="topbar-right">

            <div className="connection">

              <span
                className={`status-dot ${
                  backend === "Online"
                    ? "online"
                    : "offline"
                }`}
              />

              API {backend}

            </div>

            <button
              className="icon-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
            </button>

            <div className="avatar">
              A6
            </div>

          </div>

        </header>

        {/* ACTIVE PAGE */}

        <div className="page-content">
          {renderPage()}
        </div>

      </main>

    </div>
  );
}

export default App;
