import { useState } from 'react'
import { Drawer, List, Select, Button, Space, Tag, Popconfirm, Typography, App } from 'antd'
import { UserAddOutlined, DeleteOutlined } from '@ant-design/icons'
import InitialAvatar from '../../components/common/InitialAvatar.jsx'
import { useMembers, useAddMembers, useRemoveMember } from './communityHooks.js'
import { useUsers } from '../users/usersHooks.js'
import { getErrorMessage } from '../../utils/apiError.js'

// Admin-only drawer to view, add and remove members. Patients are never offered as candidates.
export default function ManageMembersDrawer({ open, onClose, community, onlineSet }) {
  const { message } = App.useApp()
  const [toAdd, setToAdd] = useState([])
  const communityId = community?.id
  const { data: members } = useMembers(open ? communityId : null)
  const { data: users } = useUsers()
  const addMembers = useAddMembers()
  const removeMember = useRemoveMember()

  const memberIds = new Set((members ?? []).map((m) => m.userId))
  const candidates = (users ?? [])
    .filter((u) => u.patientId == null && (u.role ?? '').toUpperCase() !== 'CUSTOMER' && !memberIds.has(u.id))
    .map((u) => ({ value: u.id, label: u.username }))

  const handleAdd = () => {
    if (!toAdd.length) return
    addMembers.mutate({ id: communityId, userIds: toAdd }, {
      onSuccess: () => { message.success('Members added'); setToAdd([]) },
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  const handleRemove = (userId) => {
    removeMember.mutate({ id: communityId, memberId: userId }, {
      onSuccess: () => message.success('Member removed'),
      onError: (e) => message.error(getErrorMessage(e)),
    })
  }

  return (
    <Drawer open={open} width={400} title="Members" onClose={onClose} destroyOnHidden>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Select mode="multiple" allowClear style={{ width: '100%' }} value={toAdd} onChange={setToAdd}
          placeholder="Add doctors / staff" optionFilterProp="label" options={candidates} maxTagCount="responsive" />
        <Button type="primary" icon={<UserAddOutlined />} loading={addMembers.isPending}
          disabled={!toAdd.length} onClick={handleAdd} />
      </Space.Compact>

      <List
        dataSource={members ?? []}
        rowKey="userId"
        renderItem={(m) => (
          <List.Item
            actions={m.role !== 'ADMIN'
              ? [
                  <Popconfirm key="r" title="Remove this member?" onConfirm={() => handleRemove(m.userId)}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]
              : []}
          >
            <List.Item.Meta
              avatar={<InitialAvatar name={m.displayName} avatarFileId={m.avatarFileId} online={onlineSet?.has(m.userId)} size={38} />}
              title={<span>{m.displayName} {m.role === 'ADMIN' && <Tag color="cyan" style={{ marginLeft: 4 }}>Admin</Tag>}</span>}
              description={<Typography.Text type="secondary" style={{ fontSize: 12 }}>@{m.username}</Typography.Text>}
            />
          </List.Item>
        )}
      />
    </Drawer>
  )
}
