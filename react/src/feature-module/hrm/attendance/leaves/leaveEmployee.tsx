import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Modal } from "bootstrap";
import moment, { Moment } from "moment";
import CommonSelect, { Option } from "../../../../core/common/commonSelect";
import Table from "../../../../core/common/dataTable/index";
import { DatePicker } from "antd";
import { useSocket } from "../../../../SocketContext";
import { all_routes } from '../../../router/all_routes';

const leaveTypeOptions: Option[] = [
  { value: "Select", label: "Select" },
  { value: "medical leave", label: "Medical Leave" },
  { value: "casual leave", label: "Casual Leave" },
  { value: "annual leave", label: "Annual Leave" },
];

const LeaveEmployee = () => {
  const socket = useSocket();
  const [leaveList, setLeaveList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add leave states
  const [leaveType, setLeaveType] = useState<Option | null>(leaveTypeOptions[0]);
  const [fromDate, setFromDate] = useState<Moment | null>(null);
  const [toDate, setToDate] = useState<Moment | null>(null);
  const [reason, setReason] = useState("");
  const [noOfDays, setNoOfDays] = useState(0);

  // Edit leave states
  const [editLeave, setEditLeave] = useState<any>(null);

  // Delete leave state
  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null);

  // Calculate noOfDays for add modal whenever dates change
  useEffect(() => {
    if (fromDate && toDate) {
      const days = toDate.diff(fromDate, "days") + 1;
      setNoOfDays(days > 0 ? days : 0);
    } else {
      setNoOfDays(0);
    }
  }, [fromDate, toDate]);

  // Calculate noOfDays dynamically for editLeave modal
  useEffect(() => {
    if (
      editLeave &&
      editLeave.startDate &&
      editLeave.endDate &&
      moment.isMoment(editLeave.startDate) &&
      moment.isMoment(editLeave.endDate)
    ) {
      const days = editLeave.endDate.diff(editLeave.startDate, "days") + 1;
      setEditLeave((prev: any) => ({ ...prev, noOfDays: days > 0 ? days : 0 }));
    } else if (editLeave) {
      setEditLeave((prev: any) => ({ ...prev, noOfDays: 0 }));
    }
  }, [editLeave?.startDate, editLeave?.endDate]);

  // Fetch leave list
  const fetchLeaveList = useCallback(() => {
    if (!socket) return;
    setLoading(true);
    socket.emit("employee/dashboard/get-leave-list", { year: new Date().getFullYear() });
  }, [socket]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      fetchLeaveList();
    };

    const onGetLeaveList = (res: any) => {
      setLoading(false);
      if (res.done) {
        const leaves = (res.data || []).map((l: any) => ({
          ...l,
          startDate: l.startDate ? moment(l.startDate) : null,
          endDate: l.endDate ? moment(l.endDate) : null,
        }));
        setLeaveList(leaves);
      } else {
        alert("Failed to fetch leaves: " + res.error);
      }
    };

    const onAddLeave = (res: any) => {
      if (res.done) {
        alert("Leave added successfully");
        closeModal("add_leaves");
        fetchLeaveList();
        resetAddForm();
      } else {
        alert("Failed to add leave: " + res.error);
      }
    };

    const onEditLeave = (res: any) => {
      if (res.done) {
        alert("Leave updated successfully");
        closeModal("edit_leave_modal");
        fetchLeaveList();
        setEditLeave(null);
      } else {
        alert("Failed to update leave: " + res.error);
      }
    };

    const onDeleteLeave = (res: any) => {
      if (res.done) {
        alert("Leave deleted successfully");
        closeModal("delete_leave_modal");
        fetchLeaveList();
        setDeleteLeaveId(null);
      } else {
        alert("Failed to delete leave: " + res.error);
      }
    };

    socket.on("connect", onConnect);
    socket.on("employee/dashboard/get-leave-list-response", onGetLeaveList);
    socket.on("employee/dashboard/add-leave-response", onAddLeave);
    socket.on("employee/dashboard/edit-leave-response", onEditLeave);
    socket.on("employee/dashboard/delete-leave-response", onDeleteLeave);

    return () => {
      socket.off("connect", onConnect);
      socket.off("employee/dashboard/get-leave-list-response", onGetLeaveList);
      socket.off("employee/dashboard/add-leave-response", onAddLeave);
      socket.off("employee/dashboard/edit-leave-response", onEditLeave);
      socket.off("employee/dashboard/delete-leave-response", onDeleteLeave);
    };
  }, [socket, fetchLeaveList]);

  const resetAddForm = () => {
    setLeaveType(leaveTypeOptions[0]);
    setFromDate(null);
    setToDate(null);
    setReason("");
    setNoOfDays(0);
  };

  const closeModal = (id: string) => {
    const modalEl = document.getElementById(id);
    if (!modalEl) return;
    const existingModal = Modal.getInstance(modalEl);
    if (existingModal) {
      existingModal.hide();
    } else {
      new Modal(modalEl).hide();
    }
  };
const employeeObjectId = socket?.userMetadata?.employeeObjectId || socket?.sub;

const handleAddLeaveSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!leaveType || leaveType.value === "Select") {
    alert("Please select Leave Type");
    return;
  }
  if (!fromDate || !toDate) {
    alert("Please select From and To dates");
    return;
  }
  if (noOfDays <= 0) {
    alert("Invalid date range");
    return;
  }
  if (!reason.trim()) {
    alert("Please specify Reason");
    return;
  }

  socket?.emit("employee/dashboard/add-leave", {
    leaveType: leaveType.value,
    startDate: fromDate.toISOString(),
    endDate: toDate.toISOString(),
    reason,
    employeeId: employeeObjectId,
  });
};

  const openEditModal = (leave: any) => {
    setEditLeave({
      ...leave,
      startDate: leave.startDate ? moment(leave.startDate) : null,
      endDate: leave.endDate ? moment(leave.endDate) : null,
    });
    const modalEl = document.getElementById("edit_leave_modal");
    if (!modalEl) return;
    const existingModal = Modal.getInstance(modalEl) || new Modal(modalEl);
    existingModal.show();
  };

  const updateEditForm = (field: string, value: any) => {
    setEditLeave((prev: any) => ({ ...prev, [field]: value }));
  };

const submitEditLeave = (e: React.FormEvent) => {
  e.preventDefault();
  if (!editLeave) return;
  if (!editLeave.leaveType || editLeave.leaveType === "Select") {
    alert("Please select Leave Type");
    return;
  }
  if (!editLeave.startDate || !editLeave.endDate) {
    alert("Please select From and To dates");
    return;
  }
  if (moment(editLeave.startDate).isAfter(editLeave.endDate)) {
    alert("Invalid date range");
    return;
  }
  if (!editLeave.reason || !editLeave.reason.trim()) {
    alert("Please specify Reason");
    return;
  }

  socket?.emit("employee/dashboard/edit-leave", {
    leaveId: editLeave._id,
    leaveType: editLeave.leaveType,
    startDate: editLeave.startDate.toISOString(),
    endDate: editLeave.endDate.toISOString(),
    reason: editLeave.reason,
    employeeId: employeeObjectId,
  });
};



  const openDeleteModal = (leaveId: string) => {
    setDeleteLeaveId(leaveId);
    const modalEl = document.getElementById("delete_leave_modal");
    if (!modalEl) return;
    const existingModal = Modal.getInstance(modalEl) || new Modal(modalEl);
    existingModal.show();
  };

