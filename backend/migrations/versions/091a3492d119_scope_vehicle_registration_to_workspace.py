"""scope vehicle registration to workspace

Revision ID: 091a3492d119
Revises: a114e3d23f2a
Create Date: 2026-09-19 15:48:11.199082

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "091a3492d119"
down_revision: Union[
    str,
    Sequence[str],
    None,
] = "a114e3d23f2a"
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
    with op.batch_alter_table(
        "vehicles"
    ) as batch_op:
        batch_op.drop_constraint(
            "uq_vehicle_owner_registration",
            type_="unique",
        )

        batch_op.create_unique_constraint(
            (
                "uq_vehicle_organisation_"
                "registration"
            ),
            [
                "organisation_id",
                "registration",
            ],
        )


def downgrade() -> None:
    with op.batch_alter_table(
        "vehicles"
    ) as batch_op:
        batch_op.drop_constraint(
            (
                "uq_vehicle_organisation_"
                "registration"
            ),
            type_="unique",
        )

        batch_op.create_unique_constraint(
            "uq_vehicle_owner_registration",
            [
                "owner_id",
                "registration",
            ],
        )