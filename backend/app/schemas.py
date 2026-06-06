from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class DashboardSummary(BaseModel):
    active_project_count: int
    total_contract_amount: Decimal
    total_budget_amount: Decimal
    total_actual_cost: Decimal
    total_approved_claims: Decimal
    low_stock_count: int
    over_budget_project_count: int
    submitted_purchase_order_count: int
    approved_purchase_order_amount: Decimal
    received_purchase_order_amount: Decimal


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
    start_date: date
    planned_finish_date: date


class ProjectCreate(BaseModel):
    code: str = Field(min_length=1)
    name: str = Field(min_length=1)
    client_name: str = Field(min_length=1)
    project_type: str = Field(min_length=1)
    location: str = Field(min_length=1)
    status: str = "planning"
    contract_amount: Decimal = Decimal("0")
    budget_amount: Decimal = Decimal("0")
    start_date: date
    planned_finish_date: date
    progress_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    client_name: str | None = Field(default=None, min_length=1)
    project_type: str | None = Field(default=None, min_length=1)
    location: str | None = Field(default=None, min_length=1)
    status: str | None = None
    contract_amount: Decimal | None = None
    budget_amount: Decimal | None = None
    start_date: date | None = None
    planned_finish_date: date | None = None
    progress_percent: Decimal | None = Field(default=None, ge=0, le=100)


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


class PurchaseOrderCreate(BaseModel):
    po_no: str = Field(min_length=1)
    project_code: str = Field(min_length=1)
    supplier_name: str = Field(min_length=1)
    status: str = "draft"
    order_amount: Decimal = Decimal("0")
    ordered_at: date


class PurchaseOrderUpdate(BaseModel):
    project_code: str | None = Field(default=None, min_length=1)
    supplier_name: str | None = Field(default=None, min_length=1)
    status: str | None = None
    order_amount: Decimal | None = None
    ordered_at: date | None = None


class PurchaseOrderStatusUpdate(BaseModel):
    status: str


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
