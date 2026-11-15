
from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    BackgroundTasks,
)
from fastapi.responses import StreamingResponse

from uuid import uuid4
from threading import Lock

from app.services.nisar_service import (
    search_nisar,
    download_nisar,
    open_nisar_browse_image,
)


# ==================================================
# ROUTER CONFIGURATION
# ==================================================

router = APIRouter(
    prefix="/api/nisar",
    tags=["NISAR Data"],
)


# ==================================================
# DOWNLOAD JOB STORAGE
# ==================================================

# Temporary in-memory storage.
# Jobs disappear when the backend restarts.

download_jobs = {}

jobs_lock = Lock()


# ==================================================
# NISAR SEARCH ENDPOINT
# ==================================================

@router.get("/search")
def search_data(
    region: str = Query(
        "Tamil Nadu, India",
        description="Geographic search region",
    ),
    product: str = Query(
        "GCOV",
        description="NISAR product type",
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
    ),
):
    try:
        return search_nisar(
            region=region,
            product=product,
            limit=limit,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"ASF NISAR search failed: {str(error)}",
        )


# ==================================================
# NISAR BROWSE IMAGE ENDPOINT
# ==================================================

@router.get("/browse-image")
def get_browse_image(
    image_url: str = Query(
        ...,
        description="Official ASF NISAR LATLON PNG URL",
    ),
):
    try:
        response = open_nisar_browse_image(image_url)

        def image_stream():
            try:
                for chunk in response.iter_content(
                    chunk_size=64 * 1024,
                ):
                    if chunk:
                        yield chunk
            finally:
                response.close()

        return StreamingResponse(
            image_stream(),
            media_type="image/png",
            headers={
                "Cache-Control": "private, max-age=3600",
                "X-Content-Type-Options": "nosniff",
            },
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=401,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Browse image retrieval failed: {str(error)}",
        )


# ==================================================
# DOWNLOAD PROGRESS CALLBACK
# ==================================================

def update_download_progress(
    job_id: str,
    downloaded_bytes: int,
    total_bytes: int,
):
    """
    Update live download progress in job storage.
    """

    with jobs_lock:

        job = download_jobs.get(job_id)

        if job is None:
            return

        job["downloaded_bytes"] = downloaded_bytes
        job["total_bytes"] = total_bytes

        if total_bytes > 0:
            progress = (
                downloaded_bytes / total_bytes
            ) * 100

            job["progress"] = round(
                min(progress, 100),
                2,
            )
        else:
            # Total size is not always provided by ASF.
            job["progress"] = None


# ==================================================
# BACKGROUND DOWNLOAD WORKER
# ==================================================

def run_download_job(
    job_id: str,
    download_url: str,
):
    """
    Execute an HDF5 download in the background.
    """

    with jobs_lock:

        if job_id not in download_jobs:
            return

        download_jobs[job_id]["status"] = "downloading"

    try:

        # Pass the progress callback into the service.
        result = download_nisar(
            download_url,
            progress_callback=lambda downloaded, total: (
                update_download_progress(
                    job_id,
                    downloaded,
                    total,
                )
            ),
        )

        with jobs_lock:

            if job_id in download_jobs:

                download_jobs[job_id].update({
                    "status": "completed",
                    "progress": 100,
                    "result": result,
                    "error": None,
                })

    except Exception as error:

        with jobs_lock:

            if job_id in download_jobs:

                download_jobs[job_id].update({
                    "status": "failed",
                    "error": str(error),
                })


# ==================================================
# START DOWNLOAD JOB
# ==================================================

@router.post(
    "/download-jobs",
    status_code=202,
)
def start_download(
    background_tasks: BackgroundTasks,
    download_url: str = Query(
        ...,
        description="Official ASF NISAR HDF5 download URL",
    ),
):
    """
    Start an asynchronous NISAR HDF5 download.
    """

    job_id = str(uuid4())

    with jobs_lock:

        download_jobs[job_id] = {
            "job_id": job_id,
            "status": "queued",
            "progress": 0,
            "downloaded_bytes": 0,
            "total_bytes": 0,
            "result": None,
            "error": None,
        }

    background_tasks.add_task(
        run_download_job,
        job_id,
        download_url,
    )

    return {
        "message": "NISAR download job started",
        "job_id": job_id,
        "status": "queued",
        "status_url": f"/api/nisar/download-jobs/{job_id}",
    }


# ==================================================
# GET DOWNLOAD STATUS
# ==================================================

@router.get("/download-jobs/{job_id}")
def get_download_status(
    job_id: str,
):
    """
    Get the current status and progress of a download.
    """

    with jobs_lock:

        job = download_jobs.get(job_id)

        if job is None:
            raise HTTPException(
                status_code=404,
                detail="Download job not found",
            )

        return job.copy()
