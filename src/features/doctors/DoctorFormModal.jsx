import { Modal, Form, Input, InputNumber, Select, DatePicker, Row, Col, App } from 'antd'
import dayjs from 'dayjs'
import { useCreateDoctor, useUpdateDoctor } from './doctorsHooks.js'
import { GENDER_OPTIONS } from '../../constants/enums.js'
import { getErrorMessage } from '../../utils/apiError.js'

const PHONE_RULE = {
  pattern: /^[0-9]{10,15}$/,
  message: 'Phone must be 10–15 digits',
}

export default function DoctorFormModal({ open, mode, initialValues, onClose }) {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const createMutation = useCreateDoctor()
  const updateMutation = useUpdateDoctor()
  const isEdit = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending

  // Backend doctor-update ignores gender/dateOfBirth, so they are read-only in edit mode.
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
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        qualification: values.qualification.trim(),
        experienceYears: values.experienceYears,
        consultationFee: values.consultationFee,
      }
      updateMutation.mutate(
        { id: initialValues.id, payload },
        {
          onSuccess: () => {
            message.success('Doctor updated')
            onClose()
          },
          onError,
        },
      )
    } else {
      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        gender: values.gender,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
        qualification: values.qualification.trim(),
        experienceYears: values.experienceYears,
        consultationFee: values.consultationFee,
      }
      createMutation.mutate(payload, {
        onSuccess: () => {
          message.success('Doctor created')
          onClose()
        },
        onError,
      })
    }
  }

  return (
    <Modal
      open={open}
      width={660}
      title={isEdit ? 'Edit Doctor' : 'Add Doctor'}
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
          email: initialValues?.email ?? '',
          phone: initialValues?.phone ?? '',
          gender: initialValues?.gender ?? undefined,
          dateOfBirth: initialValues?.dateOfBirth ? dayjs(initialValues.dateOfBirth) : null,
          qualification: initialValues?.qualification ?? '',
          experienceYears: initialValues?.experienceYears ?? null,
          consultationFee: initialValues?.consultationFee ?? null,
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
              <Input placeholder="e.g. Meera" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last name"
              rules={[
                { required: true, whitespace: true, message: 'Last name is required' },
                { max: 50, message: 'Must not exceed 50 characters' },
              ]}
            >
              <Input placeholder="e.g. Nair" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
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
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Phone is required' }, PHONE_RULE]}
            >
              <Input placeholder="10–15 digits" maxLength={15} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Gender is required' }]}
            >
              <Select placeholder="Select gender" options={GENDER_OPTIONS} disabled={lockIdentity} />
            </Form.Item>
          </Col>
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
        </Row>

        <Form.Item
          name="qualification"
          label="Qualification"
          rules={[
            { required: true, whitespace: true, message: 'Qualification is required' },
            { max: 200, message: 'Must not exceed 200 characters' },
          ]}
        >
          <Input placeholder="e.g. MBBS, MD (Cardiology)" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="experienceYears"
              label="Experience (years)"
              rules={[{ required: true, message: 'Experience is required' }]}
            >
              <InputNumber min={0} max={80} precision={0} style={{ width: '100%' }} placeholder="e.g. 8" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="consultationFee"
              label="Consultation fee"
              rules={[{ required: true, message: 'Consultation fee is required' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                prefix="₹"
                style={{ width: '100%' }}
                placeholder="e.g. 500.00"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}
