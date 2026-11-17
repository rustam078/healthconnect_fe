import { Modal } from 'antd'
import PdfViewer from '../../../components/common/PdfViewer.jsx'

// Lightweight modal wrapper that previews a PDF endpoint inline.
export default function PdfModal({ title, url, open, onClose }) {
  return (
    <Modal title={title} open={open} onCancel={onClose} footer={null} width={820} destroyOnHidden>
      {url && <PdfViewer url={url} />}
    </Modal>
  )
}
