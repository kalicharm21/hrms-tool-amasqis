import React, { useEffect, useState } from 'react';
import { useSocket } from '../../SocketContext';
import { Socket } from 'socket.io-client';
import { DatePicker } from 'antd';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import CommonSelect from '../common/commonSelect';
import { beforeuse, company, contacts, deals, guests, owner, owners, status } from '../common/selectoption/selectoption';
import { label } from 'yet-another-react-lightbox/*';
import CommonTagsInput from '../common/Taginput';
import ImageWithBasePath from '../common/imageWithBasePath';
import dayjs, { Dayjs } from 'dayjs';
import AddStage from './add_stage';

const DEFAULT_STAGE_OPTIONS = [
  'Won',
  'In Pipeline',
  'Conversation',
  'Follow Up',
];

const AddPipeline = () => {
  const socket = useSocket() as Socket | null;
  const companyId = window.localStorage.getItem('companyId') || 'demoCompanyId';

  // Form state
  const [pipelineName, setPipelineName] = useState('');
  const [stage, setStage] = useState('');
  const [stageOptions, setStageOptions] = useState<string[]>([...DEFAULT_STAGE_OPTIONS]);
  const [totalDealValue, setTotalDealValue] = useState<number | ''>('');
  const [noOfDeals, setNoOfDeals] = useState<number | ''>('');
  const [createdDate, setCreatedDate] = useState<Dayjs | null>(null);
  const [status, setStatus] = useState('Active');
  const [showEditStagesModal, setShowEditStagesModal] = useState(false);

  // Fetch stages from backend on modal open and after stage is added
  useEffect(() => {
    const modal = document.getElementById('add_pipeline');
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
    // Listen for custom event from AddStage
    window.addEventListener('stage-added', fetchStages);
    return () => {
      modal.removeEventListener('show.bs.modal', fetchStages);
      window.removeEventListener('stage-added', fetchStages);
    };
  }, [socket, companyId]);

  // Helper to close modal
  const closeModal = () => {
    const modal = document.getElementById('add_pipeline');
    if (modal) {
      const bootstrapModal = (window as any).bootstrap?.Modal?.getOrCreateInstance(modal);
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
    if (!socket) return;
    const data = {
      pipelineName,
      stage,
      totalDealValue: totalDealValue === '' ? 0 : totalDealValue,
      noOfDeals: noOfDeals === '' ? 0 : noOfDeals,
      createdDate: createdDate ? createdDate.toISOString() : new Date().toISOString(),
      status,
    };
    socket.emit('pipeline:create', data);
    socket.once('pipeline:create-response', (res: any) => {
      if (res.done) {
        setPipelineName('');
        setStage('');
        setTotalDealValue('');
        setNoOfDeals('');
        setCreatedDate(null);
        setStatus('Active');
        closeModal();
        window.dispatchEvent(new CustomEvent('refresh-pipelines'));
      }
    });
  };

  return (
    <>
      {/* Add Pipeline */}
      <div className="modal fade" id="add_pipeline">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add New Pipeline</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
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
                        Pipeline Name <span className="text-danger"> *</span>
                      </label>
                      <input type="text" className="form-control" value={pipelineName} onChange={e => setPipelineName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="input-block mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <label className="form-label">
                          Pipeline Stages <span className="text-danger"> *</span>
                        </label>
                        <div>
                          <Link
                            to="#"
                            className="add-new text-primary me-3"
                            data-bs-toggle="modal"
                            data-bs-target="#add_stage"
                            onClick={e => { e.preventDefault(); }}
                          >
                            <i className="ti ti-plus text-primary me-1" />
                            Add New
                          </Link>
                          <a
                            href="#"
                            className="add-new text-primary"
                            onClick={e => { e.preventDefault(); setShowEditStagesModal(true); }}
                          >
                            <i className="ti ti-edit text-primary me-1" />
                            Edit
                          </a>
                        </div>
                      </div>
                      <select
                        className="form-select"
                        value={stage}
                        onChange={e => setStage(e.target.value)}
                        required
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
                      <input type="number" className="form-control" value={totalDealValue} onChange={e => setTotalDealValue(e.target.value === '' ? '' : Number(e.target.value))} required min={0} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">No of Deals <span className="text-danger">*</span></label>
                      <input type="number" className="form-control" value={noOfDeals} onChange={e => setNoOfDeals(e.target.value === '' ? '' : Number(e.target.value))} required min={0} />
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
                        // calendar only
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status <span className="text-danger">*</span></label>
                      <select className="form-select" value={status} onChange={e => setStatus(e.target.value)} required>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  {/* ...other fields as needed... */}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Pipeline */}
      <AddStage />
      {showEditStagesModal && (
        <EditStagesModal
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
    </>
  );
}

export default AddPipeline;

// Add EditStagesModal component
const EditStagesModal = ({ stages, companyId, onSave, onClose }: { stages: string[]; companyId: string; onSave: (updatedStages: string[]) => void; onClose: () => void }) => {
  const [localStages, setLocalStages] = useState<string[]>([...stages]);

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
                  onChange={e => handleStageChange(idx, e.target.value)}
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
