import uuid
from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Optional

from pydantic import EmailStr
from sqlalchemy import JSON, Column, DateTime, Text
from sqlalchemy import types as sa_types
from sqlmodel import Field, Relationship, SQLModel
from sqlmodel.sql.sqltypes import AutoString

try:
    from pgvector.sqlalchemy import Vector as _Vector

    _EMBEDDING_COLUMN_TYPE: sa_types.TypeEngine = _Vector(1536)  # type: ignore[assignment]
except ImportError:
    # pgvector not installed yet; use Text as placeholder so the app starts.
    # The actual column type is defined in the manual migration.
    _EMBEDDING_COLUMN_TYPE = Text()


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Enum for predefined roles
class RoleEnum(str, Enum):
    ADMIN = "admin"
    RUNNER = "runner"
    ORGANIZER = "organizer"
    VOLUNTEER = "volunteer"


# Enum for race status
class RaceStatusEnum(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    REGISTRATION_OPEN = "registration_open"
    REGISTRATION_CLOSED = "registration_closed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# Enum for registration status
class RegistrationStatusEnum(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    WAITLIST = "waitlist"


# Enum for payment status
class PaymentStatusEnum(str, Enum):
    UNPAID = "unpaid"
    PAID = "paid"
    REFUNDED = "refunded"
    PARTIAL = "partial"


# Enum for race result status
class ResultStatusEnum(str, Enum):
    FINISHED = "finished"
    DNF = "dnf"  # Did Not Finish
    DNS = "dns"  # Did Not Start
    DQ = "dq"  # Disqualified


# Enum for flexible attribute types
class AttributeTypeEnum(str, Enum):
    STRING = "string"
    TEXT = "text"
    URL = "url"
    DATE = "date"
    DATETIME = "datetime"
    NUMBER = "number"
    BOOLEAN = "boolean"
    EMAIL = "email"
    PHONE = "phone"


class TerrainEnum(str, Enum):
    ROAD = "road"
    TRAIL = "trail"
    TRACK = "track"
    MIXED = "mixed"


class DifficultyEnum(str, Enum):
    EASY = "easy"
    MODERATE = "moderate"
    HARD = "hard"
    EXTREME = "extreme"


class FitnessEnum(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    ELITE = "elite"


class DistancePrefEnum(str, Enum):
    SHORT = "short"   # 5K and under
    MID = "mid"       # 10K–half marathon
    LONG = "long"     # full marathon
    ULTRA = "ultra"   # 50K+


class InteractionTypeEnum(str, Enum):
    VIEWED = "viewed"
    SAVED = "saved"
    UNSAVED = "unsaved"
    REGISTERED = "registered"
    SHARED = "shared"


# Link table for many-to-many relationship between User and Role
class UserRoleLink(SQLModel, table=True):
    user_id: uuid.UUID = Field(
        foreign_key="user.id", primary_key=True, ondelete="CASCADE"
    )
    role_id: uuid.UUID = Field(
        foreign_key="role.id", primary_key=True, ondelete="CASCADE"
    )


# Role model
class RoleBase(SQLModel):
    name: str = Field(unique=True, index=True, max_length=50)
    description: str | None = Field(default=None, max_length=255)


class RoleCreate(RoleBase):
    pass


class RoleUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=50)
    description: str | None = Field(default=None, max_length=255)


class Role(RoleBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_column=Column(DateTime(timezone=True)),
    )
    users: list["User"] = Relationship(back_populates="roles", link_model=UserRoleLink)


class RolePublic(RoleBase):
    id: uuid.UUID
    created_at: datetime | None = None


class RolesPublic(SQLModel):
    data: list[RolePublic]
    count: int


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_column=Column(DateTime(timezone=True)),
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    roles: list[Role] = Relationship(back_populates="users", link_model=UserRoleLink)
    # Race relationships
    organized_races: list["Race"] = Relationship(
        back_populates="organizer", cascade_delete=True
    )
    race_registrations: list["RaceRegistration"] = Relationship(
        back_populates="runner", cascade_delete=True
    )
    profile: Optional["UserProfile"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False},
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None
    roles: list[RolePublic] = []


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_column=Column(DateTime(timezone=True)),
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# =============================================================================
# MediaAsset - Reusable media for any content type (race, article, etc.)
# =============================================================================


class MediaAssetBase(SQLModel):
    content_type: str = Field(max_length=100, index=True)
    content_id: uuid.UUID = Field(index=True)
    kind: str = Field(default="gallery", max_length=50, index=True)

    alt_text: str | None = Field(default=None, max_length=255)
    display_order: int = Field(default=0)
    is_primary: bool = False
    is_public: bool = True


class MediaAssetCreate(MediaAssetBase):
    original_filename: str = Field(max_length=255)
    file_name: str = Field(max_length=255)
    file_path: str = Field(max_length=1000)
    file_url: str = Field(max_length=1000)
    mime_type: str = Field(max_length=100)
    size_bytes: int = Field(ge=0)
    uploaded_by_id: uuid.UUID | None = None


class MediaAssetUpdate(SQLModel):
    kind: str | None = Field(default=None, max_length=50)
    alt_text: str | None = Field(default=None, max_length=255)
    display_order: int | None = None
    is_primary: bool | None = None
    is_public: bool | None = None


class MediaAsset(MediaAssetBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    original_filename: str = Field(max_length=255)
    file_name: str = Field(max_length=255)
    file_path: str = Field(max_length=1000)
    file_url: str = Field(max_length=1000)
    mime_type: str = Field(max_length=100)
    size_bytes: int = Field(ge=0)
    uploaded_by_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )


class MediaAssetPublic(MediaAssetBase):
    id: uuid.UUID
    original_filename: str
    file_name: str
    file_url: str
    mime_type: str
    size_bytes: int
    uploaded_by_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class MediaAssetsPublic(SQLModel):
    data: list[MediaAssetPublic]
    count: int


# =============================================================================
# Race Models
# =============================================================================


# Junction table for many-to-many Race ↔ RaceTag
class RaceTagLink(SQLModel, table=True):
    race_id: uuid.UUID = Field(
        foreign_key="race.id", primary_key=True, ondelete="CASCADE"
    )
    tag_id: uuid.UUID = Field(
        foreign_key="racetag.id", primary_key=True, ondelete="CASCADE"
    )


class RaceTagBase(SQLModel):
    name: str = Field(max_length=50, unique=True, index=True)
    slug: str = Field(max_length=50, unique=True, index=True)
    translations: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class RaceTagCreate(RaceTagBase):
    pass


class RaceTag(RaceTagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    races: list["Race"] = Relationship(
        back_populates="tags", link_model=RaceTagLink
    )


class TagPublic(RaceTagBase):
    id: uuid.UUID


class TagsPublic(SQLModel):
    data: list[TagPublic]
    count: int


# Race - Main race event
class RaceBase(SQLModel):
    name: str = Field(min_length=1, max_length=255, index=True)
    description: str | None = Field(default=None, max_length=2000)

    # Overall event period (for multi-day events)
    event_start_date: datetime = Field(sa_column=Column(DateTime(timezone=True)))
    event_end_date: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )

    # Location
    location: str = Field(max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str = Field(default="Vietnam", max_length=100)
    
    # Vietnamese administrative location (new structured fields)
    province_code: str | None = Field(default=None, max_length=20)
    ward_code: str | None = Field(default=None, max_length=20)
    country_code: str | None = Field(default=None, max_length=10)
    province_name: str | None = Field(default=None, max_length=100)
    ward_name: str | None = Field(default=None, max_length=100)

    # Overall registration (can be overridden per category)
    registration_start: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    registration_end: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )

    # Status — use AutoString so SQLAlchemy stores the enum .value ("draft"), not .name ("DRAFT")
    status: RaceStatusEnum = Field(
        default=RaceStatusEnum.DRAFT,
        sa_column=Column(AutoString(), nullable=False),
    )
    is_active: bool = True

    # Default pricing (can be overridden per category)
    base_price: float | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", max_length=3)

    # Flexible metadata stored as JSON
    race_metadata: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))

    # Geographic coordinates
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    # Course characteristics — AutoString stores .value ("trail"), not .name ("TRAIL")
    terrain_type: TerrainEnum | None = Field(
        default=None,
        sa_column=Column(AutoString(), nullable=True),
    )
    difficulty_level: DifficultyEnum | None = Field(
        default=None,
        sa_column=Column(AutoString(), nullable=True),
    )
    elevation_gain_m: int | None = Field(default=None, ge=0)
    is_certified: bool = Field(default=False)
    gpx_file_url: str | None = Field(default=None, max_length=1000)
    website_url: str | None = Field(default=None, max_length=1000)
    
    # Cached media file paths for performance optimization
    cover_image_url: str | None = Field(default=None, max_length=1000)
    banner_image_url: str | None = Field(default=None, max_length=1000)
    
    # Multi-language support
    default_language: str = Field(default="vi", max_length=10)
    translations: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class RaceCreate(RaceBase):
    pass


class RaceUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    event_start_date: datetime | None = None
    event_end_date: datetime | None = None
    location: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    province_code: str | None = None
    ward_code: str | None = None
    country_code: str | None = None
    province_name: str | None = None
    ward_name: str | None = None
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    status: RaceStatusEnum | None = None
    is_active: bool | None = None
    base_price: float | None = None
    currency: str | None = None
    race_metadata: dict[str, Any] | None = None
    latitude: float | None = None
    longitude: float | None = None
    terrain_type: TerrainEnum | None = None
    difficulty_level: DifficultyEnum | None = None
    elevation_gain_m: int | None = None
    is_certified: bool | None = None
    gpx_file_url: str | None = None
    website_url: str | None = None
    cover_image_url: str | None = None
    banner_image_url: str | None = None
    tag_ids: list[uuid.UUID] | None = None


class Race(RaceBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )

    # Foreign keys
    organizer_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    province_code: str | None = Field(
        default=None, foreign_key="provinces.code", max_length=20
    )
    ward_code: str | None = Field(
        default=None, foreign_key="wards.code", max_length=20
    )

    # Embedding vector for semantic search (1536-dim, text-embedding-3-small)
    embedding: list[float] | None = Field(
        default=None,
        sa_column=Column(_EMBEDDING_COLUMN_TYPE, nullable=True),
    )

    # Relationships
    organizer: User = Relationship(back_populates="organized_races")
    province: Optional["Province"] = Relationship()
    ward: Optional["Ward"] = Relationship()
    categories: list["RaceCategory"] = Relationship(
        back_populates="race", cascade_delete=True
    )
    registrations: list["RaceRegistration"] = Relationship(
        back_populates="race", cascade_delete=True
    )
    attributes: list["RaceAttribute"] = Relationship(
        back_populates="race", cascade_delete=True
    )
    checkpoints: list["RaceCheckpoint"] = Relationship(
        back_populates="race", cascade_delete=True
    )
    tags: list[RaceTag] = Relationship(
        back_populates="races", link_model=RaceTagLink
    )


