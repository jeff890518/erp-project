from decimal import Decimal

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Client, CostEntry, Material, PaymentClaim, Project, PurchaseOrder, Supplier, WorkItem
from app.schemas import (
    DashboardSummary,
    MaterialOut,
    PaymentClaimOut,
    ProjectCostCenterOut,
    PurchaseOrderOut,
    WorkItemCostOut,
)

app = FastAPI(title="Construction ERP API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def decimal_or_zero(value: Decimal | None) -> Decimal:
    return value or Decimal("0")


def percent(numerator: Decimal, denominator: Decimal) -> Decimal:
    if denominator == 0:
        return Decimal("0")
    return (numerator / denominator * Decimal("100")).quantize(Decimal("0.01"))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/dashboard", response_model=DashboardSummary)
def dashboard(db: Session = Depends(get_db)) -> DashboardSummary:
    active_project_count = db.scalar(
        select(func.count(Project.id)).where(Project.status.in_(["planning", "in_progress"]))
    ) or 0
    total_contract_amount = decimal_or_zero(db.scalar(select(func.coalesce(func.sum(Project.contract_amount), 0))))
    total_budget_amount = decimal_or_zero(db.scalar(select(func.coalesce(func.sum(Project.budget_amount), 0))))
    total_actual_cost = decimal_or_zero(db.scalar(select(func.coalesce(func.sum(CostEntry.amount), 0))))
    total_approved_claims = decimal_or_zero(
        db.scalar(select(func.coalesce(func.sum(PaymentClaim.approved_amount), 0)))
    )
    low_stock_count = db.scalar(
        select(func.count(Material.id)).where(Material.stock_quantity <= Material.reorder_level)
    ) or 0

    cost_by_project = (
        select(CostEntry.project_id, func.coalesce(func.sum(CostEntry.amount), 0).label("actual_cost"))
        .group_by(CostEntry.project_id)
        .subquery()
    )
    over_budget_project_count = db.scalar(
        select(func.count(Project.id))
        .outerjoin(cost_by_project, Project.id == cost_by_project.c.project_id)
        .where(func.coalesce(cost_by_project.c.actual_cost, 0) > Project.budget_amount)
    ) or 0

    return DashboardSummary(
        active_project_count=active_project_count,
        total_contract_amount=total_contract_amount,
        total_budget_amount=total_budget_amount,
        total_actual_cost=total_actual_cost,
        total_approved_claims=total_approved_claims,
        low_stock_count=low_stock_count,
        over_budget_project_count=over_budget_project_count,
    )


@app.get("/projects", response_model=list[ProjectCostCenterOut])
def projects(db: Session = Depends(get_db)) -> list[ProjectCostCenterOut]:
    cost_by_project = (
        select(CostEntry.project_id, func.coalesce(func.sum(CostEntry.amount), 0).label("actual_cost"))
        .group_by(CostEntry.project_id)
        .subquery()
    )
    claims_by_project = (
        select(PaymentClaim.project_id, func.coalesce(func.sum(PaymentClaim.approved_amount), 0).label("approved_claims"))
        .group_by(PaymentClaim.project_id)
        .subquery()
    )
    rows = db.execute(
        select(
            Project.id,
            Project.code,
            Project.name,
            Client.name.label("client_name"),
            Project.project_type,
            Project.location,
            Project.status,
            Project.contract_amount,
            Project.budget_amount,
            func.coalesce(cost_by_project.c.actual_cost, 0).label("actual_cost"),
            func.coalesce(claims_by_project.c.approved_claims, 0).label("approved_claims"),
            Project.progress_percent,
            Project.planned_finish_date,
        )
        .join(Client)
        .outerjoin(cost_by_project, Project.id == cost_by_project.c.project_id)
        .outerjoin(claims_by_project, Project.id == claims_by_project.c.project_id)
        .order_by(Project.code)
    )

    return [
        ProjectCostCenterOut(
            id=row.id,
            code=row.code,
            name=row.name,
            client_name=row.client_name,
            project_type=row.project_type,
            location=row.location,
            status=row.status,
            contract_amount=row.contract_amount,
            budget_amount=row.budget_amount,
            actual_cost=row.actual_cost,
            approved_claims=row.approved_claims,
            progress_percent=row.progress_percent,
            cost_to_budget_percent=percent(row.actual_cost, row.budget_amount),
            estimated_margin=row.contract_amount - row.actual_cost,
            planned_finish_date=row.planned_finish_date,
        )
        for row in rows
    ]


@app.get("/work-items", response_model=list[WorkItemCostOut])
def work_items(db: Session = Depends(get_db)) -> list[WorkItemCostOut]:
    cost_by_work_item = (
        select(CostEntry.work_item_id, func.coalesce(func.sum(CostEntry.amount), 0).label("actual_cost"))
        .group_by(CostEntry.work_item_id)
        .subquery()
    )
    rows = db.execute(
        select(
            WorkItem.id,
            Project.code.label("project_code"),
            WorkItem.code,
            WorkItem.name,
            WorkItem.category,
            WorkItem.unit,
            WorkItem.planned_quantity,
            WorkItem.budget_amount,
            func.coalesce(cost_by_work_item.c.actual_cost, 0).label("actual_cost"),
        )
        .join(Project)
        .outerjoin(cost_by_work_item, WorkItem.id == cost_by_work_item.c.work_item_id)
        .order_by(Project.code, WorkItem.code)
    )

    return [
        WorkItemCostOut(
            id=row.id,
            project_code=row.project_code,
            code=row.code,
            name=row.name,
            category=row.category,
            unit=row.unit,
            planned_quantity=row.planned_quantity,
            budget_amount=row.budget_amount,
            actual_cost=row.actual_cost,
            cost_to_budget_percent=percent(row.actual_cost, row.budget_amount),
        )
        for row in rows
    ]


@app.get("/materials", response_model=list[MaterialOut])
def materials(db: Session = Depends(get_db)) -> list[MaterialOut]:
    rows = db.scalars(select(Material).order_by(Material.sku))
    return [
        MaterialOut(
            id=material.id,
            sku=material.sku,
            name=material.name,
            unit=material.unit,
            stock_quantity=material.stock_quantity,
            reorder_level=material.reorder_level,
            average_cost=material.average_cost,
            is_low_stock=material.stock_quantity <= material.reorder_level,
        )
        for material in rows
    ]


@app.get("/purchase-orders", response_model=list[PurchaseOrderOut])
def purchase_orders(db: Session = Depends(get_db)) -> list[PurchaseOrderOut]:
    rows = db.execute(
        select(
            PurchaseOrder.id,
            PurchaseOrder.po_no,
            Project.code.label("project_code"),
            Project.name.label("project_name"),
            Supplier.name.label("supplier_name"),
            PurchaseOrder.status,
            PurchaseOrder.order_amount,
            PurchaseOrder.ordered_at,
        )
        .join(Project, PurchaseOrder.project_id == Project.id)
        .join(Supplier, PurchaseOrder.supplier_id == Supplier.id)
        .order_by(PurchaseOrder.ordered_at.desc())
    )

    return [PurchaseOrderOut(**row._mapping) for row in rows]


@app.get("/payment-claims", response_model=list[PaymentClaimOut])
def payment_claims(db: Session = Depends(get_db)) -> list[PaymentClaimOut]:
    rows = db.execute(
        select(
            PaymentClaim.id,
            PaymentClaim.claim_no,
            Project.code.label("project_code"),
            Project.name.label("project_name"),
            PaymentClaim.status,
            PaymentClaim.claim_period,
            PaymentClaim.claimed_amount,
            PaymentClaim.retention_amount,
            PaymentClaim.approved_amount,
            PaymentClaim.submitted_on,
        )
        .join(Project, PaymentClaim.project_id == Project.id)
        .order_by(PaymentClaim.submitted_on.desc())
    )

    return [PaymentClaimOut(**row._mapping) for row in rows]
