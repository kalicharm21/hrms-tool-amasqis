import React, { useState, useEffect } from "react";
import CommonSelect from "../common/commonSelect";
import { DatePicker } from "antd";
import moment from 'moment';

interface Employee {
  value: string;
  label: string;
  position: string;
  department: string;
  email: string;
  avatar: string;
  employeeId: string;
  remainingLeaves: number;
  totalLeaves: number;
}

interface LeaveType {
  value: string;
  label: string;
  maxDays: number;
  description: string;
}

interface LeaveBalance {
  totalLeaves: number;
  usedLeaves: number;
  remainingLeaves: number;
  employeeName: string;
}

interface RequestModalsProps {
  socket: any;
  onLeaveRequestCreated?: () => void;
}

const RequestModals: React.FC<RequestModalsProps> = ({ socket, onLeaveRequestCreated }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  const [calculatedDays, setCalculatedDays] = useState(0);

  useEffect(() => {
    if (socket) {
      loadModalData();
      setupSocketListeners();
    }

    return () => {
      if (socket) {
        socket.off("admin/leave/get-modal-data-response");
        socket.off("admin/leave/get-employee-balance-response");
        socket.off("admin/leave/create-request-response");
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const loadModalData = () => {
    setLoading(true);
    socket.emit("admin/leave/get-modal-data");
  };

  const setupSocketListeners = () => {
    socket.on("admin/leave/get-modal-data-response", (response: any) => {
      setLoading(false);
      if (response.done) {
        setEmployees(response.data.employees);
        setLeaveTypes(response.data.leaveTypes);
      } else {
        console.error("Error loading modal data:", response.error);
      }
    });

    socket.on("admin/leave/get-employee-balance-response", (response: any) => {
      setLoadingBalance(false);
      if (response.done) {
        setLeaveBalance(response.data);
      } else {
        console.error("Error loading employee balance:", response.error);
        setLeaveBalance(null);
      }
    });

    socket.on("admin/leave/create-request-response", (response: any) => {
      setSubmitting(false);
      if (response.done) {
        // Success - close modal and reset form
        const modal = document.getElementById('add_leaves');
        if (modal) {
          const bootstrapModal = (window as any).bootstrap.Modal.getInstance(modal);
          if (bootstrapModal) {
            bootstrapModal.hide();
          }
        }
        resetForm();
        if (onLeaveRequestCreated) {
          onLeaveRequestCreated();
        }
        // Show success message
        alert("Leave request created successfully!");
      } else {
        console.error("Error creating leave request:", response.error);
        alert("Error creating leave request: " + response.error);
      }
    });
  };

  const handleEmployeeChange = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData(prev => ({ ...prev, employeeId: employee.value }));
    setLeaveBalance(null);

    // Fetch employee leave balance
    if (employee.value) {
      setLoadingBalance(true);
      socket.emit("admin/leave/get-employee-balance", { employeeId: employee.value });
    }
  };

  const handleLeaveTypeChange = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType);
    setFormData(prev => ({ ...prev, leaveType: leaveType.value }));
  };

  const handleDateChange = (field: 'fromDate' | 'toDate', date: any) => {
    const dateString = date ? date.format('YYYY-MM-DD') : '';
    setFormData(prev => ({ ...prev, [field]: dateString }));

    // Calculate days when both dates are selected
    if (field === 'fromDate' && formData.toDate) {
      calculateDays(dateString, formData.toDate);
    } else if (field === 'toDate' && formData.fromDate) {
      calculateDays(formData.fromDate, dateString);
    }
  };

  const calculateDays = (fromDate: string, toDate: string) => {
    if (fromDate && toDate) {
      const from = moment(fromDate);
      const to = moment(toDate);
      const days = to.diff(from, 'days') + 1;
      setCalculatedDays(days > 0 ? days : 0);
    } else {
      setCalculatedDays(0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.employeeId || !formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    if (calculatedDays <= 0) {
      alert("Please select valid dates");
      return;
    }

    if (leaveBalance && calculatedDays > leaveBalance.remainingLeaves) {
      alert(`Cannot request ${calculatedDays} days. Only ${leaveBalance.remainingLeaves} days remaining.`);
      return;
    }

    setSubmitting(true);
    socket.emit("admin/leave/create-request", {
      ...formData,
      numberOfDays: calculatedDays,
    });
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      leaveType: '',
      fromDate: '',
      toDate: '',
      reason: '',
    });
    setSelectedEmployee(null);
    setSelectedLeaveType(null);
    setLeaveBalance(null);
    setCalculatedDays(0);
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById('add_leaves');
    return modalElement ? modalElement : document.body;
  };

  return (
    <>
      {/* Add Leaves */}
      <div className="modal fade" id="add_leaves">
        <div className="modal-dialog modal-dialog-centered modal-md">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Add Leave Request</h4>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetForm}
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body pb-0">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Employee Name <span className="text-danger">*</span></label>
                        <CommonSelect
                          className="select"
                          options={[
                            { value: '', label: 'Select Employee' },
                            ...employees
                          ]}
                          defaultValue={selectedEmployee ? { value: selectedEmployee.value, label: selectedEmployee.label } : { value: '', label: 'Select Employee' }}
                          onChange={(option: any) => {
                            const employee = employees.find(emp => emp.value === option.value);
                            if (employee) {
                              handleEmployeeChange(employee);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {selectedEmployee && (
                      <div className="col-md-12">
                        <div className="mb-3">
                          <div className="alert alert-info py-2">
                            <small>
                              <strong>Employee:</strong> {selectedEmployee.label}<br />
                              <strong>Position:</strong> {selectedEmployee.position}<br />
                              <strong>Department:</strong> {selectedEmployee.department}
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Leave Type <span className="text-danger">*</span></label>
                        <CommonSelect
                          className="select"
                          options={[
                            { value: '', label: 'Select Leave Type' },
                            ...leaveTypes
                          ]}
                          defaultValue={selectedLeaveType ? { value: selectedLeaveType.value, label: selectedLeaveType.label } : { value: '', label: 'Select Leave Type' }}
                          onChange={(option: any) => {
                            const leaveType = leaveTypes.find(type => type.value === option.value);
                            if (leaveType) {
                              handleLeaveTypeChange(leaveType);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {selectedLeaveType && (
                      <div className="col-md-12">
                        <div className="mb-3">
                          <div className="alert alert-secondary py-2">
                            <small>
                              <strong>Description:</strong> {selectedLeaveType.description}<br />
                              <strong>Max Days:</strong> {selectedLeaveType.maxDays}
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">From Date <span className="text-danger">*</span></label>
                        <div className="input-icon-end position-relative">
                          <DatePicker
                            className="form-control datetimepicker"
                            format="DD-MM-YYYY"
                            getPopupContainer={getModalContainer}
                            placeholder="DD-MM-YYYY"
                            value={formData.fromDate ? moment(formData.fromDate) : null}
                            onChange={(date) => handleDateChange('fromDate', date)}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar text-gray-7" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">To Date <span className="text-danger">*</span></label>
                        <div className="input-icon-end position-relative">
                          <DatePicker
                            className="form-control datetimepicker"
                            format="DD-MM-YYYY"
                            getPopupContainer={getModalContainer}
                            placeholder="DD-MM-YYYY"
                            value={formData.toDate ? moment(formData.toDate) : null}
                            onChange={(date) => handleDateChange('toDate', date)}
                            disabledDate={(current) => {
                              if (!formData.fromDate) return current && current < moment().startOf('day');
                              return current && current < moment(formData.fromDate);
                            }}
                          />
                          <span className="input-icon-addon">
                            <i className="ti ti-calendar text-gray-7" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">No of Days</label>
                        <input
                          type="text"
                          className="form-control"
                          value={calculatedDays}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Remaining Days</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            value={loadingBalance ? 'Loading...' : leaveBalance ? leaveBalance.remainingLeaves : 'N/A'}
                            disabled
                          />
                          {loadingBalance && (
                            <div className="input-group-text">
                              <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {leaveBalance && (
                      <div className="col-md-12">
                        <div className="mb-3">
                          <div className="alert alert-success py-2">
                            <small>
                              <strong>Total Annual Leave:</strong> {leaveBalance.totalLeaves} days<br />
                              <strong>Used:</strong> {leaveBalance.usedLeaves} days<br />
                              <strong>Remaining:</strong> {leaveBalance.remainingLeaves} days
                            </small>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="col-md-12">
                      <div className="mb-3">
                        <label className="form-label">Reason <span className="text-danger">*</span></label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={formData.reason}
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Enter reason for leave request..."
                        />
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
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || loading}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Leave Request'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* /Add Leaves */}
    </>
  );
};

export default RequestModals;

