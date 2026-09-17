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
  vehicle: Vehicle
  total_images: number
  total_inspections: number
  damage_detected: boolean
  total_damage_detections: number
  latest_severity: string | null
  latest_severity_score: number | null
  latest_inspection_id: number | null
}


export async function getVehicles(): Promise<Vehicle[]> {
  const response = await fetch(
    `${API_BASE_URL}/vehicles`
  )

  if (!response.ok) {
    throw new Error('Failed to load vehicles')
  }

  return response.json()
}


export async function getVehicle(
  registration: string
): Promise<Vehicle> {
  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}`
  )

  if (!response.ok) {
    throw new Error('Failed to load vehicle')
  }

  return response.json()
}


export async function getVehicleDamageImages(
  registration: string
): Promise<DamageImage[]> {
  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}/damage-images`
  )

  if (!response.ok) {
    throw new Error('Failed to load damage images')
  }

  const data = await response.json()

  return data.images
}


export async function getVehicleInspectionSummary(
  registration: string
): Promise<VehicleInspectionSummary> {
  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}/inspection-summary`
  )

  if (!response.ok) {
    throw new Error('Failed to load inspection summary')
  }

  return response.json()
}


export async function uploadDamageImage(
  registration: string,
  file: File,
) {
  const formData = new FormData()

  formData.append('image', file)

  const response = await fetch(
    `${API_BASE_URL}/vehicles/${registration}/damage-image`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    const error = await response.json()

    throw new Error(
      error.detail || 'Failed to upload damage image',
    )
  }

  return response.json()
}


export async function analyseDamageImage(
  imageId: number,
) {
  const response = await fetch(
    `${API_BASE_URL}/damage-images/${imageId}/analyse`,
    {
      method: 'POST',
    },
  )

  if (!response.ok) {
    const error = await response.json()

    throw new Error(
      error.detail || 'Damage analysis failed',
    )
  }

  return response.json()
}
export type CreateVehicleInput = {
  registration: string
  make: string
  model: string
  year: number
}


export async function createVehicle(
  vehicle: CreateVehicleInput,
): Promise<Vehicle> {
  const response = await fetch(
    `${API_BASE_URL}/vehicle`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicle),
    },
  )

  if (!response.ok) {
    const error = await response.json()

    throw new Error(
      error.detail || 'Failed to create vehicle',
    )
  }

  const data = await response.json()

  return data.vehicle
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
    highest_confidence: number | null
    severity: string | null
    severity_score: number | null
    severity_factors: Record<string, unknown>
  }

  detections: {
    id: number
    damage_type: string
    confidence: number
    bounding_box: {
      x1: number
      y1: number
      x2: number
      y2: number
    }
    segmentation: Record<string, unknown>[]
  }[]

  model: {
    repository: string
    checkpoint: string
    confidence_threshold: number
  }
}


export async function getInspectionReport(
  inspectionId: number,
): Promise<InspectionReport> {
  const response = await fetch(
    `${API_BASE_URL}/inspections/${inspectionId}/report`,
  )

  if (!response.ok) {
    const error = await response.json()

    throw new Error(
      error.detail || 'Failed to load inspection report',
    )
  }

  const data = await response.json()

  return data.report
}
export type DashboardSummary = {
  total_vehicles: number
  total_inspections: number
  damage_detected: number
  clear_inspections: number

  recent_inspections: {
    id: number
    damage_detected: boolean
    damage_count: number
    severity: string | null
    severity_score: number | null
    created_at: string
    registration: string
    make: string
    model: string
  }[]
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
    const error = await response.json()

    throw new Error(
      error.detail || 'Failed to delete image',
    )
  }

  return response.json()
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
    const error = await response.json()

    throw new Error(
      error.detail || 'Failed to delete vehicle',
    )
  }

  return response.json()
}
export type UpdateVehicleInput = {
  registration: string
  make: string
  model: string
  year: number
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicle),
    },
  )

  if (!response.ok) {
    const error = await response.json()

    throw new Error(
      error.detail || 'Failed to update vehicle',
    )
  }

  const data = await response.json()

  return data.vehicle
}