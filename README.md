# RoadProof AI

RoadProof AI is an AI-assisted vehicle inspection platform designed to help users upload vehicle damage images, analyse them using computer vision, review inspection results, and manage vehicle history across separate workspaces.

The project combines a FastAPI backend, React frontend, SQLAlchemy database layer, workspace-based access control, audit logging, protected image access, and an AI damage-detection pipeline.

---

## Overview

RoadProof AI was built as a full-stack portfolio project focused on practical software engineering rather than just model inference.

The platform supports:

- user registration and authentication
- vehicle management
- damage image uploads
- AI-assisted vehicle damage analysis
- inspection reports
- confidence and manual-review workflows
- severity assessment
- multi-workspace organisations
- workspace roles and permissions
- protected image access
- audit logging
- report pagination
- workspace-specific dashboards

The system is designed so that AI output assists inspection decisions rather than being treated as unquestionable ground truth.

---

## Key Features

### Authentication

Users can:

- create an account
- log in
- log out
- access protected application routes

Authentication is required for vehicle, inspection, report, image and workspace data.

---

### Vehicle Management

Users can:

- create vehicles
- view vehicle details
- update vehicle information
- view vehicle inspection history
- delete vehicles when permitted

Vehicle registration uniqueness is scoped to a workspace rather than globally.

---

### AI-Assisted Damage Analysis

Uploaded vehicle images can be processed by the inspection engine.

The system records:

- detected damage
- detection confidence
- bounding boxes
- damage count
- severity
- severity score
- model metadata
- manual-review status
- inspection confidence

The project uses Ultralytics / YOLO tooling as part of the computer-vision pipeline.

---

### Confidence and Manual Review

RoadProof does not treat every AI signal as confirmed damage.

The inspection workflow separates:

- weak AI signals
- accepted detections
- inspection confidence
- manual-review requirements

Current model thresholds include:

- scan threshold: `1%`
- manual-review signal threshold: `5%`
- accepted damage threshold: `25%`

Low-confidence or uncertain results can be flagged for manual review.

The interface uses terms such as:

- `Damage confirmed`
- `No confirmed damage`
- `Manual review required`
- `Not inspected`

rather than presenting uncertain AI output as fact.

> RoadProof uses AI to assist damage assessment. Model confidence is not a calibrated probability of vehicle condition. Results should not replace a professional inspection where uncertainty or significant damage is suspected.

---

### Inspection Reports

Each completed inspection generates a report containing:

- vehicle information
- uploaded inspection image
- inspection status
- accepted detections
- confidence information
- severity assessment
- manual-review reasons
- model thresholds
- model metadata

The report history supports pagination and displays five reports per page.

---

### Protected Images

Uploaded damage images are not exposed directly through raw filesystem paths.

Images are accessed through authenticated backend endpoints.

The frontend requests protected images using the current authentication token and converts the response into a temporary browser object URL.

This prevents local server file paths from being exposed through the public API.

---

## Workspaces and Organisations

RoadProof supports separate organisational workspaces.

Each workspace has isolated:

- vehicles
- inspections
- reports
- uploaded images

Users can belong to more than one workspace.

The frontend provides a workspace selector, and the selected workspace is sent to the backend using:

```text
X-Workspace-ID