class RacePublic(RaceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    organizer_id: uuid.UUID


class RacePublicWithDetails(RacePublic):
    categories: list["RaceCategoryPublic"] = []
    tags: list[TagPublic] = []
    registration_count: int = 0
    province: "ProvincePublic | None" = None
    ward: "WardPublic | None" = None


class RacePublicWithDistance(RacePublic):
    distance_km: float


class RacePublicWithExplanation(RacePublic):
    ai_explanation: str | None = None


class RacesPublicWithExplanation(SQLModel):
    data: list[RacePublicWithExplanation]
    count: int


class RacesPublic(SQLModel):
    data: list[RacePublic]
    count: int


class RacesPublicWithDistance(SQLModel):
    data: list[RacePublicWithDistance]
    count: int


# Translation models
class TranslationContent(SQLModel):
    """Single language translation content"""
    name: str | None = None
    description: str | None = None


class RaceTranslationUpdate(SQLModel):
    """Update translations for a race"""
    language: str = Field(min_length=2, max_length=10)
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    location: str | None = Field(default=None, max_length=255)


class CategoryTranslationUpdate(SQLModel):
    """Update translations for a race category"""
    language: str = Field(min_length=2, max_length=10)
    name: str | None = Field(default=None, max_length=100)
    description: str | None = None


class TagTranslationUpdate(SQLModel):
    """Update translations for a tag"""
    language: str = Field(min_length=2, max_length=10)
    name: str | None = Field(default=None, max_length=50)


# RaceCategory - Distance/Type variations
class RaceCategoryBase(SQLModel):
    name: str = Field(max_length=100)
    distance_km: float = Field(gt=0)
    distance_unit: str = Field(default="km", max_length=10)

    # Category-specific start and end times
    start_time: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    end_time: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )

    # Time limits
    cutoff_time_minutes: int | None = Field(default=None, ge=0)

    # Category-specific registration window (overrides race defaults)
    registration_start: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    registration_end: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )

    # Category-specific pricing
    price: float | None = Field(default=None, ge=0)
    early_bird_price: float | None = Field(default=None, ge=0)
    early_bird_deadline: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )

    # Capacity
    max_participants: int | None = Field(default=None, ge=1)

    # Age/gender restrictions
    min_age: int | None = Field(default=None, ge=0)
    max_age: int | None = Field(default=None, ge=0)
    gender_restriction: str | None = Field(default=None, max_length=20)

    # Display
    description: str | None = Field(default=None, max_length=500)
    display_order: int = Field(default=0)
    is_active: bool = True
    
    # Multi-language support
    translations: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class RaceCategoryCreate(RaceCategoryBase):
    race_id: uuid.UUID


class RaceCategoryUpdate(SQLModel):
    name: str | None = None
    distance_km: float | None = None
    distance_unit: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    cutoff_time_minutes: int | None = None
    registration_start: datetime | None = None
    registration_end: datetime | None = None
    price: float | None = None
    early_bird_price: float | None = None
    early_bird_deadline: datetime | None = None
    max_participants: int | None = None
    min_age: int | None = None
    max_age: int | None = None
    gender_restriction: str | None = None
    description: str | None = None
    display_order: int | None = None
    is_active: bool | None = None


class RaceCategory(RaceCategoryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    race_id: uuid.UUID = Field(
        foreign_key="race.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )

    # Relationships
    race: Race = Relationship(back_populates="categories")
    registrations: list["RaceRegistration"] = Relationship(
        back_populates="category", cascade_delete=True
    )


class RaceCategoryPublic(RaceCategoryBase):
    id: uuid.UUID
    race_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RaceCategoryPublicWithDetails(RaceCategoryPublic):
    registration_count: int = 0
    available_spots: int | None = None
    is_registration_open: bool = False
    current_price: float | None = None


class RaceCategoriesPublic(SQLModel):
    data: list[RaceCategoryPublic]
    count: int


# RaceRegistration - Runner registrations
class RaceRegistrationBase(SQLModel):
    # Runner information
    bib_number: str | None = Field(default=None, max_length=50)
    emergency_contact: str | None = Field(default=None, max_length=255)
    emergency_phone: str | None = Field(default=None, max_length=50)

    # Additional info
    tshirt_size: str | None = Field(default=None, max_length=10)
    special_requirements: str | None = Field(default=None, max_length=500)

    # Payment & status — AutoString stores enum .value ("pending"), not .name ("PENDING")
    registration_status: RegistrationStatusEnum = Field(
        default=RegistrationStatusEnum.PENDING,
        sa_column=Column(AutoString(), nullable=False),
    )
    payment_status: PaymentStatusEnum = Field(
        default=PaymentStatusEnum.UNPAID,
        sa_column=Column(AutoString(), nullable=False),
    )
    amount_paid: float | None = Field(default=None, ge=0)
    payment_reference: str | None = Field(default=None, max_length=255)

    # Extra data stored as JSON
    registration_data: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSON)
    )


