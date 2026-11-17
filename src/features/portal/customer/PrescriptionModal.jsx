import { Modal, Descriptions, Table, Spin, Alert, Divider, Empty } from 'antd'
import { useConsultation, useMyReports } from './customerPortalHooks.js'
import PdfViewer from '../../../components/common/PdfViewer.jsx'
import ReportsViewer from '../../../components/common/ReportsViewer.jsx'
import { getErrorMessage } from '../../../utils/apiError.js'

const MED_COLUMNS = [
  { title: 'Medicine', dataIndex: 'medicineName', key: 'medicineName' },
  { title: 'Dosage', dataIndex: 'dosage', key: 'dosage' },
  { title: 'Frequency', dataIndex: 'frequency', key: 'frequency' },
  { title: 'Duration', dataIndex: 'duration', key: 'duration' },
  { title: 'Instructions', dataIndex: 'instructions', key: 'instructions' },
]

const TEST_COLUMNS = [
  { title: 'Test', dataIndex: 'testName', key: 'testName' },
  { title: 'Instructions', dataIndex: 'instructions', key: 'instructions' },
]

// A visit's full record - prescription, advised tests, linked reports and the PDF.
// A 404 on the consultation means no prescription has been written yet.
export default function PrescriptionModal({ appointmentId, open, onClose }) {
  const { data, isLoading, isError, error } = useConsultation(appointmentId, open)
  const { data: allReports } = useMyReports()
  const notFound = error?.status === 404

  const visitReports = (allReports ?? []).filter((r) => r.appointmentId === appointmentId)

  return (
    <Modal title="Visit record" open={open} onCancel={onClose} footer={null} width={820}>
      {isLoading ? (
        <Spin />
      ) : isError && !notFound ? (
        <Alert type="error" message={getErrorMessage(error)} />
      ) : (
        <>
          {notFound ? (
            <Empty description="No prescription written for this visit yet" />
          ) : (
            <>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Chief complaint">{data?.chiefComplaint || '-'}</Descriptions.Item>
                <Descriptions.Item label="Diagnosis">{data?.diagnosis || '-'}</Descriptions.Item>
                <Descriptions.Item label="Notes">{data?.notes || '-'}</Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">Medicines</Divider>
              <Table
                rowKey={(r, i) => `${r.medicineName}-${i}`}
                size="small"
                pagination={false}
                columns={MED_COLUMNS}
                dataSource={data?.medicines ?? []}
              />

              {data?.tests?.length ? (
                <>
                  <Divider orientation="left">Advised tests</Divider>
                  <Table
                    rowKey={(r, i) => `${r.testName}-${i}`}
                    size="small"
                    pagination={false}
                    columns={TEST_COLUMNS}
                    dataSource={data.tests}
                  />
                </>
              ) : null}
            </>
          )}

          <Divider orientation="left">Reports for this visit</Divider>
          <ReportsViewer reports={visitReports} fileUrl={(id) => `/customer-portal/reports/${id}/file`} />

          {!notFound && (
            <>
              <Divider orientation="left">Prescription PDF</Divider>
              <PdfViewer url={`/customer-portal/appointments/${appointmentId}/consultation/pdf`} />
            </>
          )}
        </>
      )}
    </Modal>
  )
}
