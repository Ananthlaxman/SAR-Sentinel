
const API_URL = "http://127.0.0.1:8000";

export interface NisarObservation {
  scene_name: string | null;
  file_id: string | null;
  product: string;
  start_time: string | null;
  stop_time: string | null;
  orbit: number | null;
  frame: number | null;
  download_url: string | null;
  browse_url: string | null;
}

export interface NisarSearchResponse {
  region: string;
  product: string;
  total_results: number;
  observations: NisarObservation[];
}

export interface DownloadJob {
  job_id: string;
  status: "queued" | "downloading" | "completed" | "failed";
  progress: number | null;
  downloaded_bytes: number;
  total_bytes: number;
  result: unknown;
  error: string | null;
}

export interface DownloadStartResponse {
  message: string;
  job_id: string;
  status: string;
  status_url: string;
}

export async function searchNisar(
  region: string,
  product: string,
  limit = 20
): Promise<NisarSearchResponse> {
  const params = new URLSearchParams({
    region,
    product,
    limit: String(limit),
  });

  const response = await fetch(
    `${API_URL}/api/nisar/search?${params}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "NISAR search failed");
  }

  return response.json();
}

export async function startNisarDownload(
  downloadUrl: string
): Promise<DownloadStartResponse> {
  const params = new URLSearchParams({
    download_url: downloadUrl,
  });

  const response = await fetch(
    `${API_URL}/api/nisar/download-jobs?${params}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Unable to start download");
  }

  return response.json();
}

export async function getDownloadStatus(
  jobId: string
): Promise<DownloadJob> {
  const response = await fetch(
    `${API_URL}/api/nisar/download-jobs/${encodeURIComponent(jobId)}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Unable to retrieve download status");
  }

  return response.json();
}