class RaceRegistrationCreate(RaceRegistrationBase):
    race_id: uuid.UUID
    category_id: uuid.UUID


class RaceRegistrationUpdate(SQLModel):
    bib_number: str | None = None
    emergency_contact: str | None = None
    emergency_phone: str | None = None
    tshirt_size: str | None = None
    special_requirements: str | None = None
    registration_status: RegistrationStatusEnum | None = None
    payment_status: PaymentStatusEnum | None = None
    amount_paid: float | None = None
    payment_reference: str | None = None
    registration_data: dict[str, Any] | None = None


class RaceRegistration(RaceRegistrationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    race_id: uuid.UUID = Field(
        foreign_key="race.id", nullable=False, ondelete="CASCADE"
    )
    category_id: uuid.UUID = Field(
        foreign_key="racecategory.id", nullable=False, ondelete="CASCADE"
    )
    runner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )

    registered_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )

    # Relationships
    race: Race = Relationship(back_populates="registrations")
    category: RaceCategory = Relationship(back_populates="registrations")
    runner: User = Relationship(back_populates="race_registrations")
    result: Optional["RaceResult"] = Relationship(
        back_populates="registration", sa_relationship_kwargs={"uselist": False}
    )
    split_times: list["RaceSplitTime"] = Relationship(
        back_populates="registration", cascade_delete=True
    )


class RaceRegistrationPublic(RaceRegistrationBase):
    id: uuid.UUID
    race_id: uuid.UUID
    category_id: uuid.UUID
    runner_id: uuid.UUID
    registered_at: datetime
    updated_at: datetime


class RaceRegistrationPublicWithDetails(RaceRegistrationPublic):
    runner: UserPublic
    category: RaceCategoryPublic


class RaceRegistrationsPublic(SQLModel):
    data: list[RaceRegistrationPublic]
    count: int


# RaceResult - Race completion results
class RaceResultBase(SQLModel):
    finish_time_seconds: int | None = Field(default=None, ge=0)
    overall_position: int | None = Field(default=None, ge=1)
    category_position: int | None = Field(default=None, ge=1)
    gender_position: int | None = Field(default=None, ge=1)

    status: ResultStatusEnum = Field(
        default=ResultStatusEnum.FINISHED,
        sa_column=Column(AutoString(), nullable=False),
    )

    # Calculated fields
    pace_per_km_seconds: float | None = None
    notes: str | None = Field(default=None, max_length=500)


class RaceResultCreate(RaceResultBase):
    registration_id: uuid.UUID


class RaceResultUpdate(RaceResultBase):
    finish_time_seconds: int | None = None
    overall_position: int | None = None
    category_position: int | None = None
    gender_position: int | None = None
    status: ResultStatusEnum | None = None
    pace_per_km_seconds: float | None = None
    notes: str | None = None


class RaceResult(RaceResultBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    registration_id: uuid.UUID = Field(
        foreign_key="raceregistration.id",
        unique=True,
        nullable=False,
        ondelete="CASCADE",
    )

    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )

    # Relationships
    registration: RaceRegistration = Relationship(back_populates="result")


class RaceResultPublic(RaceResultBase):
    id: uuid.UUID
    registration_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RaceResultsPublic(SQLModel):
    data: list[RaceResultPublic]
    count: int


# RaceAttribute - Flexible key-value attributes
class RaceAttributeBase(SQLModel):
    key: str = Field(max_length=100, index=True)
    value_text: str | None = Field(default=None, sa_column=Column(Text))

    # Metadata about the attribute
    attribute_type: AttributeTypeEnum = Field(default=AttributeTypeEnum.STRING)
    label: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=500)
    is_required: bool = False
    is_public: bool = True
    display_order: int = Field(default=0)


class RaceAttributeCreate(RaceAttributeBase):
    race_id: uuid.UUID


class RaceAttributeUpdate(SQLModel):
    value_text: str | None = None
    attribute_type: AttributeTypeEnum | None = None
    label: str | None = None
    description: str | None = None
    is_required: bool | None = None
    is_public: bool | None = None
    display_order: int | None = None


