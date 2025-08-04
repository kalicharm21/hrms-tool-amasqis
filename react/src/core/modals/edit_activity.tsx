import { DatePicker } from 'antd';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CommonSelect from '../common/commonSelect';
import { beforeuse, company, contacts, deals } from '../common/selectoption/selectoption';
import { useSocket } from '../../SocketContext';
import { Socket } from 'socket.io-client';
import dayjs from 'dayjs';

const EditActivity = () => {
  const socket = useSocket() as Socket | null;

  // Form state
  const [formData, setFormData] = useState({
    _id: '',
    title: '',
    activityType: 'Calls',
    dueDate: null as any,
    dueTime: '',
    reminder: '',
    reminderType: 'Select',
    owner: '',
    guests: '',
    description: '',
    deals: 'Select',
    contacts: 'Select',
    companies: 'Select',
    status: 'pending'
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Helper function to find selected option
  const findSelectedOption = (options: any[], value: string) => {
    return options.find(option => option.value === value) || options[0];
  };

  // ✅ Helper function to ensure value is never null for CommonSelect
  const getSelectValue = (value: any): string => {
    if (value === null || value === undefined) return 'Select';
    return String(value);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle select changes - Fixed to extract value properly
  const handleSelectChange = (field: string) => (selectedOption: any) => {
    const value = selectedOption?.value || 'Select';
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle activity type selection
  const handleActivityTypeClick = (activityType: string) => {
    setFormData(prev => ({ ...prev, activityType }));
    setError(null);
  };

  // Load activity data for editing
  const loadActivityData = async (activityId: string) => {
    if (!socket) {
      setError('No socket connection available');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('[EditActivity] Loading activity:', activityId);
      socket.emit('activity:getById', activityId);
      
      socket.once('activity:getById-response', (response: any) => {
        setLoading(false);
        if (response.done && response.data) {
          const activity = response.data;
          console.log('[EditActivity] Activity loaded:', activity);

          // Parse date and time from dueDate
          let parsedDate = null;
          let parsedTime = '';
          if (activity.dueDate) {
            const dueDateTime = dayjs(activity.dueDate);
            parsedDate = dueDateTime;
            parsedTime = dueDateTime.format('HH:mm');
          }

          setFormData({
            _id: activity._id,
            title: activity.title || '',
            activityType: activity.activityType || 'Calls',
            dueDate: parsedDate,
            dueTime: parsedTime,
            reminder: activity.reminder || '',
            reminderType: activity.reminderType || 'Select',
            owner: activity.owner || '',
            guests: activity.guests || '',
            description: activity.description || '',
            deals: activity.relatedDeals || 'Select',
            contacts: activity.relatedContacts || 'Select',
            companies: activity.relatedCompanies || 'Select',
            status: activity.status || 'pending'
          });
          setCurrentActivityId(activityId);
        } else {
          console.error('[EditActivity] Failed to load activity:', response.error);
          setError(response.error || 'Failed to load activity');
        }
      });
    } catch (error) {
      console.error('[EditActivity] Error loading activity:', error);
      setError('An error occurred while loading the activity');
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) {
      setError('No socket connection available');
      return;
    }

    if (!currentActivityId) {
      setError('No activity selected for editing');
      return;
    }

    // Validate required fields
    if (!formData.title.trim() || !formData.activityType || !formData.dueDate || !formData.owner.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Combine date and time if available
      let combinedDateTime = dayjs(formData.dueDate);
      if (formData.dueTime) {
        const [hours, minutes] = formData.dueTime.split(':');
        combinedDateTime = combinedDateTime.hour(parseInt(hours)).minute(parseInt(minutes)).second(0);
      }

      // Prepare update data for backend
      const updateData = {
        title: formData.title.trim(),
        activityType: formData.activityType,
        dueDate: combinedDateTime.toISOString(),
        owner: formData.owner.trim(),
        description: formData.description.trim(),
        reminder: formData.reminder || null,
        reminderType: formData.reminderType !== 'Select' ? formData.reminderType : null,
        guests: formData.guests.trim() || null,
        relatedDeals: formData.deals !== 'Select' ? formData.deals : null,
        relatedContacts: formData.contacts !== 'Select' ? formData.contacts : null,
        relatedCompanies: formData.companies !== 'Select' ? formData.companies : null,
        status: formData.status
      };

      console.log('[EditActivity] Updating activity:', updateData);

      // Send to backend
      socket.emit('activity:update', { activityId: currentActivityId, update: updateData });

      // Listen for response
      socket.once('activity:update-response', (response: any) => {
        setLoading(false);
        if (response.done) {
          console.log('[EditActivity] Activity updated successfully:', response.data);
          setSuccess(true);

          // Show success message briefly, then close modal
          setTimeout(() => {
            closeModal();
            // Dispatch refresh event to update activity list
            window.dispatchEvent(new CustomEvent('refresh-activities'));
            // Reset states
            setTimeout(() => {
              setSuccess(false);
              setError(null);
            }, 300);
          }, 1500);
        } else {
          console.error('[EditActivity] Failed to update activity:', response.error);
          setError(response.error || 'Failed to update activity');
        }
      });
    } catch (error) {
      console.error('[EditActivity] Error updating activity:', error);
      setError('An error occurred while updating the activity');
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      _id: '',
      title: '',
      activityType: 'Calls',
      dueDate: null,
      dueTime: '',
      reminder: '',
      reminderType: 'Select',
      owner: '',
      guests: '',
      description: '',
      deals: 'Select',
      contacts: 'Select',
      companies: 'Select',
      status: 'pending'
    });
    setCurrentActivityId(null);
  };

  // Close modal
  const closeModal = () => {
    const modal = document.getElementById('edit_activity');
    if (modal) {
      const bootstrapModal = (window as any).bootstrap?.Modal?.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      } else {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('show');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
      }
    }
  };

  // Listen for edit activity requests
  useEffect(() => {
    const handleEditActivity = (event: CustomEvent) => {
      const activityId = event.detail.activityId;
      if (activityId) {
        loadActivityData(activityId);
      }
    };

    window.addEventListener('edit-activity', handleEditActivity as EventListener);
    return () => {
      window.removeEventListener('edit-activity', handleEditActivity as EventListener);
    };
  }, [socket]);

  // Reset form when modal opens
  useEffect(() => {
    const handleModalShow = () => {
      setError(null);
      setSuccess(false);
      if (!currentActivityId) {
        resetForm();
      }
    };

    const handleModalHide = () => {
      resetForm();
      setError(null);
      setSuccess(false);
      setLoading(false);
    };

    const modal = document.getElementById('edit_activity');
    if (modal) {
      modal.addEventListener('show.bs.modal', handleModalShow);
      modal.addEventListener('hide.bs.modal', handleModalHide);
      return () => {
        modal.removeEventListener('show.bs.modal', handleModalShow);
        modal.removeEventListener('hide.bs.modal', handleModalHide);
      };
    }
  }, [currentActivityId]);

  return (
    <>
      {/* Edit Activity */}
      <div className="modal fade" id="edit_activity" tabIndex={-1} aria-labelledby="edit_activityLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="edit_activityLabel">Edit Activity</h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setError(null)}></button>
            </div>
            <div className="modal-body">
              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <strong>Error!</strong> {error}
                  <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setError(null)}></button>
                </div>
              )}

              {/* Success Alert */}
              {success && (
                <div className="alert alert-success" role="alert">
                  Activity updated successfully!
                </div>
              )}

              <div className="row">
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Title <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      disabled={loading}
                      placeholder="Enter activity title"
                    />
                  </div>
                </div>

                {/* Activity Type */}
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Activity Type <span className="text-danger">*</span></label>
                    <br />
                    {['Calls', 'Email', 'Meeting', 'Task'].map(type => (
                      <Link
                        key={type}
                        to="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleActivityTypeClick(type);
                        }}
                        className="btn btn-sm me-2"
                        style={{
                          backgroundColor: formData.activityType === type ? '#007bff' : '#f8f9fa',
                          color: formData.activityType === type ? '#fff' : '#6c757d',
                          border: '1px solid #dee2e6',
                          padding: '8px 15px',
                          borderRadius: '5px',
                          textDecoration: 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        {type}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Due Date */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Due Date <span className="text-danger">*</span></label>
                    <DatePicker
                      className="form-control w-100"
                      format="DD-MM-YYYY"
                      value={formData.dueDate}
                      onChange={(date) => handleInputChange('dueDate', date)}
                      getPopupContainer={() => document.getElementById('edit_activity') as HTMLElement}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Time */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Time <span className="text-danger">*</span></label>
                    <input
                      type="time"
                      className="form-control"
                      value={formData.dueTime}
                      onChange={(e) => handleInputChange('dueTime', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Remainder */}
                <div className="col-md-8">
                  <div className="mb-3">
                    <label className="form-label">Remainder <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.reminder}
                      onChange={(e) => handleInputChange('reminder', e.target.value)}
                      disabled={loading}
                      placeholder="Enter reminder"
                    />
                  </div>
                </div>

                {/* Before Use */}
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Before Use</label>
                    <CommonSelect
                      options={beforeuse}
                      defaultValue={getSelectValue(formData.reminderType)}
                      onChange={handleSelectChange('reminderType')}
                      className="select"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Owner */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Owner <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.owner}
                      onChange={(e) => handleInputChange('owner', e.target.value)}
                      disabled={loading}
                      placeholder="Enter owner name"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Guests <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.guests}
                      onChange={(e) => handleInputChange('guests', e.target.value)}
                      disabled={loading}
                      placeholder="Enter guest names (comma separated)"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Description <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={loading}
                      placeholder="Enter description"
                    />
                  </div>
                </div>

                {/* Deals */}
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Deals <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={deals}
                      defaultValue={getSelectValue(formData.deals)}
                      onChange={handleSelectChange('deals')}
                      className="select"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Contacts */}
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Contacts <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={contacts}
                      defaultValue={getSelectValue(formData.contacts)}
                      onChange={handleSelectChange('contacts')}
                      className="select"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Companies */}
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Companies <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={company}
                      defaultValue={getSelectValue(formData.companies)}
                      onChange={handleSelectChange('companies')}
                      className="select"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Status <span className="text-danger">*</span></label>
                    <CommonSelect
                      options={statusOptions}
                      defaultValue={getSelectValue(formData.status)}
                      onChange={handleSelectChange('status')}
                      className="select"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal" disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn text-white" style={{backgroundColor: '#ff6b35'}} disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating Activity...
                  </>
                ) : (
                  'Update Activity'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* /Edit Activity */}
    </>
  );
};

export default EditActivity;
