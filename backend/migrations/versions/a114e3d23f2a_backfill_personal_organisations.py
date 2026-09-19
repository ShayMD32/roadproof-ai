"""backfill personal organisations

Revision ID: a114e3d23f2a
Revises: f5d5f10146fd
Create Date: 2026-09-19 14:57:05.855903

"""

from typing import (
    Sequence,
    Union,
)

from alembic import op
import sqlalchemy as sa


revision: str = "a114e3d23f2a"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "f5d5f10146fd"

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
    """Create a personal workspace
    for each existing user and attach
    their current vehicles to it.
    """

    connection = op.get_bind()

    users = connection.execute(
        sa.text(
            """
            SELECT
                id,
                full_name
            FROM users
            ORDER BY id
            """
        )
    ).mappings().all()

    for user in users:
        user_id = user["id"]

        full_name = (
            user["full_name"]
            or "RoadProof User"
        ).strip()

        workspace_name = (
            f"{full_name}'s Workspace"
        )

        result = connection.execute(
            sa.text(
                """
                INSERT INTO organisations (
                    name,
                    created_by_user_id,
                    is_active,
                    created_at
                )
                VALUES (
                    :name,
                    :user_id,
                    1,
                    CURRENT_TIMESTAMP
                )
                """
            ),
            {
                "name": workspace_name,
                "user_id": user_id,
            },
        )

        organisation_id = result.lastrowid

        connection.execute(
            sa.text(
                """
                INSERT INTO organisation_memberships (
                    organisation_id,
                    user_id,
                    role,
                    created_at
                )
                VALUES (
                    :organisation_id,
                    :user_id,
                    'owner',
                    CURRENT_TIMESTAMP
                )
                """
            ),
            {
                "organisation_id": organisation_id,
                "user_id": user_id,
            },
        )

        connection.execute(
            sa.text(
                """
                UPDATE vehicles
                SET organisation_id = :organisation_id
                WHERE owner_id = :user_id
                  AND organisation_id IS NULL
                """
            ),
            {
                "organisation_id": organisation_id,
                "user_id": user_id,
            },
        )


def downgrade() -> None:
    """Remove the personal workspaces
    created by this migration.
    """

    connection = op.get_bind()

    organisations = connection.execute(
        sa.text(
            """
            SELECT DISTINCT
                o.id
            FROM organisations AS o
            INNER JOIN organisation_memberships AS m
                ON m.organisation_id = o.id
            WHERE
                m.user_id = o.created_by_user_id
                AND m.role = 'owner'
            """
        )
    ).mappings().all()

    for organisation in organisations:
        organisation_id = organisation["id"]

        connection.execute(
            sa.text(
                """
                UPDATE vehicles
                SET organisation_id = NULL
                WHERE organisation_id = :organisation_id
                """
            ),
            {
                "organisation_id": organisation_id,
            },
        )

        connection.execute(
            sa.text(
                """
                DELETE FROM organisation_memberships
                WHERE organisation_id = :organisation_id
                """
            ),
            {
                "organisation_id": organisation_id,
            },
        )

        connection.execute(
            sa.text(
                """
                DELETE FROM organisations
                WHERE id = :organisation_id
                """
            ),
            {
                "organisation_id": organisation_id,
            },
        )