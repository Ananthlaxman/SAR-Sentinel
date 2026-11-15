
import os
import re
import time
import threading

from pathlib import Path
from urllib.parse import urlparse, unquote

import asf_search as asf
import h5py


# ==================================================
# CONFIGURATION
# ==================================================

REGIONS = {
    "Tamil Nadu, India": (78.6569, 11.1271),
    "Kerala, India": (76.2711, 10.8505),
    "Assam, India": (92.9376, 26.2006),
    "Uttarakhand, India": (79.0193, 30.0668),
}

ALLOWED_PRODUCTS = {
    "GCOV", "GSLC", "RSLC", "RIFG", "RUNW"
}

DOWNLOAD_DIR = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "downloads"
)

DOWNLOAD_LOCK = threading.Lock()

CHUNK_SIZE = 1024 * 1024
MAX_RETRIES = 3


# ==================================================
# EARTHDATA AUTHENTICATION
# ==================================================

def get_asf_session():

    username = os.getenv("EARTHDATA_USERNAME")
    password = os.getenv("EARTHDATA_PASSWORD")

    if not username or not password:
        raise RuntimeError(
            "Earthdata credentials are missing. "
            "Set EARTHDATA_USERNAME and EARTHDATA_PASSWORD."
        )

    try:
        session = asf.ASFSession().auth_with_creds(
            username,
            password
        )

        print("ASF authentication successful.")
        return session

    except Exception as exc:
        raise RuntimeError(
            "Earthdata authentication failed."
        ) from exc


# ==================================================
# BROWSE URL NORMALIZATION
# ==================================================

def normalize_browse_urls(browse):

    if isinstance(browse, str):
        candidates = [browse]
    elif isinstance(browse, list):
        candidates = browse
    else:
        candidates = []

    return [
        url for url in candidates
        if isinstance(url, str)
        and url.startswith("https://")
    ]


# ==================================================
# NISAR SEARCH
# ==================================================

def search_nisar(
    region: str,
    product: str = "GCOV",
    limit: int = 20
):

    if region not in REGIONS:
        raise ValueError("Unsupported region")

    product = product.upper()

    if product not in ALLOWED_PRODUCTS:
        raise ValueError("Unsupported NISAR product")

    if not isinstance(limit, int) or limit < 1:
        raise ValueError("Limit must be positive")

    lon, lat = REGIONS[region]
    point_wkt = f"POINT({lon} {lat})"

    results = asf.search(
        dataset="NISAR",
        processingLevel=product,
        intersectsWith=point_wkt,
        maxResults=limit,
    )

    geojson = results.geojson()
    observations = []

    for feature in geojson.get("features", []):

        props = feature.get("properties", {})

        observation = {
            "scene_name": props.get("sceneName"),
            "file_id": props.get("fileID"),
            "product": props.get("processingLevel", product),
            "start_time": props.get("startTime"),
            "stop_time": props.get("stopTime"),
            "orbit": props.get("pathNumber"),
            "frame": props.get("frameNumber"),
            "download_url": props.get("url"),
            "browse_url": normalize_browse_urls(
                props.get("browse")
            ),
            "geometry": feature.get("geometry"),
        }

        observations.append(observation)

    return {
        "region": region,
        "product": product,
        "total_results": len(observations),
        "observations": observations,
    }


# ==================================================
# BROWSE IMAGE URL VALIDATION
# ==================================================