class RaceAttribute(RaceAttributeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    race_id: uuid.UUID = Field(
        foreign_key="race.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )

    # Relationships
    race: Race = Relationship(back_populates="attributes")


class RaceAttributePublic(RaceAttributeBase):
    id: uuid.UUID
    race_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class RaceAttributesPublic(SQLModel):
    data: list[RaceAttributePublic]
    count: int


# RaceCheckpoint - For split times tracking
class RaceCheckpointBase(SQLModel):
    name: str = Field(max_length=100)
    distance_km: float = Field(ge=0)
    sequence: int = Field(ge=1)
    is_active: bool = True


class RaceCheckpointCreate(RaceCheckpointBase):
    race_id: uuid.UUID


class RaceCheckpointUpdate(SQLModel):
    name: str | None = None
    distance_km: float | None = None
    sequence: int | None = None
    is_active: bool | None = None


class RaceCheckpoint(RaceCheckpointBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    race_id: uuid.UUID = Field(
        foreign_key="race.id", nullable=False, ondelete="CASCADE"
    )
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )

    # Relationships
    race: Race = Relationship(back_populates="checkpoints")
    split_times: list["RaceSplitTime"] = Relationship(
        back_populates="checkpoint", cascade_delete=True
    )


class RaceCheckpointPublic(RaceCheckpointBase):
    id: uuid.UUID
    race_id: uuid.UUID
    created_at: datetime


class RaceCheckpointsPublic(SQLModel):
    data: list[RaceCheckpointPublic]
    count: int


# RaceSplitTime - Split times at checkpoints
class RaceSplitTimeBase(SQLModel):
    time_seconds: int = Field(ge=0)


class RaceSplitTimeCreate(RaceSplitTimeBase):
    registration_id: uuid.UUID
    checkpoint_id: uuid.UUID


class RaceSplitTimeUpdate(SQLModel):
    time_seconds: int | None = None


class RaceSplitTime(RaceSplitTimeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    registration_id: uuid.UUID = Field(
        foreign_key="raceregistration.id", nullable=False, ondelete="CASCADE"
    )
    checkpoint_id: uuid.UUID = Field(
        foreign_key="racecheckpoint.id", nullable=False, ondelete="CASCADE"
    )
    recorded_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )

    # Relationships
    registration: RaceRegistration = Relationship(back_populates="split_times")
    checkpoint: RaceCheckpoint = Relationship(back_populates="split_times")


class RaceSplitTimePublic(RaceSplitTimeBase):
    id: uuid.UUID
    registration_id: uuid.UUID
    checkpoint_id: uuid.UUID
    recorded_at: datetime


class RaceSplitTimesPublic(SQLModel):
    data: list[RaceSplitTimePublic]
    count: int


# =============================================================================
# End of Race Models
# =============================================================================


# =============================================================================
# UserProfile - Runner preferences and personalization data
# =============================================================================


class UserProfileBase(SQLModel):
    fitness_level: FitnessEnum | None = Field(default=None, sa_column=Column(AutoString(), nullable=True))
    distance_preference: DistancePrefEnum | None = Field(default=None, sa_column=Column(AutoString(), nullable=True))
    terrain_preference: TerrainEnum | None = Field(default=None, sa_column=Column(AutoString(), nullable=True))
    home_latitude: float | None = Field(default=None, ge=-90, le=90)
    home_longitude: float | None = Field(default=None, ge=-180, le=180)
    home_city: str | None = Field(default=None, max_length=100)
    weekly_mileage_km: float | None = Field(default=None, ge=0)
    goal_race_date: date | None = None
    bio: str | None = Field(default=None, sa_column=Column(Text))
    is_onboarded: bool = Field(default=False)


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(SQLModel):
    fitness_level: FitnessEnum | None = None
    distance_preference: DistancePrefEnum | None = None
    terrain_preference: TerrainEnum | None = None
    home_latitude: float | None = None
    home_longitude: float | None = None
    home_city: str | None = None
    weekly_mileage_km: float | None = None
    goal_race_date: date | None = None
    bio: str | None = None
    is_onboarded: bool | None = None


class UserProfile(UserProfileBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", unique=True, ondelete="CASCADE", index=True
    )
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )

    user: User = Relationship(back_populates="profile")


class UserProfilePublic(UserProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


# =============================================================================
# UserRaceInteraction - Tracks views, saves, and shares for recommendations
# =============================================================================


class UserRaceInteraction(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(
        foreign_key="user.id", ondelete="CASCADE", index=True
    )
    race_id: uuid.UUID = Field(
        foreign_key="race.id", ondelete="CASCADE", index=True
    )
    action: InteractionTypeEnum = Field(sa_column=Column(AutoString(), nullable=False))
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )


class UserRaceInteractionPublic(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    race_id: uuid.UUID
    action: InteractionTypeEnum
    created_at: datetime


# =============================================================================
# Vietnam Administrative Master Data
# =============================================================================


class AdministrativeRegion(SQLModel, table=True):
    __tablename__ = "administrative_regions"

    id: int = Field(primary_key=True)
    name: str = Field(max_length=255)
    name_en: str = Field(max_length=255)
    code_name: str | None = Field(default=None, max_length=255)
    code_name_en: str | None = Field(default=None, max_length=255)


class AdministrativeRegionPublic(SQLModel):
    id: int
    name: str
    name_en: str
    code_name: str | None = None
    code_name_en: str | None = None


class AdministrativeUnit(SQLModel, table=True):
    __tablename__ = "administrative_units"

    id: int = Field(primary_key=True)
    full_name: str | None = Field(default=None, max_length=255)
    full_name_en: str | None = Field(default=None, max_length=255)
    short_name: str | None = Field(default=None, max_length=255)
    short_name_en: str | None = Field(default=None, max_length=255)
    code_name: str | None = Field(default=None, max_length=255)
    code_name_en: str | None = Field(default=None, max_length=255)

    provinces: list["Province"] = Relationship(back_populates="administrative_unit")
    wards: list["Ward"] = Relationship(back_populates="administrative_unit")


class AdministrativeUnitPublic(SQLModel):
    id: int
    full_name: str | None = None
    full_name_en: str | None = None
    short_name: str | None = None
    short_name_en: str | None = None
    code_name: str | None = None
    code_name_en: str | None = None


class Province(SQLModel, table=True):
    __tablename__ = "provinces"

    code: str = Field(primary_key=True, max_length=20)
    name: str = Field(max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    full_name: str = Field(max_length=255)
    full_name_en: str | None = Field(default=None, max_length=255)
    code_name: str | None = Field(default=None, max_length=255)
    administrative_unit_id: int | None = Field(
        default=None, foreign_key="administrative_units.id", index=True
    )

    administrative_unit: AdministrativeUnit | None = Relationship(
        back_populates="provinces"
    )
    wards: list["Ward"] = Relationship(back_populates="province")


class ProvincePublic(SQLModel):
    code: str
    name: str
    name_en: str | None = None
    full_name: str
    full_name_en: str | None = None
    code_name: str | None = None
    administrative_unit_id: int | None = None


class ProvincePublicWithDetails(ProvincePublic):
    administrative_unit: AdministrativeUnitPublic | None = None


class ProvincesPublic(SQLModel):
    data: list[ProvincePublic]
    count: int


class Ward(SQLModel, table=True):
    __tablename__ = "wards"

    code: str = Field(primary_key=True, max_length=20)
    name: str = Field(max_length=255)
    name_en: str | None = Field(default=None, max_length=255)
    full_name: str | None = Field(default=None, max_length=255)
    full_name_en: str | None = Field(default=None, max_length=255)
    code_name: str | None = Field(default=None, max_length=255)
    province_code: str | None = Field(
        default=None, foreign_key="provinces.code", index=True
    )
    administrative_unit_id: int | None = Field(
        default=None, foreign_key="administrative_units.id", index=True
    )

    province: Province | None = Relationship(back_populates="wards")
    administrative_unit: AdministrativeUnit | None = Relationship(
        back_populates="wards"
    )


class WardPublic(SQLModel):
    code: str
    name: str
    name_en: str | None = None
    full_name: str | None = None
    full_name_en: str | None = None
    code_name: str | None = None
    province_code: str | None = None
    administrative_unit_id: int | None = None


class WardPublicWithDetails(WardPublic):
    administrative_unit: AdministrativeUnitPublic | None = None


class WardsPublic(SQLModel):
    data: list[WardPublic]
    count: int


# =============================================================================
# End of Vietnam Administrative Master Data
# =============================================================================


# =============================================================================
# CMS Module Models
# =============================================================================


# Enum for CMS page status
class PageStatusEnum(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"
    ARCHIVED = "archived"


# Enum for blog post status
class BlogPostStatusEnum(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"
    ARCHIVED = "archived"


# =============================================================================
# MediaFolder - Organize media into folders
# =============================================================================


class MediaFolderBase(SQLModel):
    name: str = Field(min_length=1, max_length=255, index=True)
    description: str | None = Field(default=None, max_length=500)
    parent_id: uuid.UUID | None = None
    is_active: bool = True


class MediaFolderCreate(MediaFolderBase):
    pass


class MediaFolderUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
    parent_id: uuid.UUID | None = None
    is_active: bool | None = None


class MediaFolder(MediaFolderBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    parent_id: uuid.UUID | None = Field(default=None, foreign_key="mediafolder.id")
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)


class MediaFolderPublic(MediaFolderBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by_id: uuid.UUID


class MediaFoldersPublic(SQLModel):
    data: list[MediaFolderPublic]
    count: int


# =============================================================================
# Page - CMS pages with SEO and multilingual support
# =============================================================================


class PageBase(SQLModel):
    title: str = Field(min_length=1, max_length=255, index=True)
    slug: str = Field(min_length=1, max_length=255, unique=True, index=True)
    content: str | None = Field(default=None, sa_column=Column(Text))
    excerpt: str | None = Field(default=None, max_length=500)
    
    # SEO fields
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = Field(default=None, max_length=500)
    meta_keywords: str | None = Field(default=None, max_length=500)
    og_title: str | None = Field(default=None, max_length=255)
    og_description: str | None = Field(default=None, max_length=500)
    og_image_url: str | None = Field(default=None, max_length=1000)
    canonical_url: str | None = Field(default=None, max_length=1000)
    
    # Publishing
    status: PageStatusEnum = Field(
        default=PageStatusEnum.DRAFT,
        sa_column=Column(AutoString(), nullable=False),
    )
    published_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    scheduled_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    
    # Layout and visibility
    template: str = Field(default="default", max_length=50)
    is_homepage: bool = False
    is_visible_in_menu: bool = True
    display_order: int = Field(default=0)
    
    # Multi-language support
    default_language: str = Field(default="vi", max_length=10)
    translations: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    
    # Additional metadata
    page_metadata: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class PageCreate(PageBase):
    pass


class PageUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    content: str | None = None
    excerpt: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    meta_keywords: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image_url: str | None = None
    canonical_url: str | None = None
    status: PageStatusEnum | None = None
    published_at: datetime | None = None
    scheduled_at: datetime | None = None
    template: str | None = None
    is_homepage: bool | None = None
    is_visible_in_menu: bool | None = None
    display_order: int | None = None
    page_metadata: dict[str, Any] | None = None


class Page(PageBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")


class PagePublic(PageBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    created_by_id: uuid.UUID
    updated_by_id: uuid.UUID | None = None


class PagePublicWithDetails(PagePublic):
    view_count: int = 0


class PagesPublic(SQLModel):
    data: list[PagePublic]
    count: int


class PageTranslationUpdate(SQLModel):
    """Update translations for a page"""
    language: str = Field(min_length=2, max_length=10)
    title: str | None = Field(default=None, max_length=255)
    content: str | None = None
    excerpt: str | None = Field(default=None, max_length=500)
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = Field(default=None, max_length=500)


# =============================================================================
# BlogCategory - Categories for blog posts
# =============================================================================


class BlogCategoryBase(SQLModel):
    name: str = Field(min_length=1, max_length=100, unique=True, index=True)
    slug: str = Field(min_length=1, max_length=100, unique=True, index=True)
    description: str | None = Field(default=None, max_length=500)
    parent_id: uuid.UUID | None = None
    is_active: bool = True
    display_order: int = Field(default=0)
    
    # SEO fields
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = Field(default=None, max_length=500)
    
    # Multi-language support
    translations: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class BlogCategoryCreate(BlogCategoryBase):
    pass


class BlogCategoryUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=100)
    slug: str | None = Field(default=None, max_length=100)
    description: str | None = None
    parent_id: uuid.UUID | None = None
    is_active: bool | None = None
    display_order: int | None = None
    meta_title: str | None = None
    meta_description: str | None = None


class BlogCategory(BlogCategoryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    parent_id: uuid.UUID | None = Field(default=None, foreign_key="blogcategory.id")
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    
    # Relationships
    blog_posts: list["BlogPost"] = Relationship(back_populates="category")


class BlogCategoryPublic(BlogCategoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class BlogCategoryPublicWithDetails(BlogCategoryPublic):
    post_count: int = 0


class BlogCategoriesPublic(SQLModel):
    data: list[BlogCategoryPublic]
    count: int


class BlogCategoryTranslationUpdate(SQLModel):
    """Update translations for a blog category"""
    language: str = Field(min_length=2, max_length=10)
    name: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=500)


# =============================================================================
# BlogTag - Tags for blog posts
# =============================================================================


class BlogTagLink(SQLModel, table=True):
    """Junction table for many-to-many BlogPost ↔ BlogTag"""
    blog_post_id: uuid.UUID = Field(
        foreign_key="blogpost.id", primary_key=True, ondelete="CASCADE"
    )
    blog_tag_id: uuid.UUID = Field(
        foreign_key="blogtag.id", primary_key=True, ondelete="CASCADE"
    )


class BlogTagBase(SQLModel):
    name: str = Field(min_length=1, max_length=50, unique=True, index=True)
    slug: str = Field(min_length=1, max_length=50, unique=True, index=True)
    is_active: bool = True
    
    # Multi-language support
    translations: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class BlogTagCreate(BlogTagBase):
    pass


class BlogTagUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=50)
    slug: str | None = Field(default=None, max_length=50)
    is_active: bool | None = None


class BlogTag(BlogTagBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    
    # Relationships
    blog_posts: list["BlogPost"] = Relationship(
        back_populates="tags", link_model=BlogTagLink
    )


class BlogTagPublic(BlogTagBase):
    id: uuid.UUID
    created_at: datetime


class BlogTagPublicWithDetails(BlogTagPublic):
    post_count: int = 0


class BlogTagsPublic(SQLModel):
    data: list[BlogTagPublic]
    count: int


class BlogTagTranslationUpdate(SQLModel):
    """Update translations for a blog tag"""
    language: str = Field(min_length=2, max_length=10)
    name: str | None = Field(default=None, max_length=50)


# =============================================================================
# BlogPost - Blog articles
# =============================================================================


class BlogPostBase(SQLModel):
    title: str = Field(min_length=1, max_length=255, index=True)
    slug: str = Field(min_length=1, max_length=255, unique=True, index=True)
    content: str | None = Field(default=None, sa_column=Column(Text))
    excerpt: str | None = Field(default=None, max_length=500)
    
    # Featured image
    featured_image_url: str | None = Field(default=None, max_length=1000)
    featured_image_alt: str | None = Field(default=None, max_length=255)
    
    # SEO fields
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = Field(default=None, max_length=500)
    meta_keywords: str | None = Field(default=None, max_length=500)
    og_title: str | None = Field(default=None, max_length=255)
    og_description: str | None = Field(default=None, max_length=500)
    og_image_url: str | None = Field(default=None, max_length=1000)
    canonical_url: str | None = Field(default=None, max_length=1000)
    
    # Publishing
    status: BlogPostStatusEnum = Field(
        default=BlogPostStatusEnum.DRAFT,
        sa_column=Column(AutoString(), nullable=False),
    )
    published_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    scheduled_at: datetime | None = Field(
        default=None, sa_column=Column(DateTime(timezone=True))
    )
    
    # Featured and sticky
    is_featured: bool = False
    is_sticky: bool = False
    
    # Engagement metrics
    view_count: int = Field(default=0, ge=0)
    like_count: int = Field(default=0, ge=0)
    comment_count: int = Field(default=0, ge=0)
    
    # Reading time (in minutes)
    reading_time_minutes: int | None = Field(default=None, ge=1)
    
    # Multi-language support
    default_language: str = Field(default="vi", max_length=10)
    translations: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    
    # Additional metadata
    post_metadata: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class BlogPostCreate(BlogPostBase):
    category_id: uuid.UUID | None = None
    tag_ids: list[uuid.UUID] | None = None


class BlogPostUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    slug: str | None = Field(default=None, max_length=255)
    content: str | None = None
    excerpt: str | None = None
    featured_image_url: str | None = None
    featured_image_alt: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    meta_keywords: str | None = None
    og_title: str | None = None
    og_description: str | None = None
    og_image_url: str | None = None
    canonical_url: str | None = None
    status: BlogPostStatusEnum | None = None
    published_at: datetime | None = None
    scheduled_at: datetime | None = None
    is_featured: bool | None = None
    is_sticky: bool | None = None
    reading_time_minutes: int | None = None
    category_id: uuid.UUID | None = None
    tag_ids: list[uuid.UUID] | None = None
    post_metadata: dict[str, Any] | None = None


class BlogPost(BlogPostBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    
    # Foreign keys
    category_id: uuid.UUID | None = Field(default=None, foreign_key="blogcategory.id")
    author_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None = Field(default=None, foreign_key="user.id")
    
    # Relationships
    category: BlogCategory | None = Relationship(back_populates="blog_posts")
    tags: list[BlogTag] = Relationship(
        back_populates="blog_posts", link_model=BlogTagLink
    )


class BlogPostPublic(BlogPostBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    category_id: uuid.UUID | None = None
    author_id: uuid.UUID


class BlogPostPublicWithDetails(BlogPostPublic):
    category: BlogCategoryPublic | None = None
    tags: list[BlogTagPublic] = []
    author: UserPublic


class BlogPostsPublic(SQLModel):
    data: list[BlogPostPublic]
    count: int


class BlogPostTranslationUpdate(SQLModel):
    """Update translations for a blog post"""
    language: str = Field(min_length=2, max_length=10)
    title: str | None = Field(default=None, max_length=255)
    content: str | None = None
    excerpt: str | None = Field(default=None, max_length=500)
    meta_title: str | None = Field(default=None, max_length=255)
    meta_description: str | None = Field(default=None, max_length=500)


# =============================================================================
# Menu and MenuItem - Navigation management
# =============================================================================


class MenuBase(SQLModel):
    name: str = Field(min_length=1, max_length=100, unique=True, index=True)
    slug: str = Field(min_length=1, max_length=100, unique=True, index=True)
    description: str | None = Field(default=None, max_length=500)
    location: str = Field(default="header", max_length=50)  # header, footer, sidebar, etc.
    is_active: bool = True


class MenuCreate(MenuBase):
    pass


class MenuUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=100)
    slug: str | None = Field(default=None, max_length=100)
    description: str | None = None
    location: str | None = None
    is_active: bool | None = None


class Menu(MenuBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    
    # Relationships
    items: list["MenuItem"] = Relationship(back_populates="menu", cascade_delete=True)


class MenuPublic(MenuBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class MenuPublicWithItems(MenuPublic):
    items: list["MenuItemPublic"] = []


class MenusPublic(SQLModel):
    data: list[MenuPublic]
    count: int


class MenuItemBase(SQLModel):
    label: str = Field(min_length=1, max_length=100)
    url: str = Field(max_length=1000)
    title: str | None = Field(default=None, max_length=255)  # HTML title attribute
    target: str = Field(default="_self", max_length=20)  # _self, _blank, etc.
    icon: str | None = Field(default=None, max_length=50)  # Icon class or name
    parent_id: uuid.UUID | None = None
    display_order: int = Field(default=0)
    is_active: bool = True
    css_classes: str | None = Field(default=None, max_length=255)
    
    # Multi-language support
    translations: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class MenuItemCreate(MenuItemBase):
    menu_id: uuid.UUID


class MenuItemUpdate(SQLModel):
    label: str | None = Field(default=None, max_length=100)
    url: str | None = None
    title: str | None = None
    target: str | None = None
    icon: str | None = None
    parent_id: uuid.UUID | None = None
    display_order: int | None = None
    is_active: bool | None = None
    css_classes: str | None = None


class MenuItem(MenuItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    menu_id: uuid.UUID = Field(
        foreign_key="menu.id", nullable=False, ondelete="CASCADE"
    )
    parent_id: uuid.UUID | None = Field(default=None, foreign_key="menuitem.id")
    created_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc, sa_column=Column(DateTime(timezone=True))
    )
    
    # Relationships
    menu: Menu = Relationship(back_populates="items")


class MenuItemPublic(MenuItemBase):
    id: uuid.UUID
    menu_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class MenuItemsPublic(SQLModel):
    data: list[MenuItemPublic]
    count: int


class MenuItemTranslationUpdate(SQLModel):
    """Update translations for a menu item"""
    language: str = Field(min_length=2, max_length=10)
    label: str | None = Field(default=None, max_length=100)


# =============================================================================
# End of CMS Module Models
# =============================================================================


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
