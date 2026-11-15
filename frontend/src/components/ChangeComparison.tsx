
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

import {
  MoveHorizontal,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import "./ChangeComparison.css";

interface ChangeComparisonProps {
  beforeUrl: string | null;
  afterUrl: string | null;
  beforeDate?: string;
  afterDate?: string;
}

const API = "http://127.0.0.1:8000";

// Convert ASF browse URL into authenticated backend image URL.
function getImageEndpoint(url: string): string {
  return `${API}/api/nisar/browse-image?image_url=${encodeURIComponent(url)}`;
}

export default function ChangeComparison({
  beforeUrl,
  afterUrl,
  beforeDate = "Historical observation",
  afterDate = "Latest observation",
}: ChangeComparisonProps) {
  const [position, setPosition] = useState(50);

  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);

  const [beforeError, setBeforeError] = useState(false);
  const [afterError, setAfterError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Reset image states whenever observations change.
  useEffect(() => {
    setPosition(50);
    setBeforeLoaded(false);
    setAfterLoaded(false);
    setBeforeError(false);
    setAfterError(false);
  }, [beforeUrl, afterUrl]);

  // Calculate slider position.
  function updatePosition(clientX: number) {
    const container = containerRef.current;

    if (!container) return;

    const bounds = container.getBoundingClientRect();

    if (bounds.width <= 0) return;

    const nextPosition =
      ((clientX - bounds.left) / bounds.width) * 100;

    setPosition(
      Math.min(100, Math.max(0, nextPosition))
    );
  }

  // Start dragging.
  function handlePointerDown(
    event: PointerEvent<HTMLDivElement>
  ) {
    dragging.current = true;

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

    updatePosition(event.clientX);
  }

  // Move divider.
  function handlePointerMove(
    event: PointerEvent<HTMLDivElement>
  ) {
    if (!dragging.current) return;

    updatePosition(event.clientX);
  }

  // Stop dragging.
  function handlePointerUp(
    event: PointerEvent<HTMLDivElement>
  ) {
    dragging.current = false;

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId
      );
    }
  }

  // Stop dragging if pointer interaction is cancelled.
  function handlePointerCancel() {
    dragging.current = false;
  }

  if (!beforeUrl || !afterUrl) {
    return (
      <div className="comparison-empty">
        <AlertCircle size={30} />

        <h3>Two observations are required</h3>

        <p>
          Select one historical NISAR observation and
          one newer observation covering the same
          study area.
        </p>
      </div>
    );
  }

  const beforeImage = getImageEndpoint(beforeUrl);
  const afterImage = getImageEndpoint(afterUrl);

  return (
    <section className="comparison-section">

      {/* DATE LABELS */}

      <div className="comparison-labels">

        <div className="comparison-label before-label">
          <span>BEFORE</span>
          <strong>{beforeDate}</strong>
        </div>

        <div className="comparison-label after-label">
          <span>AFTER</span>
          <strong>{afterDate}</strong>
        </div>

      </div>

      {/* IMAGE COMPARISON */}

      <div
        className="comparison-view"
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >

        {/* HISTORICAL IMAGE */}

        <div className="comparison-image-layer">

          <img
            src={beforeImage}
            alt="Historical NISAR satellite observation"
            draggable={false}
            onLoad={() => setBeforeLoaded(true)}
            onError={() => setBeforeError(true)}
          />

          {!beforeLoaded && !beforeError && (
            <div className="comparison-loading">
              <RefreshCw className="comparison-spinner" />
              Loading historical image...
            </div>
          )}

          {beforeError && (
            <div className="comparison-image-error">
              <AlertCircle size={20} />
              Historical image unavailable
            </div>
          )}

        </div>

        {/* LATEST IMAGE */}

        <div
          className="comparison-after-layer"
          style={{
            clipPath: `inset(0 0 0 ${position}%)`,
          }}
        >

          <img
            src={afterImage}
            alt="Latest NISAR satellite observation"
            draggable={false}
            onLoad={() => setAfterLoaded(true)}
            onError={() => setAfterError(true)}
          />

          {!afterLoaded && !afterError && (
            <div className="comparison-loading">
              <RefreshCw className="comparison-spinner" />
              Loading latest image...
            </div>
          )}

          {afterError && (
            <div className="comparison-image-error">
              <AlertCircle size={20} />
              Latest image unavailable
            </div>
          )}

        </div>

        {/* DRAGGABLE DIVIDER */}

        <div
          className="comparison-divider"
          style={{
            left: `${position}%`,
          }}
        >

          <div className="comparison-handle">
            <MoveHorizontal size={20} />
          </div>

        </div>

      </div>

      {/* COMPARISON FOOTER */}

      <div className="comparison-footer">

        <span>← Historical observation</span>

        <strong>
          Drag the divider to compare
        </strong>

        <span>Latest observation →</span>

      </div>

      {/* SCIENTIFIC DISCLAIMER */}

      <div className="comparison-note">
        Visual comparison of NISAR browse images only.
        Quantitative surface change detection requires
        processed and spatially aligned SAR datasets.
      </div>

    </section>
  );
}
