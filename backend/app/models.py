from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(Text, unique=True)
    contact_name: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    projects: Mapped[list["Project"]] = relationship(back_populates="client")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(Text, unique=True)
    name: Mapped[str] = mapped_column(Text)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    project_type: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    contract_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    budget_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    start_date: Mapped[date] = mapped_column(Date)
    planned_finish_date: Mapped[date] = mapped_column(Date)
    progress_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    client: Mapped[Client] = relationship(back_populates="projects")
    work_items: Mapped[list["WorkItem"]] = relationship(back_populates="project")


class WorkItem(Base):
    __tablename__ = "work_items"
    __table_args__ = (UniqueConstraint("project_id", "code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(Text)
    unit: Mapped[str] = mapped_column(Text)
    planned_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    budget_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))

    project: Mapped[Project] = relationship(back_populates="work_items")


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(Text, unique=True)
    supplier_type: Mapped[str] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sku: Mapped[str] = mapped_column(Text, unique=True)
    name: Mapped[str] = mapped_column(Text)
    unit: Mapped[str] = mapped_column(Text)
    stock_quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    average_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2))


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    po_no: Mapped[str] = mapped_column(Text, unique=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    supplier_id: Mapped[int] = mapped_column(ForeignKey("suppliers.id"))
    status: Mapped[str] = mapped_column(Text)
    order_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    ordered_at: Mapped[date] = mapped_column(Date)


class MaterialUsage(Base):
    __tablename__ = "material_usages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    work_item_id: Mapped[int] = mapped_column(ForeignKey("work_items.id"))
    material_id: Mapped[int] = mapped_column(ForeignKey("materials.id"))
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    cost_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    used_on: Mapped[date] = mapped_column(Date)


class CostEntry(Base):
    __tablename__ = "cost_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    work_item_id: Mapped[int | None] = mapped_column(ForeignKey("work_items.id"))
    cost_type: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    incurred_on: Mapped[date] = mapped_column(Date)


class PaymentClaim(Base):
    __tablename__ = "payment_claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    claim_no: Mapped[str] = mapped_column(Text, unique=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    status: Mapped[str] = mapped_column(Text)
    claim_period: Mapped[str] = mapped_column(Text)
    claimed_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    retention_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    approved_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    submitted_on: Mapped[date] = mapped_column(Date)
