import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Table from "../../../../core/common/dataTable/index";
import CommonSelect from "../../../../core/common/commonSelect";
import PredefinedDateRanges from "../../../../core/common/datePicker";
import ImageWithBasePath from "../../../../core/common/imageWithBasePath";
import { DatePicker, message } from "antd";
import CollapseHeader from "../../../../core/common/collapse-header/collapse-header";
import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:5000", {
  auth: { token: localStorage.getItem("authToken") || "" },
});

const LeaveAdmin = () => {
  // Dashboard stats state replacing your static numbers
  const [dashboard, setDashboard] = useState({
    totalPresent: 0,
    totalEmployees: 0,
    plannedLeaves: 0,
    unplannedLeaves: 0,
    pendingRequests: 0,
  });

  // Leave list data to replace your imported static `leaveadmin_details`
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    // Fetch dashboard summary
    socket.emit("admin/leaves/get-summary");

    // Fetch leaves list
    socket.emit("admin/leaves/get-list");

    socket.on("admin/leaves/get-summary-response", (res) => {
      console.log("Frontend: Received get-summary-response:", res);
      if (res.done) {
        setDashboard(res.data);
      } else {
        message.error(res.error || "Failed to load dashboard summary");
      }
    });

    socket.on("admin/leaves/get-list-response", (res) => {
       console.log("Frontend: Received get-list-response:", res);
      setLoading(false);
      if (res.done) {
        setLeaveData(res.data);
      } else {
        message.error(res.error || "Failed to load leaves list");
        setLeaveData([]);
      }
    });

    return () => {
      socket.off("admin/leaves/get-summary-response");
      socket.off("admin/leaves/get-list-response");
    };
  }, []);

  // Your exact original columns, no changes here
  const columns = [
    {
      title: "Employee",
      dataIndex: "Employee",
      render: (text, record) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md border avatar-rounded">
            <ImageWithBasePath
              src={`assets/img/users/${record.Image || "default.png"}`}
              className="img-fluid"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{record.Employee}</Link>
            </h6>
            <span className="fs-12 fw-normal ">{record.Role}</span>
          </div>
        </div>
      ),
      sorter: (a, b) => a.Employee.length - b.Employee.length,
    },
    {
      title: "Leave Type",
      dataIndex: "LeaveType",
      render: (text, record) => (
        <div className="d-flex align-items-center">
          <p className="fs-14 fw-medium d-flex align-items-center mb-0">
            {record.LeaveType}
          </p>
          <Link
            to="#"
            className="ms-2"
            data-bs-toggle="tooltip"
            data-bs-placement="right"
            data-bs-title="I am currently experiencing a fever and design & Development"
          >
            <i className="ti ti-info-circle text-info" />
          </Link>
        </div>
      ),
      sorter: (a, b) => a.LeaveType.length - b.LeaveType.length,
    },
    {
      title: "From",
      dataIndex: "From",
      sorter: (a, b) => a.From.length - b.From.length,
    },
    {
      title: "To",
      dataIndex: "To",
      sorter: (a, b) => a.To.length - b.To.length,
    },
    {
      title: "No of Days",
      dataIndex: "NoOfDays",
      sorter: (a, b) => a.NoOfDays.length - b.NoOfDays.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: () => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#edit_leaves"
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-inert={true}
            data-bs-target="#delete_modal"
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ];

  // Map backend data to exact schema used in your original static data
  const mappedLeaveData = leaveData.map((leave) => ({
    Employee: leave.employeeName, // or leave.Employee if backend matches exactly
    Role: leave.role || "",
    LeaveType: leave.leaveType,
    From: new Date(leave.startDate).toLocaleDateString(),
    To: new Date(leave.endDate).toLocaleDateString(),
    NoOfDays: `${leave.noOfDays} Days`,
    Image: leave.image || "default.png",
  }));

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Leaves</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Employee</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Leaves
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#add_leaves"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Leave
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Leaves Info */}
          <div className="row">
            <div className="col-xl-3 col-md-6">
              <div className="card bg-green-img">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-2">
                        <span className="avatar avatar-md rounded-circle bg-white d-flex align-items-center justify-content-center">
                          <i className="ti ti-user-check text-success fs-18" />
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Total Present</p>
                      <h4>{dashboard.totalPresent}/{dashboard.totalEmployees}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="card bg-pink-img">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-2">
                        <span className="avatar avatar-md rounded-circle bg-white d-flex align-items-center justify-content-center">
                          <i className="ti ti-user-edit text-pink fs-18" />
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Planned Leaves</p>
                      <h4>{dashboard.plannedLeaves}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="card bg-yellow-img">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-2">
                        <span className="avatar avatar-md rounded-circle bg-white d-flex align-items-center justify-content-center">
                          <i className="ti ti-user-exclamation text-warning fs-18" />
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Unplanned Leaves</p>
                      <h4>{dashboard.unplannedLeaves}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6">
              <div className="card bg-blue-img">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-2">
                        <span className="avatar avatar-md rounded-circle bg-white d-flex align-items-center justify-content-center">
                          <i className="ti ti-user-question text-info fs-18" />
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="mb-1">Pending Requests</p>
                      <h4>{dashboard.pendingRequests}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Leaves Info */}

          {/* Leave List Table */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Leave List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="input-icon-end position-relative">
                    <PredefinedDateRanges />
                    <span className="input-icon-addon">
                      <i className="ti ti-chevron-down" />
                    </span>
                  </div>
                </div>
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Leave Type
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Medical Leave
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Casual Leave
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Annual Leave
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Desending
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <Table dataSource={mappedLeaveData} columns={columns} Selection={true} />
            </div>
          </div>
          {/* /Leaves list */}
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2025 © Amasqis.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="https://amasqis.ai" className="text-primary">
              Amasqis
            </Link>
          </p>
        </div>
      </div>
      {/* /Page Wrapper */}
      {/* Your add/edit modals unchanged */}
    </>
  );
};

export default LeaveAdmin;
