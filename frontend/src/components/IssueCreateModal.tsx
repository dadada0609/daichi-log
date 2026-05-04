import React from 'react';
import IssueForm from './IssueForm';

interface Props {
  initialStatus?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const IssueCreateModal: React.FC<Props> = ({ initialStatus, onClose, onSuccess }) => {
  const projectKey = localStorage.getItem('projectKey') || 'SDK_TI';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '900px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', position: 'relative' }}>
        <IssueForm 
          projectKey={projectKey} 
          initialStatus={initialStatus}
          onSuccess={() => {
            if (onSuccess) onSuccess();
            onClose();
          }} 
          onCancel={onClose} 
        />
      </div>
    </div>
  );
};

export default IssueCreateModal;
