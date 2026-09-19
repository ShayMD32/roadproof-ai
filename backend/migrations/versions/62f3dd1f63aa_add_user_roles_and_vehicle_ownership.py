"""add user roles and vehicle ownership

Revision ID: 62f3dd1f63aa
Revises: 3cd7ff263516
Create Date: 2026-09-19 13:52:39.034936

"""

from typing import (
    Sequence,
    Union,
)

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = (
    "62f3dd1f63aa"
)

down_revision: (
    Union[
        str,
        Sequence[str],
        None,
    ]
) = "3cd7ff263516"

branch_labels: (
    Union[
        str,
        Sequence[str],
        None,
    ]
) = None

depends_on: (
    Union[
        str,
        Sequence[str],
        None,
    ]
) = None


def upgrade() -> None:
    """Add roles and vehicle ownership."""

    # Existing users are safely given
    # the standard "user" role.
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(),
            nullable=False,
            server_default="user",
        ),
    )

    # SQLite requires batch mode for
    # constraint and foreign-key changes.
    with op.batch_alter_table(
        "vehicles",
        recreate="always",
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "owner_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.drop_index(
            "ix_vehicles_registration"
        )

        batch_op.create_index(
            "ix_vehicles_registration",
            ["registration"],
            unique=False,
        )

        batch_op.create_index(
            "ix_vehicles_owner_id",
            ["owner_id"],
            unique=False,
        )

        batch_op.create_unique_constraint(
            "uq_vehicle_owner_registration",
            [
                "owner_id",
                "registration",
            ],
        )

        batch_op.create_foreign_key(
            "fk_vehicles_owner_id_users",
            "users",
            ["owner_id"],
            ["id"],
        )


def downgrade() -> None:
    """Remove roles and vehicle ownership."""

    with op.batch_alter_table(
        "vehicles",
        recreate="always",
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_vehicles_owner_id_users",
            type_="foreignkey",
        )

        batch_op.drop_constraint(
            "uq_vehicle_owner_registration",
            type_="unique",
        )

        batch_op.drop_index(
            "ix_vehicles_owner_id"
        )

        batch_op.drop_index(
            "ix_vehicles_registration"
        )

        batch_op.create_index(
            "ix_vehicles_registration",
            ["registration"],
            unique=True,
        )

        batch_op.drop_column(
            "owner_id"
        )

    op.drop_column(
        "users",
        "role",
    )