from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Client, CostEntry, Material, PaymentClaim, Project, PurchaseOrder, Supplier, WorkItem
from app.schemas import (
    DashboardSummary,
    MaterialOut,
    PaymentClaimOut,
    ProjectCreate,
    ProjectCostCenterOut,
    ProjectUpdate,
    PurchaseOrderCreate,
    PurchaseOrderOut,
    PurchaseOrderStatusUpdate,
    PurchaseOrderUpdate,
    WorkItemCostOut,
)

app = FastAPI(title="Construction ERP API", version="0.2.0")

PURCHASE_ORDER_STATUSES = {"draft", "submitted", "approved", "received"}
PURCHASE_ORDER_TRANSITIONS = {
    "draft": {"submitted"},
    "submitted": {"approved", "draft"},
    "approved": {"received"},
    "received": set(),
}

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


def project_cost_center_query(project_id: int | None = None):
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
    query = (
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
            Project.start_date,
            Project.planned_finish_date,
        )
        .join(Client)
        .outerjoin(cost_by_project, Project.id == cost_by_project.c.project_id)
        .outerjoin(claims_by_project, Project.id == claims_by_project.c.project_id)
    )
    if project_id is not None:
        query = query.where(Project.id == project_id)
    return query.order_by(Project.code)


def project_cost_center_from_row(row) -> ProjectCostCenterOut:
    return ProjectCostCenterOut(
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
        start_date=row.start_date,
        planned_finish_date=row.planned_finish_date,
    )


def get_project_cost_center(db: Session, project_id: int) -> ProjectCostCenterOut:
    row = db.execute(project_cost_center_query(project_id)).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project_cost_center_from_row(row)


def get_or_create_client(db: Session, client_name: str) -> Client:
    cleaned_name = client_name.strip()
    if not cleaned_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Client name is required")
    client = db.scalar(select(Client).where(Client.name == cleaned_name))
    if client is not None:
        return client
    client = Client(name=cleaned_name, contact_name=None, phone=None)
    db.add(client)
    db.flush()
    return client


def get_or_create_supplier(db: Session, supplier_name: str) -> Supplier:
    cleaned_name = supplier_name.strip()
    if not cleaned_name:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Supplier name is required")
    supplier = db.scalar(select(Supplier).where(Supplier.name == cleaned_name))
    if supplier is not None:
        return supplier
    supplier = Supplier(name=cleaned_name, supplier_type="material", phone=None)
    db.add(supplier)
    db.flush()
    return supplier


def get_project_by_code(db: Session, project_code: str) -> Project:
    cleaned_code = project_code.strip()
    project = db.scalar(select(Project).where(Project.code == cleaned_code))
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def validate_purchase_order_status(next_status: str) -> str:
    cleaned_status = next_status.strip()
    if cleaned_status not in PURCHASE_ORDER_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid purchase order status")
    return cleaned_status


def purchase_order_query(purchase_order_id: int | None = None):
    query = (
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
    )
    if purchase_order_id is not None:
        query = query.where(PurchaseOrder.id == purchase_order_id)
    return query.order_by(PurchaseOrder.ordered_at.desc(), PurchaseOrder.po_no)


def get_purchase_order_out(db: Session, purchase_order_id: int) -> PurchaseOrderOut:
    row = db.execute(purchase_order_query(purchase_order_id)).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    return PurchaseOrderOut(**row._mapping)


def change_purchase_order_status(purchase_order: PurchaseOrder, next_status: str) -> None:
    cleaned_status = validate_purchase_order_status(next_status)
    if cleaned_status == purchase_order.status:
        return
    allowed_statuses = PURCHASE_ORDER_TRANSITIONS.get(purchase_order.status, set())
    if cleaned_status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot move purchase order from {purchase_order.status} to {cleaned_status}",
        )
    purchase_order.status = cleaned_status


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
    submitted_purchase_order_count = db.scalar(
        select(func.count(PurchaseOrder.id)).where(PurchaseOrder.status == "submitted")
    ) or 0
    approved_purchase_order_amount = decimal_or_zero(
        db.scalar(
            select(func.coalesce(func.sum(PurchaseOrder.order_amount), 0)).where(PurchaseOrder.status == "approved")
        )
    )
    received_purchase_order_amount = decimal_or_zero(
        db.scalar(
            select(func.coalesce(func.sum(PurchaseOrder.order_amount), 0)).where(PurchaseOrder.status == "received")
        )
    )

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
        submitted_purchase_order_count=submitted_purchase_order_count,
        approved_purchase_order_amount=approved_purchase_order_amount,
        received_purchase_order_amount=received_purchase_order_amount,
    )


