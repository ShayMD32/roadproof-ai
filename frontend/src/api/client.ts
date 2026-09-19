const API_BASE_URL =
  'http://127.0.0.1:8000'

const TOKEN_KEY =
  'roadproof_access_token'


export type AuthUser = {
  id: number
  email: string
  full_name: string
  is_active: boolean
  created_at: string
}


export type RegisterInput = {
  email: string
  password: string
  full_name: string
}


export type LoginInput = {
  email: string
  password: string
}


export type LoginResponse = {
  access_token: string
  token_type: string
  user: AuthUser
}


export type Vehicle = {
  id: number
  registration: string
  make: string
  model: string
  year: number
}


export type DamageImage = {
  id: number
  filename: string
  file_path: string
  vehicle_id: number
}


export type VehicleInspectionSummary = {
  registration: string

  vehicle: {
    registration: string
    make: string
    model: string
    year: number
  }

  total_images: number
  total_inspections: number
  damage_detected: boolean
  total_damage_detections: number

  latest_severity:
    | string
    | null

  latest_severity_score:
    | number
    | null

  latest_inspection_id:
    | number
    | null

  latest_inspection_confidence:
    | string
    | null

  latest_manual_review_required:
    | boolean
    | null
}


export type CreateVehicleInput = {
  registration: string
  make: string
  model: string
  year: number
}


export type UpdateVehicleInput = {
  registration: string
  make: string
  model: string
  year: number
}


export type InspectionReview = {
  inspection_confidence: string

  manual_review_required: boolean

  manual_review_reasons: string[]

  weak_signal_count: number

  highest_candidate_confidence:
    | number
    | null
}


export type ModelThresholds = {
  scan_threshold: number

  acceptance_threshold: number

  review_signal_threshold: number
}


export type DamageDetection = {
  id: number

  damage_type: string

  confidence: number

  bounding_box: {
    x1: number
    y1: number
    x2: number
    y2: number
  }

  segmentation: Record<
    string,
    unknown
  >[]
}


export type InspectionResult = {
  id: number

  image_id: number

  status: string

  damage_detected: boolean

  damage_count: number

  highest_confidence:
    | number
    | null

  severity:
    | string
    | null

  severity_score:
    | number
    | null

  severity_factors: Record<
    string,
    unknown
  >

  review:
    | InspectionReview
    | null

  model_thresholds:
    | ModelThresholds
    | null

  model: {
    repository: string
    checkpoint: string
    confidence_threshold: number
  }

  detections: DamageDetection[]
}


export type AnalyseDamageImageResponse = {
  message: string

  inspection: InspectionResult
}


export type InspectionReport = {
  inspection_id: number

  created_at: string

  status: string

  vehicle: {
    registration: string
    make: string
    model: string
    year: number
  }

  image: {
    id: number
    filename: string
  }

  summary: {
    damage_detected: boolean

    damage_count: number

    highest_confidence:
      | number
      | null

    severity:
      | string
      | null

    severity_score:
      | number
      | null

    severity_factors: Record<
      string,
      unknown
    >

    review:
      | InspectionReview
      | null

    model_thresholds:
      | ModelThresholds
      | null
  }

  detections: DamageDetection[]

  model: {
    repository: string
    checkpoint: string
    confidence_threshold: number
  }
}


export type DashboardInspection = {
  id: number

  damage_detected: boolean

  damage_count: number

  severity:
    | string
    | null

  severity_score:
    | number
    | null

  inspection_confidence:
    | string
    | null

  manual_review_required:
    | boolean
    | null

  created_at: string

  registration: string

  make: string

  model: string
}


export type DashboardSummary = {
  total_vehicles: number

  total_inspections: number

  damage_detected: number

  clear_inspections: number

  manual_review_count: number

  recent_inspections:
    DashboardInspection[]
}


// --------------------------------------------------
// Token helpers
// --------------------------------------------------


export function getAccessToken():
  | string
  | null {
  return localStorage.getItem(
    TOKEN_KEY,
  )
}


export function saveAccessToken(
  token: string,
) {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  )
}


export function clearAccessToken() {
  localStorage.removeItem(
    TOKEN_KEY,
  )
}


export function isAuthenticated():
  boolean {
  return Boolean(
    getAccessToken(),
  )
}


// --------------------------------------------------
// Shared authenticated fetch
// --------------------------------------------------


