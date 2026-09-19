"""add organisations and memberships

Revision ID: f5d5f10146fd
Revises: 62f3dd1f63aa
Create Date: 2026-09-19 14:48:13.180009

"""

from typing import (
    Sequence,
    Union,
)

from alembic import op
import sqlalchemy as sa


# revision identifiers,
# used by Alembic.
revision: str = (
    "f5d5f10146fd"
)

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "62f3dd1f63aa"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "organisations",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "name",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "created_by_user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            [
                "created_by_user_id",
            ],
            [
                "users.id",
            ],
        ),

        sa.PrimaryKeyConstraint(
            "id",
        ),
    )


    op.create_index(
        op.f(
            "ix_organisations_"
            "created_by_user_id"
        ),
        "organisations",
        [
            "created_by_user_id",
        ],
        unique=False,
    )


    op.create_index(
        op.f(
            "ix_organisations_id"
        ),
        "organisations",
        [
            "id",
        ],
        unique=False,
    )


    op.create_table(
        "organisation_memberships",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "organisation_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),

        sa.Column(
            "role",
            sa.String(),
            nullable=False,
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),

        sa.ForeignKeyConstraint(
            [
                "organisation_id",
            ],
            [
                "organisations.id",
            ],
        ),

        sa.ForeignKeyConstraint(
            [
                "user_id",
            ],
            [
                "users.id",
            ],
        ),

        sa.PrimaryKeyConstraint(
            "id",
        ),

        sa.UniqueConstraint(
            "organisation_id",
            "user_id",
            name=(
                "uq_organisation_"
                "membership_user"
            ),
        ),
    )


    op.create_index(
        op.f(
            "ix_organisation_"
            "memberships_id"
        ),
        "organisation_memberships",
        [
            "id",
        ],
        unique=False,
    )


    op.create_index(
        op.f(
            "ix_organisation_"
            "memberships_"
            "organisation_id"
        ),
        "organisation_memberships",
        [
            "organisation_id",
        ],
        unique=False,
    )


    op.create_index(
        op.f(
            "ix_organisation_"
            "memberships_user_id"
        ),
        "organisation_memberships",
        [
            "user_id",
        ],
        unique=False,
    )


    with op.batch_alter_table(
        "vehicles",
    ) as batch_op:

        batch_op.add_column(
            sa.Column(
                "organisation_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_index(
            op.f(
                "ix_vehicles_"
                "organisation_id"
            ),
            [
                "organisation_id",
            ],
            unique=False,
        )

        batch_op.create_foreign_key(
            (
                "fk_vehicles_"
                "organisation_id_"
                "organisations"
            ),
            "organisations",
            [
                "organisation_id",
            ],
            [
                "id",
            ],
        )


def downgrade() -> None:
    """Downgrade schema."""

    with op.batch_alter_table(
        "vehicles",
    ) as batch_op:

        batch_op.drop_constraint(
            (
                "fk_vehicles_"
                "organisation_id_"
                "organisations"
            ),
            type_="foreignkey",
        )

        batch_op.drop_index(
            op.f(
                "ix_vehicles_"
                "organisation_id"
            ),
        )

        batch_op.drop_column(
            "organisation_id",
        )


    op.drop_index(
        op.f(
            "ix_organisation_"
            "memberships_user_id"
        ),
        table_name=(
            "organisation_memberships"
        ),
    )


    op.drop_index(
        op.f(
            "ix_organisation_"
            "memberships_"
            "organisation_id"
        ),
        table_name=(
            "organisation_memberships"
        ),
    )


    op.drop_index(
        op.f(
            "ix_organisation_"
            "memberships_id"
        ),
        table_name=(
            "organisation_memberships"
        ),
    )


    op.drop_table(
        "organisation_memberships"
    )


    op.drop_index(
        op.f(
            "ix_organisations_id"
        ),
        table_name="organisations",
    )


    op.drop_index(
        op.f(
            "ix_organisations_"
            "created_by_user_id"
        ),
        table_name="organisations",
    )


    op.drop_table(
        "organisations"
    )