@app.get("/projects", response_model=list[ProjectCostCenterOut])
def projects(db: Session = Depends(get_db)) -> list[ProjectCostCenterOut]:
    return [project_cost_center_from_row(row) for row in db.execute(project_cost_center_query())]


@app.post("/projects", response_model=ProjectCostCenterOut, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> ProjectCostCenterOut:
    client = get_or_create_client(db, payload.client_name)
    project = Project(
        code=payload.code.strip(),
        name=payload.name.strip(),
        client_id=client.id,
        project_type=payload.project_type.strip(),
        location=payload.location.strip(),
        status=payload.status.strip(),
        contract_amount=payload.contract_amount,
        budget_amount=payload.budget_amount,
        start_date=payload.start_date,
        planned_finish_date=payload.planned_finish_date,
        progress_percent=payload.progress_percent,
    )
    db.add(project)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project code already exists") from exc
    return get_project_cost_center(db, project.id)


@app.patch("/projects/{project_id}", response_model=ProjectCostCenterOut)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)) -> ProjectCostCenterOut:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    update_data = payload.model_dump(exclude_unset=True)
    client_name = update_data.pop("client_name", None)
    if client_name is not None:
        project.client_id = get_or_create_client(db, client_name).id

    for field_name, value in update_data.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(project, field_name, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project update conflicts with existing data") from exc
    return get_project_cost_center(db, project.id)


@app.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)) -> None:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    db.delete(project)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project has related operational records and cannot be deleted",
        ) from exc


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
    rows = db.execute(purchase_order_query())

    return [PurchaseOrderOut(**row._mapping) for row in rows]


@app.post("/purchase-orders", response_model=PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
def create_purchase_order(payload: PurchaseOrderCreate, db: Session = Depends(get_db)) -> PurchaseOrderOut:
    project = get_project_by_code(db, payload.project_code)
    supplier = get_or_create_supplier(db, payload.supplier_name)
    purchase_order = PurchaseOrder(
        po_no=payload.po_no.strip(),
        project_id=project.id,
        supplier_id=supplier.id,
        status=validate_purchase_order_status(payload.status),
        order_amount=payload.order_amount,
        ordered_at=payload.ordered_at,
    )
    db.add(purchase_order)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Purchase order number already exists") from exc
    return get_purchase_order_out(db, purchase_order.id)


@app.patch("/purchase-orders/{purchase_order_id}", response_model=PurchaseOrderOut)
def update_purchase_order(
    purchase_order_id: int,
    payload: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
) -> PurchaseOrderOut:
    purchase_order = db.get(PurchaseOrder, purchase_order_id)
    if purchase_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    if purchase_order.status == "received":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Received purchase orders cannot be edited")

    update_data = payload.model_dump(exclude_unset=True)
    project_code = update_data.pop("project_code", None)
    supplier_name = update_data.pop("supplier_name", None)
    next_status = update_data.pop("status", None)
    if project_code is not None:
        purchase_order.project_id = get_project_by_code(db, project_code).id
    if supplier_name is not None:
        purchase_order.supplier_id = get_or_create_supplier(db, supplier_name).id
    if next_status is not None:
        change_purchase_order_status(purchase_order, next_status)

    for field_name, value in update_data.items():
        setattr(purchase_order, field_name, value)

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Purchase order update conflicts with existing data") from exc
    return get_purchase_order_out(db, purchase_order.id)


@app.patch("/purchase-orders/{purchase_order_id}/status", response_model=PurchaseOrderOut)
def update_purchase_order_status(
    purchase_order_id: int,
    payload: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db),
) -> PurchaseOrderOut:
    purchase_order = db.get(PurchaseOrder, purchase_order_id)
    if purchase_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    change_purchase_order_status(purchase_order, payload.status)
    db.commit()
    return get_purchase_order_out(db, purchase_order.id)


@app.delete("/purchase-orders/{purchase_order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase_order(purchase_order_id: int, db: Session = Depends(get_db)) -> None:
    purchase_order = db.get(PurchaseOrder, purchase_order_id)
    if purchase_order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    if purchase_order.status != "draft":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only draft purchase orders can be deleted")

    db.delete(purchase_order)
    db.commit()


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
