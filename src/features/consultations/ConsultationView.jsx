import { Descriptions, Table, Divider, Empty, Skeleton, Alert, Typography } from 'antd'
import { useConsultation } from './consultationHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

const MEDICINE_COLUMNS = [
  { title: 'Medicine', dataIndex: 'medicineName', key: 'medicineName' },
  { title: 'Dosage', dataIndex: 'dosage', key: 'dosage', render: (v) => v || '—' },
  { title: 'Frequency', dataIndex: 'frequency', key: 'frequency', render: (v) => v || '—' },
  { title: 'Duration', dataIndex: 'duration', key: 'duration', render: (v) => v || '—' },
  { title: 'Instructions', dataIndex: 'instructions', key: 'instructions', render: (v) => v || '—' },
]

// Read-only record of a completed visit. Shown when an appointment is opened that has
// already been written up, so a doctor can see later what the problem and prescription were.
export default function ConsultationView({ appointmentId, enabled }) {
  const { data, isLoading, isError, error } = useConsultation(appointmentId, enabled)

  if (isLoading) return <Skeleton active paragraph={{ rows: 4 }} />
  if (isError) return <Alert type="error" showIcon message={getErrorMessage(error)} />
  if (!data) return <Empty description="No consultation was recorded for this visit." />

  return (
    <>
      <Divider orientation="left" orientationMargin={0}>
        Consultation
      </Divider>
      <Descriptions column={1} size="small" colon={false}>
        <Descriptions.Item label="Chief complaint">{data.chiefComplaint || '—'}</Descriptions.Item>
        <Descriptions.Item label="Diagnosis">{data.diagnosis || '—'}</Descriptions.Item>
        <Descriptions.Item label="Notes">{data.notes || '—'}</Descriptions.Item>
      </Descriptions>

      <Divider orientation="left" orientationMargin={0}>
        Prescription
      </Divider>
      {data.medicines?.length ? (
        <Table
          size="small"
          rowKey="id"
          pagination={false}
          columns={MEDICINE_COLUMNS}
          dataSource={data.medicines}
          scroll={{ x: true }}
        />
      ) : (
        <Typography.Text type="secondary">No medicines were prescribed.</Typography.Text>
      )}
    </>
  )
}
