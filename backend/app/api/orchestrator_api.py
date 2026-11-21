"""
Orchestrator API Router - Section 5 Public Contract.
Runs the generation DAG pipeline for a House Twin.
"""
import logging

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from typing import Optional
from fastapi import Depends
from backend.app.services.access import require_edit
from backend.app.services.orchestrator import OrchestrationDAG
from backend.app.services.repository import HouseTwinRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Orchestrator Pipeline"])


@router.post("/house/{house_id}/generate", response_model=Dict[str, Any])
def generate_house(house_id: str, _user: Optional[str] = Depends(require_edit)):
    """
    Triggers end-to-end DAG generation:
    Plot -> Layout + Structure -> Judge Stage Gate -> MEP -> Finishes -> Budget.
    """
    twin = HouseTwinRepository.get(house_id)
    if not twin:
        raise HTTPException(status_code=404, detail=f"House '{house_id}' not found.")

    try:
        result = OrchestrationDAG.run_pipeline(house_id)
        return {
            "success": True,
            "house_id": house_id,
            "status": result["status"],
            "execution_trace": result["execution_trace"],
            "judge_summary": result["judge_summary"]
        }
    except Exception:
        logger.exception("Generation failed for house %s", house_id)
        raise HTTPException(status_code=500, detail="Generation failed. Please try again.")


@router.get("/orchestrator/health")
def health_check():
    return {"status": "healthy", "service": "orchestrator_dag", "version": "1.0"}
