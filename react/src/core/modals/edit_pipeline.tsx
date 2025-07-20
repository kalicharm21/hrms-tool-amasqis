import { DatePicker } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSocket } from '../../SocketContext';
import { Socket } from 'socket.io-client';
import dayjs, { Dayjs } from 'dayjs';
import { Select } from 'antd';
import { toast } from 'react-toastify';

const DEFAULT_STAGE_OPTIONS = [
  'Won',
  'In Pipeline',
  'Conversation',
  'Follow Up',
];

interface EditPipelineProps {
  pipeline?: any | null;
  onPipelineUpdated?: () => void;
}

const EditPipeline = ({ pipeline, onPipelineUpdated }: EditPipelineProps) => {
  const socket = useSocket() as Socket | null;
  // Form state
  const [pipelineName, setPipelineName] = useState('');
  const [stage, setStage] = useState('');
  const [stageOptions, setStageOptions] = useState<string[]>([...DEFAULT_STAGE_OPTIONS]);
  const [showStageModal, setShowStageModal] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [totalDealValue, setTotalDealValue] = useState<number | ''>('');
  const [noOfDeals, setNoOfDeals] = useState<number | ''>('');
  const [createdDate, setCreatedDate] = useState<Dayjs | null>(null);
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const companyId = window.localStorage.getItem('companyId') || 'demoCompanyId';
  // Remove EditPipelineStagesModal and related state/handlers
  // Remove Edit link next to the dropdown
  // Only keep the dropdown for selecting a stage, and the Add New link/modal if present
  const [localStages, setLocalStages] = useState<string[]>([...DEFAULT_STAGE_OPTIONS]);
  const [showEditStagesModal, setShowEditStagesModal] = useState(false);

  // When pipeline changes, pre-fill form fields
  useEffect(() => {
    if (pipeline) {
      setPipelineName(pipeline.pipelineName || '');
      setStage(pipeline.stage || '');
      setTotalDealValue(pipeline.totalDealValue ?? '');
      setNoOfDeals(pipeline.noOfDeals ?? '');
      setCreatedDate(pipeline.createdDate ? dayjs(pipeline.createdDate) : null);
      setStatus(pipeline.status || 'Active');
      setError(null);
      setSuccess(false);
    }
  }, [pipeline]);

  // When pipeline changes, initialize localStages
  useEffect(() => {
    if (pipeline) {
      if (Array.isArray(pipeline.stages) && pipeline.stages.length > 0) {
        setLocalStages([...pipeline.stages]);
      } else {
        // Use [pipeline.stage, ...DEFAULT_STAGE_OPTIONS], remove duplicates and falsy values
        const allStages = [pipeline.stage, ...DEFAULT_STAGE_OPTIONS].filter(Boolean);
        const uniqueStages = allStages.filter((s, i, arr) => arr.indexOf(s) === i);
        setLocalStages(uniqueStages);
      }
    } else {
      setLocalStages([...DEFAULT_STAGE_OPTIONS]);
    }
  }, [pipeline]);

  // Fetch stages from backend on modal open
  useEffect(() => {
    const modal = document.getElementById('edit_pipeline');
    if (!modal) return;
    const fetchStages = () => {
      if (socket && companyId) {
        socket.emit('stage:getAll');
        socket.once('stage:getAll-response', (res: any) => {
          if (res.done && Array.isArray(res.data)) {
            const customStages = res.data.map((s: any) => s.name);
            const merged = [...DEFAULT_STAGE_OPTIONS, ...customStages.filter((s: string) => !DEFAULT_STAGE_OPTIONS.includes(s))];
            setStageOptions(merged);
          } else {
            setStageOptions([...DEFAULT_STAGE_OPTIONS]);
          }
        });
      }
    };
    modal.addEventListener('show.bs.modal', fetchStages);
    return () => {
      modal.removeEventListener('show.bs.modal', fetchStages);
    };
  }, [socket, companyId]);

  // Handle add new stage
  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStage.trim();
    if (trimmed && !stageOptions.includes(trimmed)) {
      setStageOptions([...stageOptions, trimmed]);
      setStage(trimmed);
    }
    setNewStage('');
    setShowStageModal(false);
  };

  // Helper to close modal (matches add_pipeline.tsx)
  const closeModal = () => {
    const modal = document.getElementById('edit_pipeline');
    if (modal) {
      const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      } else {
        // Fallback: forcibly hide modal if Bootstrap instance is missing
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('show');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Edit pipeline form submitted');
    console.log('Socket:', socket);
    console.log('Pipeline:', pipeline);
    
    if (!pipeline || !pipeline._id) {
      setError('No pipeline selected');
      return;
    }
    
    if (!socket) {
      setError('No socket connection');
      return;
    }
    
    // Validate required fields
    if (!pipelineName.trim()) {
      setError('Pipeline name is required');
      return;
    }
    
    if (!stage.trim()) {
      setError('Pipeline stage is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    const update = {
      pipelineName: pipelineName.trim(),
      stage: stage.trim(),
      totalDealValue: totalDealValue === '' ? 0 : Number(totalDealValue),
      noOfDeals: noOfDeals === '' ? 0 : Number(noOfDeals),
      createdDate: createdDate ? createdDate.toISOString() : new Date().toISOString(),
      status,
      stages: localStages, // Use localStages for the update payload
    };
    
    console.log('Emitting pipeline:update', { pipelineId: pipeline._id, update });
    socket.emit('pipeline:update', { pipelineId: pipeline._id, update });
    
    socket.once('pipeline:update-response', (res: any) => {
      setLoading(false);
      console.log('Pipeline update response:', res);
      
      if (res.done) {
        setSuccess(true);
        console.log('Pipeline updated successfully');
        
        // Show success message briefly before closing
        setTimeout(() => {
          // Close modal
          closeModal();
          
          // Refresh pipeline list
          if (onPipelineUpdated) {
            console.log('Calling onPipelineUpdated callback');
            onPipelineUpdated();
          }
          
          // Also dispatch global event as backup
          window.dispatchEvent(new CustomEvent('refresh-pipelines'));
          
          // Clear form state after modal closes
          setTimeout(() => {
            setPipelineName('');
            setStage('');
            setTotalDealValue('');
            setNoOfDeals('');
            setCreatedDate(null);
            setStatus('Active');
            setError(null);
            setSuccess(false);
          }, 300);
        }, 1000); // Show success message for 1 second
      } else {
        console.error('Pipeline update failed:', res.error);
        setError(res.error || 'Failed to update pipeline');
      }
    });
  };

  return (
    <>
      {/* Edit Pipeline */}
      <div className="modal fade" id="edit_pipeline">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Pipeline</h4>
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
                {error ? (
                  <div className="alert alert-danger text-center mb-3">
                    <i className="ti ti-alert-circle me-2"></i>
                    {error}
                  </div>
                ) : success ? (
                  <div className="alert alert-success text-center mb-3">
                    <i className="ti ti-check-circle me-2"></i>
                    Pipeline updated successfully!
                  </div>
                ) : !pipeline ? (
                  <div className="p-4 text-muted text-center">No pipeline selected.</div>
                ) : (
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">
                          Pipeline Name <span className="text-danger"> *</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={pipelineName}
                          onChange={e => setPipelineName(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="input-block mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <label className="form-label">
                            Pipeline Stages <span className="text-danger"> *</span>
                          </label>
                          <a
                            href="#"
                            className="add-new text-primary"
                            onClick={e => { e.preventDefault(); setShowEditStagesModal(true); }}
                          >
                            <i className="ti ti-edit text-primary me-1" />
                            Edit
                          </a>
                        </div>
                        <select
                          className="form-select mt-2"
                          value={stage}
                          onChange={e => setStage(e.target.value)}
                          required
                          disabled={loading}
                        >
                          <option value="" disabled>Select Stage</option>
                          {stageOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Total Deal Value <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          value={totalDealValue}
                          onChange={e => setTotalDealValue(e.target.value === '' ? '' : Number(e.target.value))}
                          required
                          min={0}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">No of Deals <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control"
                          value={noOfDeals}
                          onChange={e => setNoOfDeals(e.target.value === '' ? '' : Number(e.target.value))}
                          required
                          min={0}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Created Date <span className="text-danger">*</span></label>
                        <DatePicker
                          className="form-control"
                          value={createdDate}
                          onChange={value => setCreatedDate(value)}
                          format="YYYY-MM-DD"
                          required
                          picker="date"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Status <span className="text-danger">*</span></label>
                        <select 
                          className="form-select" 
                          value={status} 
                          onChange={e => setStatus(e.target.value)} 
                          required
                          disabled={loading}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || !pipeline}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Edit Pipeline */}
      {/* Add Stage Modal */}
      {showStageModal && (
        <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Stage</h5>
                <button type="button" className="btn-close" onClick={() => { setShowStageModal(false); setNewStage(''); }} />
              </div>
              <form onSubmit={handleAddStage}>
                <div className="modal-body">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter new stage name"
                    value={newStage}
                    onChange={e => setNewStage(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-light" onClick={() => { setShowStageModal(false); setNewStage(''); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Add Stage</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showEditStagesModal && (
        <EditStagesModal
          key={stageOptions.join(',')}
          stages={stageOptions}
          companyId={companyId}
          onSave={updatedStages => {
            if (socket) {
              socket.emit('stage:overwrite', { stages: updatedStages });
              socket.once('stage:overwrite-response', (res: any) => {
                if (res.done && Array.isArray(res.data)) {
                  const merged = [...DEFAULT_STAGE_OPTIONS, ...res.data.map((s: any) => s.name).filter((s: string) => !DEFAULT_STAGE_OPTIONS.includes(s))];
                  setStageOptions(merged);
                  if (!merged.includes(stage)) {
                    setStage(merged[0] || '');
                  }
                  
                  // Show detailed success message about stage update
                  if (res.updatedPipelinesCount > 0) {
                    toast.success(`Stages updated successfully! ${res.updatedPipelinesCount} pipeline(s) using deleted stages have been automatically updated to use "${res.defaultStage}".`);
                  } else {
                    toast.success('Stages updated successfully!');
                  }
                  
                  // Dispatch refresh event to update pipeline list
                  window.dispatchEvent(new CustomEvent('refresh-pipelines'));
                }
              });
            }
            setShowEditStagesModal(false);
          }}
          onClose={() => setShowEditStagesModal(false)}
        />
      )}
      {/* /Add Stage Modal */}
    </>
  );
};

// Add a new modal component for editing pipeline stages locally
// Remove EditPipelineStagesModal and related state/handlers
// Remove Edit link next to the dropdown
// Only keep the dropdown for selecting a stage, and the Add New link/modal if present

export default EditPipeline;

// Add EditStagesModal component (same as in add_pipeline.tsx)
const EditStagesModal = ({ stages, companyId, onSave, onClose }: { stages: string[]; companyId: string; onSave: (updatedStages: string[]) => void; onClose: () => void }) => {
  const [localStages, setLocalStages] = useState<string[]>([...stages]);

  // Sync localStages with stages prop
  useEffect(() => {
    setLocalStages([...stages]);
  }, [stages]);

  const handleStageChange = (idx: number, value: string) => {
    const updated = [...localStages];
    updated[idx] = value;
    setLocalStages(updated);
  };

  const handleDelete = (idx: number) => {
    const updated = localStages.filter((_, i) => i !== idx);
    setLocalStages(updated);
  };

  const handleSave = () => {
    // Remove empty or duplicate names
    const filtered = localStages.filter((s, i, arr) => s.trim() && arr.indexOf(s) === i);
    onSave(filtered);
    onClose();
  };

  return (
    <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Edit Pipeline Stages</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {localStages.map((stage, idx) => (
              <div key={idx} className="d-flex align-items-center mb-2">
                <input
                  type="text"
                  className="form-control me-2"
                  value={stage}
                  onChange={e => {
                    console.log('Input changed:', e.target.value, 'at index', idx);
                    handleStageChange(idx, e.target.value);
                  }}
                  // Ensure not disabled or readOnly
                />
                <button
                  type="button"
                  className="btn btn-link text-danger p-0"
                  title="Delete Stage"
                  onClick={() => handleDelete(idx)}
                >
                  <i className="ti ti-trash" />
                </button>
              </div>
            ))}
            {localStages.length === 0 && <div className="text-muted">No stages. Add at least one stage.</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light me-2" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};
