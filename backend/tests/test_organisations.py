from app.models import (
    OrganisationDB,
    OrganisationMembershipDB,
    UserDB,
    VehicleDB,
)

from conftest import (
    TestingSessionLocal,
)


def create_account(
    client,
    email,
    full_name,
):
    password = "Password123"

    register_response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name,
        },
    )

    assert (
        register_response.status_code
        == 201
    )

    user_id = (
        register_response.json()["id"]
    )

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert (
        login_response.status_code
        == 200
    )

    token = (
        login_response.json()[
            "access_token"
        ]
    )

    headers = {
        "Authorization":
            f"Bearer {token}"
    }

    return (
        user_id,
        headers,
    )


def get_user_membership(
    user_id,
):
    db = TestingSessionLocal()

    try:
        membership = (
            db.query(
                OrganisationMembershipDB
            )
            .filter(
                OrganisationMembershipDB.user_id
                == user_id
            )
            .order_by(
                OrganisationMembershipDB.id
            )
            .first()
        )

        assert membership is not None

        return (
            membership.id,
            membership.organisation_id,
            membership.role,
        )

    finally:
        db.close()


def test_registration_creates_personal_workspace(
    client,
):
    response = client.post(
        "/auth/register",
        json={
            "email":
                "workspace@example.com",

            "password":
                "Password123",

            "full_name":
                "Workspace User",
        },
    )

    assert (
        response.status_code
        == 201
    )

    user_id = (
        response.json()["id"]
    )

    db = TestingSessionLocal()

    try:
        user = (
            db.query(UserDB)
            .filter(
                UserDB.id
                == user_id
            )
            .first()
        )

        assert user is not None

        membership = (
            db.query(
                OrganisationMembershipDB
            )
            .filter(
                OrganisationMembershipDB.user_id
                == user_id
            )
            .first()
        )

        assert membership is not None

        assert (
            membership.role
            == "owner"
        )

        organisation = (
            db.query(OrganisationDB)
            .filter(
                OrganisationDB.id
                == membership.organisation_id
            )
            .first()
        )

        assert organisation is not None

        assert (
            organisation.name
            == (
                "Workspace User's "
                "Workspace"
            )
        )

        assert (
            organisation.created_by_user_id
            == user_id
        )

        assert (
            organisation.is_active
            is True
        )

    finally:
        db.close()


def test_new_vehicle_is_attached_to_workspace(
    client,
):
    (
        user_id,
        headers,
    ) = create_account(
        client,
        "vehicleworkspace@example.com",
        "Vehicle Workspace User",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        user_id
    )

    response = client.post(
        "/vehicle",
        headers=headers,
        json={
            "registration":
                "WS24CAR",

            "make":
                "BMW",

            "model":
                "3 Series",

            "year":
                2024,
        },
    )

    assert (
        response.status_code
        == 200
    )

    db = TestingSessionLocal()

    try:
        vehicle = (
            db.query(VehicleDB)
            .filter(
                VehicleDB.registration
                == "WS24CAR"
            )
            .first()
        )

        assert vehicle is not None

        assert (
            vehicle.owner_id
            == user_id
        )

        assert (
            vehicle.organisation_id
            == organisation_id
        )

    finally:
        db.close()


def test_workspace_member_can_view_shared_vehicle(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "garageowner@example.com",
        "Garage Owner",
    )

    (
        member_id,
        member_headers,
    ) = create_account(
        client,
        "garagemember@example.com",
        "Garage Member",
    )

    (
        _,
        owner_organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    create_response = client.post(
        "/vehicle",
        headers=owner_headers,
        json={
            "registration":
                "TEAM24CAR",

            "make":
                "BMW",

            "model":
                "M3",

            "year":
                2024,
        },
    )

    assert (
        create_response.status_code
        == 200
    )

    db = TestingSessionLocal()

    try:
        shared_membership = (
            OrganisationMembershipDB(
                organisation_id=(
                    owner_organisation_id
                ),
                user_id=member_id,
                role="member",
            )
        )

        db.add(
            shared_membership
        )
        db.commit()

    finally:
        db.close()

    workspace_headers = {
        **member_headers,
        "X-Workspace-ID":
            str(
                owner_organisation_id
            ),
    }

    response = client.get(
        "/vehicles/TEAM24CAR",
        headers=workspace_headers,
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "registration"
        ]
        == "TEAM24CAR"
    )

    vehicle_list_response = (
        client.get(
            "/vehicles",
            headers=workspace_headers,
        )
    )

    assert (
        vehicle_list_response.status_code
        == 200
    )

    registrations = [
        vehicle["registration"]
        for vehicle
        in vehicle_list_response.json()
    ]

    assert (
        "TEAM24CAR"
        in registrations
    )


