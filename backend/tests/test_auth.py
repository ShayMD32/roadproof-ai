from app.auth import (
    hash_password,
    verify_password,
)


def test_password_hashing():
    password = "password123"

    hashed = hash_password(
        password
    )

    assert hashed != password

    assert verify_password(
        password,
        hashed,
    ) is True

    assert verify_password(
        "wrong-password",
        hashed,
    ) is False


def test_register_user(
    client,
):
    response = client.post(
        "/auth/register",
        json={
            "email":
                "test@example.com",
            "password":
                "password123",
            "full_name":
                "Test User",
        },
    )

    assert (
        response.status_code
        == 201
    )

    data = response.json()

    assert (
        data["email"]
        == "test@example.com"
    )

    assert (
        data["full_name"]
        == "Test User"
    )

    assert (
        data["is_active"]
        is True
    )

    assert (
        "password_hash"
        not in data
    )


def test_register_duplicate_email(
    client,
):
    payload = {
        "email":
            "duplicate@example.com",
        "password":
            "password123",
        "full_name":
            "Duplicate User",
    }

    first_response = client.post(
        "/auth/register",
        json=payload,
    )

    assert (
        first_response.status_code
        == 201
    )

    second_response = client.post(
        "/auth/register",
        json=payload,
    )

    assert (
        second_response.status_code
        == 409
    )


def test_register_rejects_short_password(
    client,
):
    response = client.post(
        "/auth/register",
        json={
            "email":
                "short@example.com",
            "password":
                "short",
            "full_name":
                "Short Password",
        },
    )

    assert (
        response.status_code
        == 400
    )


def test_login_success(
    client,
):
    register_response = client.post(
        "/auth/register",
        json={
            "email":
                "login@example.com",
            "password":
                "password123",
            "full_name":
                "Login User",
        },
    )

    assert (
        register_response.status_code
        == 201
    )

    response = client.post(
        "/auth/login",
        json={
            "email":
                "login@example.com",
            "password":
                "password123",
        },
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        "access_token"
        in data
    )

    assert (
        data["token_type"]
        == "bearer"
    )

    assert (
        data["user"]["email"]
        == "login@example.com"
    )


def test_login_rejects_bad_password(
    client,
):
    register_response = client.post(
        "/auth/register",
        json={
            "email":
                "wrong@example.com",
            "password":
                "password123",
            "full_name":
                "Wrong Password",
        },
    )

    assert (
        register_response.status_code
        == 201
    )

    response = client.post(
        "/auth/login",
        json={
            "email":
                "wrong@example.com",
            "password":
                "incorrect123",
        },
    )

    assert (
        response.status_code
        == 401
    )


def test_get_current_user(
    client,
):
    register_response = client.post(
        "/auth/register",
        json={
            "email":
                "me@example.com",
            "password":
                "password123",
            "full_name":
                "Current User",
        },
    )

    assert (
        register_response.status_code
        == 201
    )

    login_response = client.post(
        "/auth/login",
        json={
            "email":
                "me@example.com",
            "password":
                "password123",
        },
    )

    assert (
        login_response.status_code
        == 200
    )

    token = (
        login_response
        .json()[
            "access_token"
        ]
    )

    response = client.get(
        "/auth/me",
        headers={
            "Authorization":
                f"Bearer {token}"
        },
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["email"]
        == "me@example.com"
    )

    assert (
        data["full_name"]
        == "Current User"
    )


def test_get_current_user_rejects_invalid_token(
    client,
):
    response = client.get(
        "/auth/me",
        headers={
            "Authorization":
                (
                    "Bearer "
                    "definitely-not-valid"
                )
        },
    )

    assert (
        response.status_code
        == 401
    )