async function authenticatedFetch(
  input: string,
  init: RequestInit = {},
) {
  const token =
    getAccessToken()

  const headers =
    new Headers(
      init.headers,
    )

  if (token) {
    headers.set(
      'Authorization',
      `Bearer ${token}`,
    )
  }

  const response =
    await fetch(
      input,
      {
        ...init,
        headers,
      },
    )

  if (
    response.status === 401
  ) {
    clearAccessToken()
  }

  return response
}


async function getErrorMessage(
  response: Response,
  fallback: string,
) {
  try {
    const data =
      await response.json()

    if (
      typeof data.detail ===
      'string'
    ) {
      return data.detail
    }

    return fallback
  } catch {
    return fallback
  }
}


// --------------------------------------------------
// Authentication
// --------------------------------------------------


export async function registerUser(
  input: RegisterInput,
): Promise<AuthUser> {
  const response =
    await fetch(
      `${API_BASE_URL}/auth/register`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify(
          input,
        ),
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to create account',
      ),
    )
  }

  return response.json()
}


export async function loginUser(
  input: LoginInput,
): Promise<LoginResponse> {
  const response =
    await fetch(
      `${API_BASE_URL}/auth/login`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify(
          input,
        ),
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Login failed',
      ),
    )
  }

  const data: LoginResponse =
    await response.json()

  saveAccessToken(
    data.access_token,
  )

  return data
}


export async function getCurrentUser(
): Promise<AuthUser> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/auth/me`,
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Unable to load user',
      ),
    )
  }

  return response.json()
}


export function logoutUser() {
  clearAccessToken()
}


// --------------------------------------------------
// Vehicles
// --------------------------------------------------


export async function getVehicles(
): Promise<Vehicle[]> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/vehicles`,
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to load vehicles',
      ),
    )
  }

  return response.json()
}


export async function getVehicle(
  registration: string,
): Promise<Vehicle> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/vehicles/${registration}`,
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to load vehicle',
      ),
    )
  }

  return response.json()
}


export async function createVehicle(
  vehicle: CreateVehicleInput,
): Promise<Vehicle> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/vehicle`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify(
          vehicle,
        ),
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to create vehicle',
      ),
    )
  }

  const data =
    await response.json()

  return data.vehicle
}


export async function updateVehicle(
  currentRegistration: string,
  vehicle: UpdateVehicleInput,
): Promise<Vehicle> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/vehicles/${currentRegistration}`,
      {
        method: 'PUT',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify(
          vehicle,
        ),
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to update vehicle',
      ),
    )
  }

  const data =
    await response.json()

  return data.vehicle
}


export async function deleteVehicle(
  registration: string,
) {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/vehicles/${registration}/full`,
      {
        method: 'DELETE',
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to delete vehicle',
      ),
    )
  }

  return response.json()
}


export async function getVehicleDamageImages(
  registration: string,
): Promise<DamageImage[]> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/vehicles/${registration}/damage-images`,
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to load damage images',
      ),
    )
  }

  const data =
    await response.json()

  return data.images
}


export async function uploadDamageImage(
  registration: string,
  file: File,
) {
  const formData =
    new FormData()

  formData.append(
    'image',
    file,
  )

  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/vehicles/${registration}/damage-image`,
      {
        method: 'POST',
        body: formData,
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to upload damage image',
      ),
    )
  }

  return response.json()
}


export async function deleteDamageImage(
  imageId: number,
) {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/damage-images/${imageId}`,
      {
        method: 'DELETE',
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to delete image',
      ),
    )
  }

  return response.json()
}


// --------------------------------------------------
// Inspections
// --------------------------------------------------


export async function analyseDamageImage(
  imageId: number,
): Promise<AnalyseDamageImageResponse> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/damage-images/${imageId}/analyse`,
      {
        method: 'POST',
      },
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Damage analysis failed',
      ),
    )
  }

  return response.json()
}


export async function getVehicleInspectionSummary(
  registration: string,
): Promise<VehicleInspectionSummary> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/vehicles/${registration}/inspection-summary`,
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to load inspection summary',
      ),
    )
  }

  return response.json()
}


export async function getInspectionReport(
  inspectionId: number,
): Promise<InspectionReport> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/inspections/${inspectionId}/report`,
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to load inspection report',
      ),
    )
  }

  const data =
    await response.json()

  return data.report
}


// --------------------------------------------------
// Dashboard
// --------------------------------------------------


export async function getDashboardSummary(
): Promise<DashboardSummary> {
  const response =
    await authenticatedFetch(
      `${API_BASE_URL}/dashboard/summary`,
    )

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        'Failed to load dashboard summary',
      ),
    )
  }

  return response.json()
}