def test_user_outside_workspace_cannot_view_vehicle(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "privateowner@example.com",
        "Private Owner",
    )

    (
        _,
        outsider_headers,
    ) = create_account(
        client,
        "outsider@example.com",
        "Outside User",
    )

    (
        _,
        owner_organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    create_response = client.post(
        "/vehicle",
        headers=owner_headers,
        json={
            "registration":
                "LOCK24CAR",

            "make":
                "Audi",

            "model":
                "RS3",

            "year":
                2024,
        },
    )

    assert (
        create_response.status_code
        == 200
    )

    db = TestingSessionLocal()

    try:
        vehicle = (
            db.query(VehicleDB)
            .filter(
                VehicleDB.registration
                == "LOCK24CAR"
            )
            .first()
        )

        assert vehicle is not None

        assert (
            vehicle.organisation_id
            == owner_organisation_id
        )

    finally:
        db.close()

    response = client.get(
        "/vehicles/LOCK24CAR",
        headers=outsider_headers,
    )

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()["detail"]
        == "Vehicle not found"
    )


def test_platform_admin_can_view_other_workspace_vehicle(
    client,
):
    (
        _,
        owner_headers,
    ) = create_account(
        client,
        "businessowner@example.com",
        "Business Owner",
    )

    (
        admin_id,
        admin_headers,
    ) = create_account(
        client,
        "platformadmin@example.com",
        "Platform Admin",
    )

    create_response = client.post(
        "/vehicle",
        headers=owner_headers,
        json={
            "registration":
                "ADMIN24CAR",

            "make":
                "Mercedes",

            "model":
                "A35",

            "year":
                2024,
        },
    )

    assert (
        create_response.status_code
        == 200
    )

    db = TestingSessionLocal()

    try:
        admin = (
            db.query(UserDB)
            .filter(
                UserDB.id
                == admin_id
            )
            .first()
        )

        assert admin is not None

        admin.role = "admin"

        db.commit()

    finally:
        db.close()

    response = client.get(
        "/vehicles/ADMIN24CAR",
        headers=admin_headers,
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "registration"
        ]
        == "ADMIN24CAR"
    )


def test_owner_can_add_member(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "owneradd@example.com",
        "Owner Add",
    )

    create_account(
        client,
        "newmember@example.com",
        "New Member",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "newmember@example.com",

            "role":
                "member",
        },
    )

    assert (
        response.status_code
        == 201
    )

    assert (
        response.json()["role"]
        == "member"
    )

    assert (
        response.json()["email"]
        == "newmember@example.com"
    )


def test_owner_can_add_admin(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "owneradmin@example.com",
        "Owner Admin",
    )

    create_account(
        client,
        "newadmin@example.com",
        "New Admin",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "newadmin@example.com",

            "role":
                "admin",
        },
    )

    assert (
        response.status_code
        == 201
    )

    assert (
        response.json()["role"]
        == "admin"
    )


def test_admin_can_add_member(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "adminowner@example.com",
        "Admin Owner",
    )

    (
        _,
        admin_headers,
    ) = create_account(
        client,
        "workspaceadmin@example.com",
        "Workspace Admin",
    )

    create_account(
        client,
        "adminmember@example.com",
        "Admin Member",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    add_admin_response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "workspaceadmin@example.com",

            "role":
                "admin",
        },
    )

    assert (
        add_admin_response.status_code
        == 201
    )

    response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=admin_headers,
        json={
            "email":
                "adminmember@example.com",

            "role":
                "member",
        },
    )

    assert (
        response.status_code
        == 201
    )

    assert (
        response.json()["role"]
        == "member"
    )


def test_admin_cannot_add_another_admin(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "adminruleowner@example.com",
        "Admin Rule Owner",
    )

    (
        _,
        admin_headers,
    ) = create_account(
        client,
        "firstadmin@example.com",
        "First Admin",
    )

    create_account(
        client,
        "secondadmin@example.com",
        "Second Admin",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    setup_response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "firstadmin@example.com",

            "role":
                "admin",
        },
    )

    assert (
        setup_response.status_code
        == 201
    )

    response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=admin_headers,
        json={
            "email":
                "secondadmin@example.com",

            "role":
                "admin",
        },
    )

    assert (
        response.status_code
        == 403
    )

    assert (
        response.json()["detail"]
        == (
            "Only the workspace owner "
            "can add administrators"
        )
    )


def test_member_cannot_manage_members(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "memberruleowner@example.com",
        "Member Rule Owner",
    )

    (
        _,
        member_headers,
    ) = create_account(
        client,
        "normalmember@example.com",
        "Normal Member",
    )

    create_account(
        client,
        "targetmember@example.com",
        "Target Member",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    setup_response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "normalmember@example.com",

            "role":
                "member",
        },
    )

    assert (
        setup_response.status_code
        == 201
    )

    response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=member_headers,
        json={
            "email":
                "targetmember@example.com",

            "role":
                "member",
        },
    )

    assert (
        response.status_code
        == 403
    )

    assert (
        response.json()["detail"]
        == (
            "Workspace administrator "
            "access required"
        )
    )


