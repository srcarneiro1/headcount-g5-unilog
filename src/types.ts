export type AccessRole = 'OWNER' | 'ADMIN' | 'VISUALIZADOR'
export type AccessProfile = { email: string; role: AccessRole; modules: string[] }
export interface Employee {
  id: string
  name: string
  role: string
  area: string
  admission: string
  costCenter: string
  status: string
  client: string
  shift: string
  supervisorId: string
  supervisor: string
  lead: string
  module: string
  process: string
}
export interface HubPayload {
  updatedAt: string
  source: 'google-sheets' | 'demo'
  employees: Employee[]
  profile: AccessProfile
  quality: { duplicateIds: number; invalidRows: number }
}
export interface Filters {
  query: string
  status: string
  module: string
  supervisor: string
  client: string
  costCenter: string
  shift: string
  role: string
}
export const emptyFilters: Filters = {query:'',status:'',module:'',supervisor:'',client:'',costCenter:'',shift:'',role:''}
