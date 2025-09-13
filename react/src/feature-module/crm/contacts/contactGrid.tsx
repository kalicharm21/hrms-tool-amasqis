import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import CrmsModal from "../../../core/modals/crms_modal";
import { useContacts } from "../../../hooks/useContacts";
import { useAuth } from "@clerk/clerk-react";

const ContactGrid = () => {
  const routes = all_routes;
  const { getToken } = useAuth();
  const { contacts, fetchContacts, loading, error } = useContacts();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchContacts({ limit: 100 });
  }, [fetchContacts]);

  useEffect(() => {
    const onChanged = () => fetchContacts({ limit: 100 });
    window.addEventListener("contacts:changed", onChanged as any);
    return () => window.removeEventListener("contacts:changed", onChanged as any);
  }, [fetchContacts]);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    if (searchTerm) {
      filtered = filtered.filter((c: any) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      );
    }
    filtered = [...filtered].sort((a: any, b: any) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    return filtered;
  }, [contacts, searchTerm, sortBy, sortOrder]);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${(import.meta as any).env?.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/contacts/export?format=${format}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Export failed. Please try again.');
      }
    } catch (error) {
      alert('Export failed. Please try again.');
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Contacts</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">CRM</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Contacts Grid
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={routes.contactList}
                    className="btn btn-icon btn-sm me-1"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={routes.contactGrid}
                    className="btn btn-icon btn-sm active bg-primary text-white"
                  >
                    <i className="ti ti-layout-grid" />
                  </Link>
                </div>
              </div>
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
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => handleExport('pdf')}>
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1" onClick={() => handleExport('excel')}>
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <Link
                  to="#"
                  data-bs-toggle="modal"
                  data-bs-target="#add_contact"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Contact
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Search/Sort Controls */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ maxWidth: 200 }}
            />
            <button className="btn btn-outline-secondary" onClick={() => {
              setSortBy("name");
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            }}>
              Sort by Name {sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
            </button>
            <button className="btn btn-outline-secondary" onClick={() => {
              setSortBy("rating");
              setSortOrder(sortOrder === "asc" ? "desc" : "asc");
            }}>
              Sort by Rating {sortBy === "rating" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
            </button>
          </div>

          {/* Grid */}
          <div className="row">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center p-5 w-100">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2">Loading contacts...</span>
              </div>
            ) : error ? (
              <div className="alert alert-danger w-100">{error}</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center p-5 w-100">
                <i className="ti ti-users fs-48 text-muted mb-3"></i>
                <h5>No Contacts Found</h5>
                <p className="text-muted">Try adjusting your search or add a new contact.</p>
              </div>
            ) : (
              filteredContacts.map((c: any) => (
                <div className="col-xl-3 col-lg-4 col-md-6" key={c._id}>
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                        <div>
                          <Link
                            to={routes.contactDetails.replace(':contactId', c._id)}
                            className="avatar avatar-xl avatar-rounded online border p-1 border-primary rounded-circle"
                          >
                            <ImageWithBasePath
                              src={`assets/img/users/${c.image || "user-01.jpg"}`}
                              className="img-fluid h-auto w-auto"
                              alt="img"
                            />
                          </Link>
                        </div>
                        <div className="dropdown">
                          <button
                            className="btn btn-icon btn-sm rounded-circle"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                          >
                            <i className="ti ti-dots-vertical" />
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li>
                              <Link className="dropdown-item rounded-1" to="#" onClick={async () => {
                                if (!window.confirm('Are you sure you want to delete this contact?')) return;
                                try {
                                  const token = await getToken();
                                  await fetch(`${(import.meta as any).env?.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/contacts/${c._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                  window.dispatchEvent(new CustomEvent('contacts:changed'));
                                  alert('Contact deleted!');
                                } catch (err) { console.error('delete contact', err); alert('Delete failed!') }
                              }}>
                                <i className="ti ti-trash me-1" />
                                Delete
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="text-center mb-3">
                        <h6 className="mb-1">
                          <Link to={routes.contactDetails.replace(':contactId', c._id)}>
                            {c.name && c.name !== "-" ? c.name : ((c.firstName || "") + (c.lastName ? " " + c.lastName : "")).trim() || "-"}
                          </Link>
                        </h6>
                        <span className="badge bg-pink-transparent fs-10 fw-medium">
                          {c.role || "-"}
                        </span>
                      </div>
                      <div className="d-flex flex-column">
                        <p className="text-dark d-inline-flex align-items-center mb-2">
                          <i className="ti ti-mail-forward text-gray-5 me-2" />
                          {c.email || "-"}
                        </p>
                        <p className="text-dark d-inline-flex align-items-center mb-2">
                          <i className="ti ti-phone text-gray-5 me-2" />
                          {c.phone || "-"}
                        </p>
                        <p className="text-dark d-inline-flex align-items-center">
                          <i className="ti ti-map-pin text-gray-5 me-2" />
                          {c.location || "-"}
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3">
                        <div className="icons-social d-flex align-items-center">
                          <Link to="#" className="avatar avatar-rounded avatar-sm me-1">
                            <i className="ti ti-mail" />
                          </Link>
                          <Link to="#" className="avatar avatar-rounded avatar-sm me-1">
                            <i className="ti ti-phone-call" />
                          </Link>
                          <Link to="#" className="avatar avatar-rounded avatar-sm me-1">
                            <i className="ti ti-message-2" />
                          </Link>
                          <Link to="#" className="avatar avatar-rounded avatar-sm me-1">
                            <i className="ti ti-brand-skype" />
                          </Link>
                          <Link to="#" className="avatar avatar-rounded avatar-sm">
                            <i className="ti ti-brand-facebook" />
                          </Link>
                        </div>
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-star-filled text-warning me-1" />
                          {c.rating ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center mb-4">
            <Link to="#" className="btn btn-white border">
              <i className="ti ti-loader-3 text-primary me-2" />
              Load More
            </Link>
          </div>
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
      <CrmsModal />
    </>
  );
};

export default ContactGrid;