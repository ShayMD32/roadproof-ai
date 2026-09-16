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