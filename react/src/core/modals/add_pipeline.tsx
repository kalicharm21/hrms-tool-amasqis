import { DatePicker } from 'antd';
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import CommonSelect from '../common/commonSelect';
import { beforeuse, company, contacts, deals, guests, owner, owners, status } from '../common/selectoption/selectoption';
import { label } from 'yet-another-react-lightbox/*';
import CommonTagsInput from '../common/Taginput';
import ImageWithBasePath from '../common/imageWithBasePath';
import { useSocket } from '../../SocketContext';
import { Socket } from 'socket.io-client';
import dayjs, { Dayjs } from 'dayjs';

const DEFAULT_STAGE_OPTIONS = [
  'Won',
  'In Pipeline',
  'Conversation',
  'Follow Up',
];

const AddPipeline = () => {
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
                        <Link
                          to="#"
                          className="add-new text-primary"
                          onClick={e => { e.preventDefault(); setShowStageModal(true); }}
                        >
                          <i className="ti ti-plus text-primary me-1" />
                          Add New
                        </Link>
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
      {/* /Add Stage Modal */}
    </>
  );
}

export default AddPipeline;
