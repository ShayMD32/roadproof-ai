const API_BASE_URL = 'http://127.0.0.1:8000'


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

  latest_severity: string | null
  latest_severity_score: number | null
  latest_inspection_id: number | null

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


export async function getVehicles(
): Promise<Vehicle[]> {
  const response = await fetch(
    `${API_BASE_URL}/vehicles`,
  )

  if (!response.ok) {
    throw new Error(
      'Failed to load vehicles',
    )
  }

  return response.json()
}


export async function getVehicle(
  registration: string,
): Promise<Vehicle> {
  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}`,
  )

  if (!response.ok) {
    throw new Error(
      'Failed to load vehicle',
    )
  }

  return response.json()
}


export async function createVehicle(
  vehicle: CreateVehicleInput,
): Promise<Vehicle> {
  const response = await fetch(
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
    const error =
      await response.json()

    throw new Error(
      error.detail ||
        'Failed to create vehicle',
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
  const response = await fetch(
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
    const error =
      await response.json()

    throw new Error(
      error.detail ||
        'Failed to update vehicle',
    )
  }

  const data =
    await response.json()

  return data.vehicle
}


export async function deleteVehicle(
  registration: string,
) {
  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}/full`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    const error =
      await response.json()

    throw new Error(
      error.detail ||
        'Failed to delete vehicle',
    )
  }

  return response.json()
}


export async function getVehicleDamageImages(
  registration: string,
): Promise<DamageImage[]> {
  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}/damage-images`,
  )

  if (!response.ok) {
    throw new Error(
      'Failed to load damage images',
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

  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}/damage-image`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    const error =
      await response.json()

    throw new Error(
      error.detail ||
        'Failed to upload damage image',
    )
  }

  return response.json()
}


export async function deleteDamageImage(
  imageId: number,
) {
  const response = await fetch(
    `${API_BASE_URL}/damage-images/${imageId}`,
    {
      method: 'DELETE',
    },
  )

  if (!response.ok) {
    const error =
      await response.json()

    throw new Error(
      error.detail ||
        'Failed to delete image',
    )
  }

  return response.json()
}


export async function analyseDamageImage(
  imageId: number,
): Promise<AnalyseDamageImageResponse> {
  const response = await fetch(
    `${API_BASE_URL}/damage-images/${imageId}/analyse`,
    {
      method: 'POST',
    },
  )

  if (!response.ok) {
    const error =
      await response.json()

    throw new Error(
      error.detail ||
        'Damage analysis failed',
    )
  }

  return response.json()
}


export async function getVehicleInspectionSummary(
  registration: string,
): Promise<VehicleInspectionSummary> {
  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}/inspection-summary`,
  )

  if (!response.ok) {
    throw new Error(
      'Failed to load inspection summary',
    )
  }

  return response.json()
}


export async function getInspectionReport(
  inspectionId: number,
): Promise<InspectionReport> {
  const response = await fetch(
    `${API_BASE_URL}/inspections/${inspectionId}/report`,
  )

  if (!response.ok) {
    const error =
      await response.json()

    throw new Error(
      error.detail ||
        'Failed to load inspection report',
    )
  }

  const data =
    await response.json()

  return data.report
}


export async function getDashboardSummary(
): Promise<DashboardSummary> {
  const response = await fetch(
    `${API_BASE_URL}/dashboard/summary`,
  )

  if (!response.ok) {
    throw new Error(
      'Failed to load dashboard summary',
    )
  }

  return response.json()
}