def validate_browse_url(image_url: str):

    if not isinstance(image_url, str):
        raise ValueError("Invalid browse image URL")

    parsed = urlparse(image_url)

    if (
        parsed.scheme != "https"
        or parsed.hostname != "nisar.asf.earthdatacloud.nasa.gov"
        or parsed.port is not None
        or parsed.username is not None
        or parsed.password is not None
        or not parsed.path.startswith("/BROWSE/")
        or not parsed.path.lower().endswith(".png")
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("Invalid NISAR browse URL")

    return parsed


# ==================================================
# OPEN BROWSE IMAGE
# ==================================================

def open_nisar_browse_image(image_url: str):

    validate_browse_url(image_url)

    session = get_asf_session()

    response = session.get(
        image_url,
        stream=True,
        timeout=(30, 60),
    )

    try:
        response.raise_for_status()

        content_type = response.headers.get(
            "Content-Type", ""
        ).lower()

        if "text/html" in content_type:
            raise RuntimeError(
                "ASF returned an HTML login page."
            )

        return response

    except Exception:
        response.close()
        raise


# ==================================================
# DOWNLOAD URL VALIDATION
# ==================================================

def validate_download_url(download_url: str):

    if not isinstance(download_url, str):
        raise ValueError("Invalid NISAR download URL")

    parsed = urlparse(download_url)

    if (
        parsed.scheme != "https"
        or parsed.hostname != "nisar.asf.earthdatacloud.nasa.gov"
        or parsed.port is not None
        or parsed.username is not None
        or parsed.password is not None
        or not parsed.path.lower().endswith(".h5")
        or parsed.query
        or parsed.fragment
    ):
        raise ValueError("Invalid NISAR download URL")

    filename = unquote(Path(parsed.path).name)

    if not filename or filename in {".", ".."}:
        raise ValueError("Invalid product filename")

    return filename


# ==================================================
# HDF5 VALIDATION
# ==================================================

def validate_hdf5_file(file_path: Path):

    if not file_path.exists() or file_path.stat().st_size == 0:
        raise RuntimeError("Downloaded file is empty.")

    try:
        with h5py.File(file_path, "r") as hdf:
            groups = list(hdf.keys())

            if not groups:
                raise RuntimeError(
                    "HDF5 file contains no top-level groups."
                )

            return groups

    except Exception as exc:
        raise RuntimeError(
            f"HDF5 validation failed: {exc}"
        ) from exc


# ==================================================
# DOWNLOAD NISAR HDF5 WITH RESUME AND RETRIES
# ==================================================

def download_nisar(
    download_url: str,
    progress_callback=None,
    max_retries: int = MAX_RETRIES,
):
    """
    Download an ASF NISAR HDF5 product.

    Supports:
    - Resume using HTTP Range when supported.
    - Automatic retries.
    - Download progress callback.
    - Content-Length verification.
    - HDF5 validation.

    progress_callback(downloaded_bytes, total_bytes)
    """

    filename = validate_download_url(download_url)

    DOWNLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    destination = DOWNLOAD_DIR / filename
    temporary_file = DOWNLOAD_DIR / f"{filename}.part"

    with DOWNLOAD_LOCK:

        if destination.exists():

            validate_hdf5_file(destination)

            return {
                "status": "already_downloaded",
                "filename": filename,
                "saved_path": str(destination),
                "size_bytes": destination.stat().st_size,
            }

        session = get_asf_session()
        expected_total = None

        for attempt in range(1, max_retries + 1):

            downloaded = (
                temporary_file.stat().st_size
                if temporary_file.exists()
                else 0
            )

            headers = {}

            if downloaded > 0:
                headers["Range"] = f"bytes={downloaded}-"

            print(
                f"Download attempt {attempt}/{max_retries}; "
                f"existing bytes: {downloaded}"
            )

            try:

                with session.get(
                    download_url,
                    headers=headers,
                    stream=True,
                    timeout=(30, 180),
                ) as response:

                    if response.status_code == 416:
                        raise RuntimeError(
                            "ASF rejected the resume range. "
                            "The partial file needs to be restarted."
                        )

                    response.raise_for_status()

                    content_type = response.headers.get(
                        "Content-Type", ""
                    ).lower()

                    if "text/html" in content_type:
                        raise RuntimeError(
                            "ASF returned HTML instead of HDF5 data."
                        )

                    content_range = response.headers.get(
                        "Content-Range", ""
                    )

                    if downloaded > 0 and response.status_code == 206:

                        match = re.fullmatch(
                            r"bytes\s+(\d+)-(\d+)/(\d+|\*)",
                            content_range.strip(),
                            re.IGNORECASE,
                        )

                        if not match or int(match.group(1)) != downloaded:
                            raise RuntimeError(
                                "Invalid Content-Range response."
                            )

                        if match.group(3) != "*":
                            expected_total = int(match.group(3))

                        write_mode = "ab"

                    else:
                        # Server did not honor Range.
                        # Restart safely from the beginning.
                        downloaded = 0
                        expected_total = None
                        write_mode = "wb"

                        if response.headers.get("Content-Length"):
                            expected_total = int(
                                response.headers["Content-Length"]
                            )

                    if (
                        response.status_code == 206
                        and expected_total is None
                    ):
                        if content_range:
                            match = re.fullmatch(
                                r"bytes\s+\d+-\d+/(\d+)",
                                content_range.strip(),
                                re.IGNORECASE,
                            )
                            if match:
                                expected_total = int(match.group(1))

                    if (
                        expected_total is None
                        and response.headers.get("Content-Length")
                    ):
                        remaining = int(
                            response.headers["Content-Length"]
                        )
                        expected_total = downloaded + remaining

                    with open(temporary_file, write_mode) as output:

                        for chunk in response.iter_content(
                            chunk_size=CHUNK_SIZE
                        ):

                            if not chunk:
                                continue

                            output.write(chunk)
                            downloaded += len(chunk)

                            if progress_callback:
                                progress_callback(
                                    downloaded,
                                    expected_total or 0
                                )

                        output.flush()
                        os.fsync(output.fileno())

                actual_size = temporary_file.stat().st_size

                if (
                    expected_total is not None
                    and actual_size != expected_total
                ):
                    raise RuntimeError(
                        f"Incomplete download: received "
                        f"{actual_size} of {expected_total} bytes."
                    )

                # Only finalize after HDF5 validation.
                groups = validate_hdf5_file(temporary_file)

                temporary_file.replace(destination)

                return {
                    "status": "downloaded",
                    "filename": filename,
                    "saved_path": str(destination),
                    "size_bytes": destination.stat().st_size,
                    "hdf5_groups": groups,
                }

            except Exception as exc:

                print(
                    f"Download attempt {attempt} failed: "
                    f"{type(exc).__name__}: {exc}"
                )

                if attempt == max_retries:
                    raise RuntimeError(
                        "NISAR download failed after "
                        f"{max_retries} attempts: {exc}"
                    ) from exc

                time.sleep(min(2 ** attempt, 15))

        raise RuntimeError("NISAR download failed.")
