from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    active_project_count: int
    total_contract_amount: Decimal
    total_budget_amount: Decimal
    total_actual_cost: Decimal
    total_approved_claims: Decimal
    low_stock_count: int
    over_budget_project_count: int


class ProjectCostCenterOut(BaseModel):
    id: int
    code: str
    name: str
    client_name: str
    project_type: str
    location: str
    status: str
    contract_amount: Decimal
    budget_amount: Decimal
    actual_cost: Decimal
    approved_claims: Decimal
    progress_percent: Decimal
    cost_to_budget_percent: Decimal
    estimated_margin: Decimal
    planned_finish_date: date


class WorkItemCostOut(BaseModel):
    id: int
    project_code: str
    code: str
    name: str
    category: str
    unit: str
    planned_quantity: Decimal
    budget_amount: Decimal
    actual_cost: Decimal
    cost_to_budget_percent: Decimal


class MaterialOut(BaseModel):
    id: int
    sku: str
    name: str
    unit: str
    stock_quantity: Decimal
    reorder_level: Decimal
    average_cost: Decimal
    is_low_stock: bool


class PurchaseOrderOut(BaseModel):
    id: int
    po_no: str
    project_code: str
    project_name: str
    supplier_name: str
    status: str
    order_amount: Decimal
    ordered_at: date


class PaymentClaimOut(BaseModel):
    id: int
    claim_no: str
    project_code: str
    project_name: str
    status: str
    claim_period: str
    claimed_amount: Decimal
    retention_amount: Decimal
    approved_amount: Decimal
    submitted_on: date
