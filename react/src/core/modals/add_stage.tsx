import { Link } from 'react-router-dom'
import ImageWithBasePath from '../common/imageWithBasePath';
import React, { useState } from 'react';
import { useSocket } from '../../SocketContext';
import { Socket } from 'socket.io-client';

const AddStage = () => {
  const [stageName, setStageName] = useState('');
  const [error, setError] = useState('');
  const socket = useSocket() as Socket | null;
  const companyId = window.localStorage.getItem('companyId') || 'demoCompanyId';

  const closeModal = () => {
    const modal = document.getElementById('add_stage');
    if (modal && (window as any).bootstrap?.Modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.hide();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = stageName.trim();
    if (!trimmed) {
      setError('Stage name is required');
      return;
    }
    setError('');
    if (socket && companyId) {
      socket.emit('stage:add', { name: trimmed });
      socket.once('stage:add-response', (res: any) => {
        if (res.done) {
          setStageName('');
          setError('');
          closeModal();
          // Setup event listener BEFORE closing the modal
          const pipelineModal = document.getElementById('add_pipeline');
          if (pipelineModal && (window as any).bootstrap?.Modal) {
            const handler = () => {
              const bootstrapModal = new (window as any).bootstrap.Modal(pipelineModal);
              bootstrapModal.show();
              document.getElementById('add_stage')?.removeEventListener('hidden.bs.modal', handler);
            };
            document.getElementById('add_stage')?.addEventListener('hidden.bs.modal', handler);
          }
          window.dispatchEvent(new CustomEvent('stage-added'));
        } else {
          setError(res.error || 'Failed to add stage');
        }
      });
    }
  };

  // Reset state when modal is closed
  React.useEffect(() => {
    const modal = document.getElementById('add_stage');
    if (!modal) return;
    const handleHidden = () => {
      setStageName('');
      setError('');
    };
    modal.addEventListener('hidden.bs.modal', handleHidden);
    return () => {
      modal.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, []);

  return (
    <>
      {/* Add New Stage */}
      <div className="modal fade" id="add_stage" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Stage</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={closeModal}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Stage Name <span className="text-danger"> *</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={stageName}
                        onChange={e => setStageName(e.target.value)}
                        required
                        autoFocus
                      />
                      {error && <div className="text-danger mt-2">{error}</div>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add New Stage */}
    </>
  );
};

export default AddStage;
