import React, { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import { useCompanies } from "../../../hooks/useCompanies";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import PredefinedDateRanges from "../../../core/common/datePicker";
import Table from "../../../core/common/dataTable/index";
import CrmsModal from "../../../core/modals/crms_modal";
import { useAuth } from "@clerk/clerk-react";

const CompaniesList = () => {
  const routes = all_routes;
  const { companies, fetchCompanies, loading, error } = useCompanies();
  const { getToken } = useAuth();
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const data = useMemo(() => {
    let filteredCompanies = companies;

    // Apply search filter
    if (searchTerm) {
      filteredCompanies = filteredCompanies.filter((c: any) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filteredCompanies = filteredCompanies.filter((c: any) => c.status === statusFilter);
    }

    // Apply company filter (for specific company selection)
    if (companyFilter !== "all") {
      filteredCompanies = filteredCompanies.filter((c: any) => c._id === companyFilter);
    }

    // Apply sorting
    filteredCompanies.sort((a: any, b: any) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filteredCompanies.map((c: any) => ({
      key: c._id,
      Company_Name: c.name,
      Email: c.email || "",
      Phone: c.phone || "",
      Location: c.address?.city || c.address?.country || c.location || "",
      Rating: c.rating || 0,
      Owner: c.ownerName || "",
      Image: c.image || "company-01.svg",
      Status: c.status || "Active",
      _id: c._id,
      createdAt: c.createdAt,
      industry: c.industry,
      source: c.source,
    }));
  }, [companies, searchTerm, statusFilter, companyFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCompanies({ limit: 100 });
  }, [fetchCompanies]);

  useEffect(() => {
    const onChanged = () => fetchCompanies({ limit: 100 });
    window.addEventListener("companies:changed", onChanged as any);
    return () => window.removeEventListener("companies:changed", onChanged as any);
  }, [fetchCompanies]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

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
        console.error('Export failed');
        alert('Export failed. Please try again.');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const columns = [
    {
      title: (
        <div className="d-flex align-items-center">
          Company Name
          <button
            className="btn btn-sm btn-link p-0 ms-1"
            onClick={() => handleSort("name")}
          >
            <i className={`ti ti-arrow-up ${sortBy === "name" && sortOrder === "asc" ? "text-primary" : ""}`}></i>
            <i className={`ti ti-arrow-down ${sortBy === "name" && sortOrder === "desc" ? "text-primary" : ""}`}></i>
          </button>
        </div>
      ),
      dataIndex: "Company_Name",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link
            to={routes.companiesDetails.replace(':companyId', record._id)}
            className="avatar avatar-md border rounded-circle"
          >
            <ImageWithBasePath
              src={`assets/img/company/${record.Image}`}
              className="img-fluid"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to={routes.companiesDetails.replace(':companyId', record._id)}>{text}</Link>
            </h6>
          </div>
        </div>
      ),
    },
    {
      title: (
        <div className="d-flex align-items-center">
          Email
          <button
            className="btn btn-sm btn-link p-0 ms-1"
            onClick={() => handleSort("email")}
          >
            <i className={`ti ti-arrow-up ${sortBy === "email" && sortOrder === "asc" ? "text-primary" : ""}`}></i>
            <i className={`ti ti-arrow-down ${sortBy === "email" && sortOrder === "desc" ? "text-primary" : ""}`}></i>
          </button>
        </div>
      ),
      dataIndex: "Email",
    },
    {
      title: (
        <div className="d-flex align-items-center">
          Phone
          <button
            className="btn btn-sm btn-link p-0 ms-1"
            onClick={() => handleSort("phone")}
          >
            <i className={`ti ti-arrow-up ${sortBy === "phone" && sortOrder === "asc" ? "text-primary" : ""}`}></i>
            <i className={`ti ti-arrow-down ${sortBy === "phone" && sortOrder === "desc" ? "text-primary" : ""}`}></i>
          </button>
        </div>
      ),
      dataIndex: "Phone",
    },
    {
      title: (
        <div className="d-flex align-items-center">
          Location
          <button
            className="btn btn-sm btn-link p-0 ms-1"
            onClick={() => handleSort("location")}
          >
            <i className={`ti ti-arrow-up ${sortBy === "location" && sortOrder === "asc" ? "text-primary" : ""}`}></i>
            <i className={`ti ti-arrow-down ${sortBy === "location" && sortOrder === "desc" ? "text-primary" : ""}`}></i>
          </button>
        </div>
      ),
      dataIndex: "Location",
    },
    {
      title: (
        <div className="d-flex align-items-center">
          Rating
          <button
            className="btn btn-sm btn-link p-0 ms-1"
            onClick={() => handleSort("rating")}
          >
            <i className={`ti ti-arrow-up ${sortBy === "rating" && sortOrder === "asc" ? "text-primary" : ""}`}></i>
            <i className={`ti ti-arrow-down ${sortBy === "rating" && sortOrder === "desc" ? "text-primary" : ""}`}></i>
          </button>
        </div>
      ),
      dataIndex: "Rating",
      render: (text: string) => (
        <span className="d-flex align-items-center">
          <i className="ti ti-star-filled text-warning me-2"></i>
          {text}
        </span>
      ),
    },
    {
      title: (
        <div className="d-flex align-items-center">
          Owner
          <button
            className="btn btn-sm btn-link p-0 ms-1"
            onClick={() => handleSort("ownerName")}
          >
            <i className={`ti ti-arrow-up ${sortBy === "ownerName" && sortOrder === "asc" ? "text-primary" : ""}`}></i>
            <i className={`ti ti-arrow-down ${sortBy === "ownerName" && sortOrder === "desc" ? "text-primary" : ""}`}></i>
          </button>
        </div>
      ),
      dataIndex: "Owner",
    },
    {
      title: "Contact",
      dataIndex: "",
      render: () => (
        <ul className="contact-icon d-flex align-items-center ">
          <li>
            <Link
              to="#"
              className="p-1 rounded-circle contact-icon-mail d-flex align-items-center justify-content-center"
            >
              <span className="d-flex align-items-center justify-content-center">
                <i className="ti ti-mail text-gray-5"></i>
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className="p-1 rounded-circle contact-icon-call d-flex align-items-center justify-content-center"
            >
              <span className="d-flex align-items-center justify-content-center">
                <i className="ti ti-phone-call text-gray-5"></i>
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className="p-1 rounded-circle contact-icon-msg d-flex align-items-center justify-content-center"
            >
              <span className="d-flex align-items-center justify-content-center">
                <i className="ti ti-message-2 text-gray-5"></i>
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className="p-1 rounded-circle contact-icon-skype d-flex align-items-center justify-content-center"
            >
              <span className="d-flex align-items-center justify-content-center">
                <i className="ti ti-brand-skype text-gray-5"></i>
              </span>
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className="p-1 rounded-circle contact-icon-facebook d-flex align-items-center justify-content-center"
            >
              <span className="d-flex align-items-center justify-content-center">
                <i className="ti ti-brand-facebook text-gray-5"></i>
              </span>
            </Link>
          </li>
        </ul>
      ),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <>
          <span
            className={`badge d-inline-flex align-items-center badge-xs ${
              text === "Active" ? "badge-success" : "badge-danger"
            }`}
          >
            <i className="ti ti-point-filled me-1"></i>
            {text}
          </span>
        </>
      ),
      sorter: (a: any, b: any) => a.status.length - b.status.length,
    },

    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string) => (
        <>
          <span
            className={`badge d-inline-flex align-items-center badge-xs ${
              text === "Active" ? "badge-success" : "badge-danger"
            }`}
          >
            <i className="ti ti-point-filled me-1"></i>
            {text}
          </span>
        </>
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: any) => (
        <div className="action-icon d-inline-flex">
          <Link 
            to={routes.companiesDetails.replace(':companyId', record._id)} 
            className="me-2"
            title="View Details"
          >
            <i className="ti ti-eye" />
          </Link>
          {/* <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_company"
            onClick={() => {
              (window as any).CURRENT_COMPANY_ID = record._id;
              // Pre-populate edit form with current company data
              const company = companies.find((c: any) => c._id === record._id);
              if (company) {
                (window as any).CURRENT_COMPANY_DATA = company;
              }
            }}
            title="Edit Company"
          >
            <i className="ti ti-edit" />
          </Link> */}
          <Link 
            to="#" 
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete this company?')) {
                try {
                  const token = await getToken();
                  const response = await fetch(
                    `${(import.meta as any).env?.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/companies/${record._id}`,
                    {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${token}` }
                    }
                  );
                  
                  if (response.ok) {
                    window.dispatchEvent(new CustomEvent('companies:changed'));
                    alert('Company deleted successfully!');
                  } else {
                    alert('Failed to delete company. Please try again.');
                  }
                } catch (err) {
                  console.error('delete company', err);
                  alert('Error deleting company. Please try again.');
                }
              }
            }}
            title="Delete Company"
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ];

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
                    Companies List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={routes.companiesList}
                    className="btn btn-icon btn-sm active bg-primary text-white me-1"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={routes.companiesGrid}
                    className="btn btn-icon btn-sm"
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
                  data-bs-target="#add_company"
                  className="btn btn-primary d-flex align-items-center"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Company
                </Link>
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Companies List ({data.length} companies)</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                {/* Search Input */}
                <div className="me-3">
                  <div className="input-icon-end position-relative">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-search" />
                    </span>
                  </div>
                </div>
                
                {/* Company Filter */}
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    {companyFilter === "all" ? "All Companies" : companies.find((c: any) => c._id === companyFilter)?.name || "Select Company"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={() => setCompanyFilter("all")}
                      >
                        All Companies
                      </Link>
                    </li>
                    {companies.map((company: any) => (
                      <li key={company._id}>
                        <Link 
                          to="#" 
                          className="dropdown-item rounded-1"
                          onClick={() => setCompanyFilter(company._id)}
                        >
                          {company.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Status Filter */}
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    {statusFilter === "all" ? "All Status" : statusFilter}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={() => setStatusFilter("all")}
                      >
                        All Status
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={() => setStatusFilter("Active")}
                      >
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={() => setStatusFilter("Inactive")}
                      >
                        Inactive
                      </Link>
                    </li>
                  </ul>
                </div>
                
                {/* Export Dropdown */}
                <div className="dropdown me-3">
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
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={() => handleExport('pdf')}
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={() => handleExport('excel')}
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading companies...</span>
                </div>
              ) : error ? (
                <div className="d-flex justify-content-center align-items-center p-5">
                  <div className="text-center">
                    <i className="ti ti-alert-circle fs-48 text-danger mb-3"></i>
                    <h5>Error Loading Companies</h5>
                    <p className="text-muted">{error}</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => fetchCompanies({ limit: 100 })}
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : data.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center p-5">
                  <div className="text-center">
                    <i className="ti ti-building fs-48 text-muted mb-3"></i>
                    <h5>No Companies Found</h5>
                    <p className="text-muted">
                      {searchTerm || statusFilter !== "all" || companyFilter !== "all" 
                        ? "No companies match your current filters." 
                        : "Get started by adding your first company."}
                    </p>
                    {searchTerm || statusFilter !== "all" || companyFilter !== "all" ? (
                      <button 
                        className="btn btn-outline-primary"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                          setCompanyFilter("all");
                        }}
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <Link
                        to="#"
                        data-bs-toggle="modal"
                        data-bs-target="#add_company"
                        className="btn btn-primary"
                      >
                        <i className="ti ti-circle-plus me-2" />
                        Add Company
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <Table dataSource={data} columns={columns} Selection={true} />
              )}
            </div>
          </div>
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between bg-white p-3">
          <p className="mb-0">2014 - 2025 © Amasqis.</p>
          <p>
            Designed & Developed By{" "}
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

export default CompaniesList;
