import { Button, Card, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <Card>
      <Result
        status="404"
        title="Section coming soon"
        subTitle="This part of HealthConnect isn't available yet."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
        }
      />
    </Card>
  )
}
