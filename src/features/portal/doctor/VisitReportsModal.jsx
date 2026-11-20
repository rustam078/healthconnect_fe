import { Modal, Spin, Alert } from 'antd'
import { usePatientReports } from './doctorPortalHooks.js'
import ReportsViewer from '../../../components/common/ReportsViewer.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

// The reports uploaded against one appointment, for the doctor to review.
export default function VisitReportsModal({ patientId, appointmentId, open, onClose }) {
  const { data, isFetching, isError, error } = usePatientReports(open ? patientId : null)
  const visitReports = (data ?? []).filter((r) => r.appointmentId === appointmentId)

  return (
    <Modal title="Visit reports" open={open} onCancel={onClose} footer={null} width={820}>
      {isFetching ? (
        <Spin />
      ) : isError ? (
        <Alert type="error" message={getErrorMessage(error)} />
      ) : (
        <ReportsViewer
          reports={visitReports}
          fileUrl={(id) => `/reports/${id}/file`}
        />
      )}
    </Modal>
  )
}
