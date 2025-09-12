import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DatePicker } from "antd";
import { Socket } from "socket.io-client";
import { useSocket } from "../../../SocketContext";
import Table from "../../../core/common/dataTable/index";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { all_routes } from "../../router/all_routes";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  title: string;
  clientId?: string;
  amount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
};

const Invoices: React.FC = () => {
  const socket = useSocket() as Socket | null;

  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    createdDate: null as null | { from: string; to: string },
    dueDate: null as null | { from: string; to: string },
    status: "All",
    sortBy: "recent",
  });

  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState<Partial<Invoice>>({});
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({
  totalInvoiceCount: 0,   // number of invoices
  totalInvoiceAmount: 0,  // sum of all invoices
  outstanding: 0,
  draft: 0,
  overdue: 0,
});

useEffect(() => {
  if (!socket) return;
  socket.emit("admin/invoices/stats", null, (res: any) => {
    if (res.done) {
      setStats(res.data);
    }
  });
}, [socket]);

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // request list when filters or socket change
  useEffect(() => {
    if (!socket) return;
    setLoading(true);
    socket.emit("admin/invoices/get", filters);
  }, [socket, filters]);

  // listeners for responses and updates
  useEffect(() => {
    if (!socket) return;

    const handleGetResponse = (res: { done: boolean; data?: Invoice[]; error?: string }) => {
      if (res.done) {
        setData(res.data || []);
        setError(null);
      } else {
        setError(res.error || "Failed to fetch invoices.");
      }
      setLoading(false);
    };

    const handleListUpdate = (res: { done: boolean; data?: Invoice[] }) => {
      if (res.done) setData(res.data || []);
    };

    socket.on("admin/invoices/get-response", handleGetResponse);
    socket.on("admin/invoices/list-update", handleListUpdate);

    return () => {
      socket.off("admin/invoices/get-response", handleGetResponse);
      socket.off("admin/invoices/list-update", handleListUpdate);
    };
  }, [socket]);

  // prefill edit form when an invoice is selected
  useEffect(() => {
    if (!editingInvoice) return;
    setEditForm({
      invoiceNumber: editingInvoice.invoiceNumber,
      title: editingInvoice.title,
      clientId: editingInvoice.clientId,
      amount: editingInvoice.amount,
      status: editingInvoice.status,
      dueDate: editingInvoice.dueDate,
    });
  }, [editingInvoice]);

  const handleEditFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInvoice = (newInvoice: Partial<Invoice>) => {
  if (!socket) return;
  socket.emit("admin/invoices/create", newInvoice, (res: { done: boolean; data?: Invoice; error?: string }) => {
    if (res.done) {
      // Optionally close modal + show success
      console.log("Invoice created:", res.data);
    } else {
      console.error(res.error);
    }
  });
};

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !editingInvoice) return;
    socket.emit("admin/invoices/update", { invoiceId: editingInvoice._id, updatedData: editForm });
    setEditingInvoice(null);
  };

  const confirmDelete = () => {
    if (!socket || !invoiceToDelete) return;
    socket.emit("admin/invoices/delete", { invoiceId: invoiceToDelete });
    setInvoiceToDelete(null);
  };

  const columns = [
    {
      title: "Invoice",
      dataIndex: "invoiceNumber",
      render: (text: string, record: Invoice) => <Link to={all_routes.invoiceDetails} className="tb-data">{text}</Link>,
      sorter: (a: Invoice, b: Invoice) => a.invoiceNumber.localeCompare(b.invoiceNumber),
    },
    {
      title: "Title",
      dataIndex: "title",
      sorter: (a: Invoice, b: Invoice) => a.title.localeCompare(b.title),
    },
    {
      title: "Created On",
      dataIndex: "createdAt",
      render: (d: string) => new Date(d).toLocaleDateString(),
      sorter: (a: Invoice, b: Invoice) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      sorter: (a: Invoice, b: Invoice) => (a.dueDate || "").localeCompare(b.dueDate || ""),
    },
    {
      title: "Total",
      dataIndex: "amount",
      render: (amt: number) => amt.toLocaleString(undefined, { style: "currency", currency: "USD" }),
      sorter: (a: Invoice, b: Invoice) => a.amount - b.amount,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (text: string) => (
        <span className={`badge ${
          text === "Paid" ? "badge-soft-success" :
          text === "Pending" ? "badge-soft-purple" :
          text === "Draft" ? "badge-soft-warning" :
          "badge-soft-danger"
        } d-inline-flex align-items-center`}>
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      ),
      sorter: (a: Invoice, b: Invoice) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "",
      render: (_: any, record: Invoice) => (
        <div className="action-icon d-inline-flex">
          <Link to={all_routes.invoicesdetails} className="me-2"><i className="ti ti-eye" /></Link>
          <button className="btn btn-link p-0 me-2" data-bs-toggle="modal" data-bs-target="#edit_invoice" onClick={() => setEditingInvoice(record)}>
            <i className="ti ti-edit" />
          </button>
          <button className="btn btn-link p-0" data-bs-toggle="modal" data-bs-target="#delete_modal" onClick={() => setInvoiceToDelete(record._id)}>
            <i className="ti ti-trash" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <div className="page-wrapper"><div className="content">Loading...</div></div>;
  }

  if (error) {
    return <div className="page-wrapper"><div className="content"><div className="alert alert-danger">{error}</div></div></div>;
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Invoices</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={all_routes.adminDashboard}><i className="ti ti-smart-home" /></Link>
                  </li>
                  <li className="breadcrumb-item">Application</li>
                  <li className="breadcrumb-item active" aria-current="page">Invoices</li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="dropdown">
                  <Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                    <i className="ti ti-file-export me-2" />Export
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li><Link to="#" className="dropdown-item rounded-1"><i className="ti ti-file-type-pdf me-1" />Export as PDF</Link></li>
                    <li><Link to="#" className="dropdown-item rounded-1"><i className="ti ti-file-type-xls me-1" />Export as Excel</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <Link to={all_routes.addinvoice} className="btn btn-primary d-flex align-items-center">
                  <i className="ti ti-circle-plus me-2" />
                    Add Invoice
                </Link>

              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* SUMMARY CARDS (kept static as requested) */}
          <div className="row">
            <div className="col-xl-3 col-sm-6">
              <div className="card flex-fill"><div className="card-body">
                <div className="d-flex align-items-center overflow-hidden mb-2">
                  <div><p className="fs-12 fw-normal mb-1 text-truncate">Total Invoice</p><h5>${stats.totalInvoiceCount.toLocaleString()}</h5></div>
                </div>
                <div className="attendance-report-bar mb-2">
                  <div className="progress" style={{ height: 5 }}>
                    <div className="progress-bar bg-pink" style={{ width: "85%" }} />
                  </div>
                </div>
                <p className="fs-12 fw-normal d-flex align-items-center text-truncate"><span className="text-success fs-12 d-flex align-items-center me-1"><i className="ti ti-arrow-wave-right-up me-1" />+32.40%</span>from last month</p>
              </div></div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="card flex-fill"><div className="card-body">
                <div className="d-flex align-items-center overflow-hidden mb-2"><div><p className="fs-12 fw-normal mb-1 text-truncate">Outstanding</p><h5>${stats.outstanding.toLocaleString()}</h5></div></div>
                <div className="attendance-report-bar mb-2"><div className="progress" style={{ height: 5 }}><div className="progress-bar bg-purple" style={{ width: "50%" }} /></div></div>
                <p className="fs-12 fw-normal d-flex align-items-center text-truncate"><span className="text-danger fs-12 d-flex align-items-center me-1"><i className="ti ti-arrow-wave-right-up me-1" />-4.40%</span>from last month</p>
              </div></div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="card flex-fill"><div className="card-body">
                <div className="d-flex align-items-center overflow-hidden mb-2"><div><p className="fs-12 fw-normal mb-1 text-truncate">Draft</p><h5>${stats.draft.toLocaleString()}</h5></div></div>
                <div className="attendance-report-bar mb-2"><div className="progress" style={{ height: 5 }}><div className="progress-bar bg-warning" style={{ width: "30%" }} /></div></div>
                <p className="fs-12 fw-normal d-flex align-items-center text-truncate"><span className="text-success fs-12 d-flex align-items-center me-1"><i className="ti ti-arrow-wave-right-up me-1" />12%</span>from last month</p>
              </div></div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="card flex-fill"><div className="card-body">
                <div className="d-flex align-items-center overflow-hidden mb-2"><div><p className="fs-12 fw-normal mb-1 text-truncate">Total Overdue</p><h5>${stats.overdue.toLocaleString()}</h5></div></div>
                <div className="attendance-report-bar mb-2"><div className="progress" style={{ height: 5 }}><div className="progress-bar bg-danger" style={{ width: "20%" }} /></div></div>
                <p className="fs-12 fw-normal d-flex align-items-center text-truncate"><span className="text-danger fs-12 d-flex align-items-center me-1"><i className="ti ti-arrow-wave-right-up me-1" />-15.40%</span>from last month</p>
              </div></div>
            </div>
          </div>

          {/* Table + Filters */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                  <h5 className="d-flex align-items-center">Invoices <span className="badge badge-dark-transparent ms-2">{data.length} Invoices</span></h5>
                  <div className="d-flex align-items-center flex-wrap row-gap-3">
                    <div className="input-icon position-relative w-120 me-2">
                      <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        placeholder="Created Date"
                        onChange={(date, dateString) =>
                          handleFilterChange('createdDate', date ? { from: `${dateString}T00:00:00.000Z`, to: `${dateString}T23:59:59.999Z` } : null)
                        }
                      />
                    </div>
                    <div className="input-icon position-relative w-120 me-2">
                      <span className="input-icon-addon"><i className="ti ti-calendar" /></span>
                      <DatePicker
                        className="form-control datetimepicker"
                        format="DD-MM-YYYY"
                        getPopupContainer={getModalContainer}
                        placeholder="Due Date"
                        onChange={(date, dateString) =>
                          handleFilterChange('dueDate', date ? { from: dateString, to: dateString } : null)
                        }
                      />
                    </div>
                    <div className="dropdown me-2">
                      <Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center" data-bs-toggle="dropdown">
                        {filters.status === "All" ? "Select Status" : filters.status}
                      </Link>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        {["All","Paid","Unpaid","Pending","Draft","Overdue"].map(s => (
                          <li key={s}>
                            <Link to="#" className="dropdown-item rounded-1" onClick={() => handleFilterChange("status", s)}>
                              {s}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="dropdown">
                      <Link to="#" className="dropdown-toggle btn btn-white d-inline-flex align-items-center fs-12" data-bs-toggle="dropdown">
                        <span className="fs-12 d-inline-flex me-1">Sort By : </span>
                        {{
                          recent: "Recent",
                          created_asc: "Created ↑",
                          created_desc: "Created ↓",
                          due_asc: "Due ↑",
                          due_desc: "Due ↓",
                        }[filters.sortBy]}
                      </Link>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        {[
                          ["recent","Recent"],
                          ["created_asc","Created ↑"],
                          ["created_desc","Created ↓"],
                          ["due_asc","Due ↑"],
                          ["due_desc","Due ↓"],
                        ].map(([k, lbl]) => (
                          <li key={k as string}>
                            <Link to="#" className="dropdown-item rounded-1" onClick={() => handleFilterChange("sortBy", k)}>
                              {lbl}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  <Table dataSource={data} columns={columns} Selection={true} />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="footer d-sm-flex align-items-center justify-content-between bg-white border-top p-3">
          <p className="mb-0">2014 - 2025 © SmartHR.</p>
          <p>Designed &amp; Developed By <Link to="#" className="text-primary">Dreams</Link></p>
        </div>
      </div>

      {/* Edit Invoice Modal */}
      <div className="modal fade" id="edit_invoice">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title">Edit Invoice</h4>
              <button type="button" className="btn-close custom-btn-close" data-bs-dismiss="modal" aria-label="Close">
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit}>
              <div className="modal-body pb-0">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Invoice Number</label>
                    <input type="text" name="invoiceNumber" value={String(editForm.invoiceNumber || "")} onChange={handleEditFieldChange} className="form-control" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Title</label>
                    <input type="text" name="title" value={String(editForm.title || "")} onChange={handleEditFieldChange} className="form-control" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Amount</label>
                    <input type="number" name="amount" value={String(editForm.amount ?? "")} onChange={handleEditFieldChange} className="form-control" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Due Date</label>
                    <input type="date" name="dueDate" value={String(editForm.dueDate ?? "")} onChange={handleEditFieldChange} className="form-control" />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select name="status" value={String(editForm.status ?? "Unpaid")} onChange={handleEditFieldChange} className="form-select">
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Pending">Pending</option>
                      <option value="Draft">Draft</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-white border me-2" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary" data-bs-dismiss="modal">Update Invoice</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Modal (keep id 'delete_modal' as original markup used it) */}
      <div className="modal fade" id="delete_modal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={(e) => { e.preventDefault(); confirmDelete(); }} >
              <div className="modal-body text-center">
                <span className="delete-icon"><i className="ti ti-trash-x" /></span>
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this invoice? This action can be undone.</p>
                <div className="d-flex justify-content-center">
                  <button type="button" className="btn btn-light me-3" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" className="btn btn-danger" data-bs-dismiss="modal">Yes, Delete</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

    </>
  );
};

export default Invoices;
