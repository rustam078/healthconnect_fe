import { GlobalOutlined, MedicineBoxOutlined, LockOutlined } from '@ant-design/icons'

// Shared look-up for the three group visibilities: label, icon and a one-line hint.
export const VISIBILITY = {
  PUBLIC: { label: 'Public', icon: <GlobalOutlined />, hint: 'Anyone can find and join' },
  PUBLIC_DOCTORS: { label: 'Doctors only', icon: <MedicineBoxOutlined />, hint: 'Only doctors and admins see it' },
  PRIVATE: { label: 'Private', icon: <LockOutlined />, hint: 'Invite only — admin adds members' },
}

export const visibilityMeta = (v) => VISIBILITY[v] || VISIBILITY.PUBLIC
