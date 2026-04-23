import { listEmergencyAlerts } from '../../utils/cope-fake-db'

export default defineEventHandler(() => {
  return listEmergencyAlerts()
})