const confirmDeleteLeave = () => {
  if (!deleteLeaveId) return;
  socket?.emit("employee/dashboard/delete-leave", { leaveId: deleteLeaveId, employeeId: employeeObjectId });
};

  const calculateLeaveCounts = () => {
    const counts = { annual: 0, medical: 0, casual: 0 };
    leaveList.forEach((leave) => {
      const type = leave.leaveType?.toLowerCase();
      if (type === "annual leave") counts.annual++;
      else if (type === "medical leave") counts.medical++;
      else if (type === "casual leave") counts.casual++;
    });
    return counts;
  };

  const counts = calculateLeaveCounts();

  const columns = [
    {
      title: "Leave Type",
      dataIndex: "leaveType",
      sorter: (a: any, b: any) => a.leaveType.localeCompare(b.leaveType),
      render: (text: string) => text.charAt(0).toUpperCase() + text.slice(1),
    },
    {
      title: "From",
      dataIndex: "startDate",
      sorter: (a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "To",
      dataIndex: "endDate",
      sorter: (a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "No of Days",
      dataIndex: "noOfDays",
      sorter: (a: any, b: any) => a.noOfDays - b.noOfDays,
    },
    {
      title: "Status",
      dataIndex: "status",
      sorter: (a: any, b: any) => (a.status || "").localeCompare(b.status || ""),
      render: (status: string) => {
        const stat = (status || "").toLowerCase();
        const bgClass = stat === "approved" ? "bg-transparent-success" : stat === "new" ? "bg-transparent-purple" : "bg-transparent-danger";
        const textClass = stat === "approved" ? "text-success" : stat === "new" ? "text-purple" : "text-danger";
        return (
          <div className="dropdown">
            <Link to="#" className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
              <span className={`rounded-circle ${bgClass} d-flex justify-content-center align-items-center me-2`}>
                <i className={`ti ti-point-filled ${textClass}`} />
              </span>
              {status}
            </Link>
            <ul className="dropdown-menu dropdown-menu-end p-3">
              <li><Link to="#" className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"><span className="rounded-circle bg-transparent-success d-flex justify-content-center align-items-center me-2"><i className="ti ti-point-filled text-success" /></span>Approved</Link></li>
              <li><Link to="#" className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"><span className="rounded-circle bg-transparent-danger d-flex justify-content-center align-items-center me-2"><i className="ti ti-point-filled text-danger" /></span>Declined</Link></li>
              <li><Link to="#" className="dropdown-item rounded-1 d-flex justify-content-start align-items-center"><span className="rounded-circle bg-transparent-purple d-flex justify-content-center align-items-center me-2"><i className="ti ti-point-filled text-purple" /></span>New</Link></li>
            </ul>
          </div>
        );
      },
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: any) => (
        <div className="action-icon d-inline-flex">
          <button type="button" className="btn btn-link text-decoration-none me-2" onClick={() => openEditModal(record)}>
            <i className="ti ti-edit" />
          </button>
          <button type="button" className="btn btn-link text-danger text-decoration-none" onClick={() => openDeleteModal(record._id)}>
            <i className="ti ti-trash" />
          </button>
        </div>
      ),
    },
  ];

  const getModalContainer = () => document.getElementById("modal-datepicker") || document.body;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Leaves</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link to={all_routes?.adminDashboard || "#"}><i className="ti ti-smart-home" /></Link></li>
                <li className="breadcrumb-item">Employee</li>
                <li className="breadcrumb-item active" aria-current="page">Leaves</li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
            <button type="button" className="btn btn-primary d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#add_leaves">
              <i className="ti ti-circle-plus me-2" /> Add Leave
            </button>
          </div>
        </div>

        {/* Leave Cards */}
        <div className="row">
          <div className="col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body d-flex align-items-center justify-content-between">
                <h6>Annual Leave</h6><span className="badge bg-primary">{counts.annual}</span>
              </div>
            </div>
          </div>
          <div className="col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body d-flex align-items-center justify-content-between">
                <h6>Medical Leave</h6><span className="badge bg-success">{counts.medical}</span>
              </div>
            </div>
          </div>
          <div className="col-xl-4 col-md-6">
            <div className="card">
              <div className="card-body d-flex align-items-center justify-content-between">
                <h6>Casual Leave</h6><span className="badge bg-warning">{counts.casual}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Table */}
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h5 className="me-2">Leave List</h5>
          </div>
          <div className="card-body p-0">
            <Table dataSource={leaveList} columns={columns} />
          </div>
        </div>

        {/* Add Leave Modal */}
        <div className="modal fade" id="add_leaves" tabIndex={-1} aria-hidden="true" aria-labelledby="addLeavesLabel">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <form className="modal-content" onSubmit={handleAddLeaveSubmit}>
              <div className="modal-header">
                <h4 className="modal-title" id="addLeavesLabel">Add Leave</h4>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={resetAddForm}/>
              </div>
              <div className="modal-body pb-0">
                <CommonSelect className="select mb-3" options={leaveTypeOptions} defaultValue={leaveType} onChange={setLeaveType} />
                <DatePicker className="form-control datetimepicker mb-3" format="DD-MM-YYYY" getPopupContainer={getModalContainer} placeholder="From Date" allowClear value={fromDate} onChange={setFromDate} />
                <DatePicker className="form-control datetimepicker mb-3" format="DD-MM-YYYY" getPopupContainer={getModalContainer} placeholder="To Date" allowClear value={toDate} onChange={setToDate} />
                <label>No of Days</label>
                <input type="text" className="form-control mb-3" value={noOfDays} disabled />
                <label>Reason</label>
                <textarea className="form-control" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for leave" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light me-2" data-bs-dismiss="modal" onClick={resetAddForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Leave</button>
              </div>
            </form>
          </div>
        </div>

        {/* Edit Leave Modal */}
        <div className="modal fade" id="edit_leave_modal" tabIndex={-1} aria-hidden="true" aria-labelledby="editLeaveLabel">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <form className="modal-content" onSubmit={submitEditLeave}>
              <div className="modal-header">
                <h5 className="modal-title" id="editLeaveLabel">Edit Leave</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setEditLeave(null)} />
              </div>
              <div className="modal-body">
                <CommonSelect className="mb-3" options={leaveTypeOptions} defaultValue={editLeave? { value: editLeave.leaveType, label: editLeave.leaveType.charAt(0).toUpperCase() + editLeave.leaveType.slice(1) } : null} onChange={opt => updateEditForm("leaveType", opt.value)} />
                <DatePicker className="form-control mb-3" format="DD-MM-YYYY" getPopupContainer={getModalContainer} placeholder="From Date" value={editLeave ? editLeave.startDate : null} onChange={date => updateEditForm("startDate", date)} />
                <DatePicker className="form-control mb-3" format="DD-MM-YYYY" getPopupContainer={getModalContainer} placeholder="To Date" value={editLeave ? editLeave.endDate : null} onChange={date => updateEditForm("endDate", date)} />
                <label>No of Days</label>
                <input type="text" className="form-control mb-3" value={editLeave?.noOfDays || 0} disabled />
                <label>Reason</label>
                <textarea className="form-control" placeholder="Reason" rows={3} value={editLeave ? editLeave.reason : ""} onChange={e => updateEditForm("reason", e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => setEditLeave(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        {/* Delete Leave Modal */}
        <div className="modal fade" id="delete_leave_modal" tabIndex={-1} aria-hidden="true" aria-labelledby="deleteLeaveLabel">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="deleteLeaveLabel">Confirm Delete</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setDeleteLeaveId(null)} />
              </div>
              <div className="modal-body">Are you sure you want to delete this leave?</div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => setDeleteLeaveId(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={confirmDeleteLeave}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveEmployee;
