import React from 'react';
import { useNavigate } from 'react-router-dom';
import IssueForm from './IssueForm';

interface Props {
  onSuccess?: () => void;
}

const IssueCreatePage: React.FC<Props> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const projectKey = localStorage.getItem('projectKey') || 'SDK_TI';

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/issues');
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <IssueForm
      projectKey={projectKey}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
};

export default IssueCreatePage;