def test_outsider_cannot_list_members(
    client,
):
    (
        owner_id,
        _,
    ) = create_account(
        client,
        "listowner@example.com",
        "List Owner",
    )

    (
        _,
        outsider_headers,
    ) = create_account(
        client,
        "listoutsider@example.com",
        "List Outsider",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    response = client.get(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=outsider_headers,
    )

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()["detail"]
        == "Organisation not found"
    )


def test_owner_role_cannot_be_changed(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "fixedowner@example.com",
        "Fixed Owner",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    response = client.patch(
        (
            f"/organisations/"
            f"{organisation_id}/members/"
            f"{owner_id}"
        ),
        headers=owner_headers,
        json={
            "role":
                "member",
        },
    )

    assert (
        response.status_code
        == 400
    )

    assert (
        response.json()["detail"]
        == (
            "Workspace owner role "
            "cannot be changed here"
        )
    )


def test_owner_cannot_be_removed(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "removeowner@example.com",
        "Remove Owner",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    response = client.delete(
        (
            f"/organisations/"
            f"{organisation_id}/members/"
            f"{owner_id}"
        ),
        headers=owner_headers,
    )

    assert (
        response.status_code
        == 400
    )

    assert (
        response.json()["detail"]
        == (
            "Workspace owner cannot "
            "be removed"
        )
    )


def test_duplicate_membership_is_blocked(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account(
        client,
        "duplicateowner@example.com",
        "Duplicate Owner",
    )

    create_account(
        client,
        "duplicatemember@example.com",
        "Duplicate Member",
    )

    (
        _,
        organisation_id,
        _,
    ) = get_user_membership(
        owner_id
    )

    first_response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "duplicatemember@example.com",

            "role":
                "member",
        },
    )

    assert (
        first_response.status_code
        == 201
    )

    second_response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "duplicatemember@example.com",

            "role":
                "member",
        },
    )

    assert (
        second_response.status_code
        == 409
    )

    assert (
        second_response.json()["detail"]
        == (
            "User is already a member "
            "of this workspace"
        )
    )


def test_multiple_workspaces_require_selection(
    client,
):
    (
        user_id,
        headers,
    ) = create_account(
        client,
        "multiworkspace@example.com",
        "Multi Workspace",
    )

    create_response = client.post(
        "/organisations",
        headers=headers,
        json={
            "name":
                "Second Workspace",
        },
    )

    assert (
        create_response.status_code
        == 201
    )

    response = client.get(
        "/vehicles",
        headers=headers,
    )

    assert (
        response.status_code
        == 409
    )

    assert (
        response.json()["detail"]
        == (
            "Multiple workspaces available. "
            "Select one using X-Workspace-ID"
        )
    )


def test_workspace_header_switches_vehicle_context(
    client,
):
    (
        user_id,
        headers,
    ) = create_account(
        client,
        "switcher@example.com",
        "Workspace Switcher",
    )

    (
        _,
        first_workspace_id,
        _,
    ) = get_user_membership(
        user_id
    )

    second_response = client.post(
        "/organisations",
        headers=headers,
        json={
            "name":
                "Garage Two",
        },
    )

    assert (
        second_response.status_code
        == 201
    )

    second_workspace_id = (
        second_response.json()["id"]
    )

    first_headers = {
        **headers,
        "X-Workspace-ID":
            str(first_workspace_id),
    }

    second_headers = {
        **headers,
        "X-Workspace-ID":
            str(second_workspace_id),
    }

    first_vehicle = client.post(
        "/vehicle",
        headers=first_headers,
        json={
            "registration":
                "FIRST24",

            "make":
                "BMW",

            "model":
                "M3",

            "year":
                2024,
        },
    )

    assert (
        first_vehicle.status_code
        == 200
    )

    second_vehicle = client.post(
        "/vehicle",
        headers=second_headers,
        json={
            "registration":
                "SECOND24",

            "make":
                "Audi",

            "model":
                "RS3",

            "year":
                2024,
        },
    )

    assert (
        second_vehicle.status_code
        == 200
    )

    first_list = client.get(
        "/vehicles",
        headers=first_headers,
    )

    assert (
        first_list.status_code
        == 200
    )

    first_registrations = [
        vehicle["registration"]
        for vehicle
        in first_list.json()
    ]

    assert (
        first_registrations
        == ["FIRST24"]
    )

    second_list = client.get(
        "/vehicles",
        headers=second_headers,
    )

    assert (
        second_list.status_code
        == 200
    )

    second_registrations = [
        vehicle["registration"]
        for vehicle
        in second_list.json()
    ]

    assert (
        second_registrations
        == ["SECOND24"]
    )