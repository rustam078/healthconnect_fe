import { Modal, Form, Input, Select, DatePicker, Row, Col, App } from 'antd'
import dayjs from 'dayjs'
import { useCreatePatient, useUpdatePatient } from './patientsHooks.js'
import { GENDER_OPTIONS, BLOOD_GROUP_OPTIONS } from '../../constants/enums.js'
import { getErrorMessage } from '../../utils/apiError.js'

const PHONE_RULE = {
  pattern: /^[6-9]\d{9}$/,
  message: 'Enter a valid 10-digit Indian mobile number',
}

export default function PatientFormModal({ open, mode, initialValues, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const createMutation = useCreatePatient()
  const updateMutation = useUpdatePatient()
  const isEdit = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending

  // Backend patient-update only changes phone/email/address/bloodGroup, so
  // identity fields are shown read-only in edit mode.
  const lockIdentity = isEdit

  const handleOk = async () => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    const onError = (e) => message.error(getErrorMessage(e))

    if (isEdit) {
      const payload = {
        phone: values.phone?.trim(),
        email: values.email?.trim(),
        address: values.address?.trim() || null,
        bloodGroup: values.bloodGroup || null,
      }
      updateMutation.mutate(
        { id: initialValues.id, payload },
        {
          onSuccess: () => {
            message.success('Patient updated')
            onClose()
          },
          onError,
        },
      )
    } else {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName?.trim() || null,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
        gender: values.gender,
        phone: values.phone.trim(),
        email: values.email.trim(),
        address: values.address?.trim() || null,
        bloodGroup: values.bloodGroup || null,
      }
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success('Patient created')
          onClose()
        },
        onError,
      })
    }
  }

  return (
    <Modal
      open={open}
      width={640}
      title={isEdit ? 'Edit Patient' : 'Add Patient'}
      okText={isEdit ? 'Save' : 'Create'}
      confirmLoading={submitting}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form
        key={`${mode}-${initialValues?.id ?? 'new'}`}
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          firstName: initialValues?.firstName ?? '',
          lastName: initialValues?.lastName ?? '',
          dateOfBirth: initialValues?.dateOfBirth ? dayjs(initialValues.dateOfBirth) : null,
          gender: initialValues?.gender ?? undefined,
          phone: initialValues?.phone ?? '',
          email: initialValues?.email ?? '',
          address: initialValues?.address ?? '',
          bloodGroup: initialValues?.bloodGroup ?? undefined,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="First name"
              rules={[
                { required: true, whitespace: true, message: 'First name is required' },
                { max: 50, message: 'Must not exceed 50 characters' },
              ]}
            >
              <Input placeholder="e.g. Aarav" disabled={lockIdentity} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last name"
              rules={[{ max: 50, message: 'Must not exceed 50 characters' }]}
            >
              <Input placeholder="e.g. Sharma" disabled={lockIdentity} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="dateOfBirth"
              label="Date of birth"
              rules={[{ required: true, message: 'Date of birth is required' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD MMM YYYY"
                disabled={lockIdentity}
                disabledDate={(d) => d && d >= dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Gender is required' }]}
            >
              <Select
                placeholder="Select gender"
                options={GENDER_OPTIONS}
                disabled={lockIdentity}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Phone is required' }, PHONE_RULE]}
            >
              <Input placeholder="10-digit mobile" maxLength={10} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email' },
                { max: 100, message: 'Must not exceed 100 characters' },
              ]}
            >
              <Input placeholder="name@example.com" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="bloodGroup" label="Blood group">
              <Select
                allowClear
                placeholder="Select blood group"
                options={BLOOD_GROUP_OPTIONS}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ max: 500, message: 'Must not exceed 500 characters' }]}
        >
          <Input.TextArea rows={2} placeholder="Optional address" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
