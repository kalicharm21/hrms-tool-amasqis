import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import CrmsModal from "../../../core/modals/crms_modal";
import { useCompanies } from "../../../hooks/useCompanies";
import { useAuth } from "@clerk/clerk-react";

const CompaniesGrid = () => {
  const routes = all_routes;
  const { getToken } = useAuth();
  const { companies, fetchCompanies, loading, error } = useCompanies();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchCompanies({ limit: 100 });
  }, [fetchCompanies]);

  useEffect(() => {
    const onChanged = () => fetchCompanies({ limit: 100 });
    window.addEventListener("companies:changed", onChanged as any);
    return () => window.removeEventListener("companies:changed", onChanged as any);
  }, [fetchCompanies]);

  const filteredCompanies = useMemo(() => {
    let filtered = companies;
    if (searchTerm) {
      filtered = filtered.filter((c: any) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((c: any) => c.status === statusFilter);
    }
    if (companyFilter !== "all") {
      filtered = filtered.filter((c: any) => c._id === companyFilter);
    }
    filtered = [...filtered].sort((a: any, b: any) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";
      // if (typeof aValue === "string") {
      //   aValue = aValue.toLowerCase();
      //   bValue = bValue.toLowerCase();
      // }
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    return filtered;
  }, [companies, searchTerm, statusFilter, companyFilter, sortBy, sortOrder]);

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${(import.meta as any).env?.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/companies/export?format=${format}`,
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
        a.download = `companies.${format}`;
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
              <h2 className="mb-1">Companies</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">CRM</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Companies Grid
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={routes.companiesList}
                    className="btn btn-icon btn-sm me-1"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={routes.companiesGrid}
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
                  data-bs-target="#add_company"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Company
                </Link>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}

          {/* Search/Filter/Sort Controls */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ maxWidth: 200 }}
            />
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select className="form-select" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="all">All Companies</option>
              {companies.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
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
                <span className="ms-2">Loading companies...</span>
              </div>
            ) : error ? (
              <div className="alert alert-danger w-100">{error}</div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center p-5 w-100">
                <i className="ti ti-building fs-48 text-muted mb-3"></i>
                <h5>No Companies Found</h5>
                <p className="text-muted">Try adjusting your filters or add a new company.</p>
              </div>
            ) : (
              filteredCompanies.map((c: any) => (
                <div className="col-xl-3 col-lg-4 col-md-6" key={c._id}>
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="form-check form-check-md">
                          <input className="form-check-input" type="checkbox" />
                        </div>
                        <div>
                          <Link
                            to={routes.companiesDetails.replace(':companyId', c._id)}
                            className="avatar avatar-xl avatar-rounded online border rounded-circle"
                          >
                            <ImageWithBasePath
                              src={`assets/img/company/${c.image || "company-01.svg"}`}
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
                            {/* <li>
                              <Link className="dropdown-item rounded-1" to="#" data-bs-toggle="modal" data-bs-target="#edit_company" onClick={() => { (window as any).CURRENT_COMPANY_ID = c._id; }}>
                                <i className="ti ti-edit me-1" />
                                Edit
                              </Link>
                            </li> */}
                            <li>
                              <Link className="dropdown-item rounded-1" to="#" onClick={async () => {
                                if (!window.confirm('Are you sure you want to delete this company?')) return;
                                try {
                                  const token = await getToken();
                                  await fetch(`${(import.meta as any).env?.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/companies/${c._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                  window.dispatchEvent(new CustomEvent('companies:changed'));
                                  alert('Company deleted!');
                                } catch (err) { console.error('delete company', err); alert('Delete failed!') }
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
                          <Link to={`${routes.companiesDetails.replace(':companyId', c._id)}`}>{c.name}</Link>
                        </h6>
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
                          {c.address?.city || c.location || "-"}
                        </p>
                      </div>
                      <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-star-filled text-warning me-1" />
                          {c.rating ?? 0}
                        </span>
                        <span className={`badge badge-xs ${c.status === "Active" ? "badge-success" : "badge-danger"}`}>
                          {c.status}
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

export default CompaniesGrid;