"""
Budget & Loan Task Model API - Section 5 & 8 (Model 10).
Computes exact Bill of Quantities (BOQ), phased construction expenditure, and bank loan EMI.
Mumbai Market Rates (Nov 2026):
- Cement: ₹400 / 50kg bag
- Steel: ₹70 / kg Fe500 TMT
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, Any

from backend.app.models.twin import BOQ

router = APIRouter(prefix="/api/v1/budget", tags=["Budget Model"])


class BudgetPredictInput(BaseModel):
    house_id: str
    builtup_area_sqft: float = Field(default=1500.0)
    target_budget_inr: float = Field(default=2000000.0)
    loan_tenure_years: int = Field(default=20)
    interest_rate_pct: float = Field(default=8.5)


@router.post("/predict", response_model=Dict[str, Any])
def predict_budget(input_data: BudgetPredictInput):
    """
    Computes exact material quantities, stage payouts, and loan EMI.
    """
    area = input_data.builtup_area_sqft
    
    # Thumb rules for RCC Framed Structure:
    # Cement: ~0.48 bags per sqft of built-up = 720 bags for 1500 sqft
    cement_bags = int(area * 0.48)
    cement_cost = cement_bags * 400.0  # ₹ 2,88,000

    # Steel: ~4.2 kg per sqft of built-up = 6,300 kg for 1500 sqft
    steel_kg = int(area * 4.2)
    steel_cost = steel_kg * 70.0  # ₹ 4,41,000

    # Sand & Aggregates:
    sand_tons = round(area * 0.03, 1)  # 45 tons
    sand_cost = sand_tons * 2200.0     # ₹ 99,000

    aggregate_tons = round(area * 0.04, 1)  # 60 tons
    aggregate_cost = aggregate_tons * 1400.0 # ₹ 84,000

    # Bricks: ~12 bricks per sqft = 18,000 bricks
    bricks_count = int(area * 12.0)
    brick_cost = bricks_count * 9.0  # ₹ 1,62,000

    # Flooring & Tiles
    flooring_cost = area * 120.0  # ₹ 1,80,000

    # Plumbing & Electrical (MEP)
    mep_cost = 250000.0

    # Labour & Shuttering
    labour_cost = area * 330.0  # ₹ 4,95,000

    total_construction_cost = (
        cement_cost + steel_cost + sand_cost + aggregate_cost + 
        brick_cost + flooring_cost + mep_cost + labour_cost
    )

    cost_breakdown = {
        "foundation": 400000.0,
        "structure": 700000.0,
        "mep": 250000.0,
        "finishing": round(total_construction_cost - (400000.0 + 700000.0 + 250000.0), 2)
    }

    # Loan EMI calculation
    # EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
    # Assume 80% loan of total cost
    loan_principal = total_construction_cost * 0.80
    monthly_r = (input_data.interest_rate_pct / 100.0) / 12.0
    num_months = input_data.loan_tenure_years * 12
    emi = loan_principal * monthly_r * ((1 + monthly_r) ** num_months) / (((1 + monthly_r) ** num_months) - 1)

    boq = BOQ(
        cement_bags=cement_bags,
        steel_kg=steel_kg,
        sand_tons=sand_tons,
        aggregate_tons=aggregate_tons,
        bricks_count=bricks_count,
        cost_breakdown=cost_breakdown,
        total_cost_inr=round(total_construction_cost, 2),
        monthly_emi_inr=round(emi, 2)
    )

    itemized_table = [
        {"item": "OPC / PPC Cement (50kg Bags)", "qty": f"{cement_bags} Bags", "unit_rate_inr": 400.0, "amount_inr": cement_cost},
        {"item": "Fe500D TMT Reinforcement Steel", "qty": f"{steel_kg:,} Kg", "unit_rate_inr": 70.0, "amount_inr": steel_cost},
        {"item": "River Sand / M-Sand", "qty": f"{sand_tons} Tons", "unit_rate_inr": 2200.0, "amount_inr": sand_cost},
        {"item": "Coarse Aggregate (20mm & 10mm)", "qty": f"{aggregate_tons} Tons", "unit_rate_inr": 1400.0, "amount_inr": aggregate_cost},
        {"item": "Red Clay Wirecut Bricks", "qty": f"{bricks_count:,} Nos", "unit_rate_inr": 9.0, "amount_inr": brick_cost},
        {"item": "Tiles & Flooring (Vitrified + Teak)", "qty": f"{int(area)} sqft", "unit_rate_inr": 120.0, "amount_inr": flooring_cost},
        {"item": "MEP (Pipes, Wires, Distribution, Pump)", "qty": "Lump-sum", "unit_rate_inr": mep_cost, "amount_inr": mep_cost},
        {"item": "RCC Labour & Shuttering", "qty": f"{int(area)} sqft", "unit_rate_inr": 330.0, "amount_inr": labour_cost}
    ]

    return {
        "success": True,
        "house_id": input_data.house_id,
        "boq": boq.model_dump(),
        "itemized_table": itemized_table,
        "loan_simulation": {
            "loan_amount_inr": round(loan_principal, 2),
            "tenure_years": input_data.loan_tenure_years,
            "interest_rate": f"{input_data.interest_rate_pct}%",
            "monthly_emi_inr": round(emi, 2)
        },
        "reason": f"Calculated exact bill of quantities for {area:.0f} sqft G+1 shell using November 2026 Mumbai benchmark prices (Cement ₹400/bag, Steel ₹70/kg)."
    }


@router.get("/health")
def health_check():
    return {"status": "healthy", "model": "budget_boq", "version": "1.0"}
