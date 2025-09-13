import React, { useEffect, useMemo, useState } from "react";
import CommonTabs from "../common-components";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import CrmsModal from "../../../core/modals/crms_modal";
import { useCompanies } from "../../../hooks/useCompanies";
import { useParams } from "react-router-dom";

const CompaniesDetails = () => {
  const routes = all_routes;
  const { getCompany } = useCompanies();
  const { companyId } = useParams();
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (companyId) {
        try {
          setLoading(true);
          const data = await getCompany(companyId);
          setActiveCompany(data);
        } catch (error) {
          console.error('Error loading company:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    load();
  }, [companyId, getCompany]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClass = status === 'Active' ? 'badge-success' : 'badge-danger';
    return (
      <span className={`badge d-inline-flex align-items-center badge-xs ${statusClass}`}>
        <i className="ti ti-point-filled me-1"></i>
        {status || 'Unknown'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCompany) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="text-center">
              <h5>Company not found</h5>
              <p className="text-muted">The company you're looking for doesn't exist or has been removed.</p>
              <Link to={routes.companiesGrid} className="btn btn-primary">
                Back to Companies
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="row align-items-center mb-4">
            <div className="col-sm-6">
              <h6 className="fw-medium d-inline-flex align-items-center mb-3 mb-sm-0">
                <Link to={routes.companiesGrid}>
                  <i className="ti ti-arrow-left me-2" />
                  Companies
                </Link>
                <span className="text-gray d-inline-flex ms-2">/ {activeCompany?.name || "Company"}</span>
              </h6>
            </div>
            <div className="col-sm-6">
              <div className="d-flex align-items-center justify-content-sm-end">
                <Link
                  to="#"
                  className="btn btn-primary d-inline-flex align-items-center me-2"
                  data-bs-toggle="modal"
                  data-bs-target="#add_deals"
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Deal
                </Link>
                <Link
                  to="#"
                  className="btn btn-dark d-inline-flex align-items-center me-2"
                  data-bs-toggle="modal"
                  data-bs-target="#edit_company"
                  onClick={() => {(window as any).CURRENT_COMPANY_ID = activeCompany._id;}}
                >
                  <i className="ti ti-edit me-2" />
                  Edit Company
                </Link>
                <Link
                  to="#"
                  className="btn btn-outline-danger d-inline-flex align-items-center me-2"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this company?')) {
                      try {
                        const token = await (window as any).Clerk?.session?.getToken();
                        await fetch(`${(typeof import.meta !== "undefined" && (import.meta as any).env?.REACT_APP_BACKEND_URL) || (window as any).REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/companies/${activeCompany._id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        window.dispatchEvent(new CustomEvent('companies:changed'));
                        window.location.href = routes.companiesGrid;
                      } catch (err) { console.error('delete company', err); }
                    }
                  }}
                >
                  <i className="ti ti-trash me-2" />
                  Delete
                </Link>
                <div className="head-icons ms-2 mb-0">
                  <CollapseHeader />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-4 theiaStickySidebar">
              <div className="card card-bg-1 sticky-class">
                <div className="card-body p-0">
                  <span className="avatar avatar-xl border bg-white rounded-circle m-auto d-flex mb-2">
                    <ImageWithBasePath
                      src={activeCompany?.image ? `assets/img/company/${activeCompany.image}` : "assets/img/company/company-11.svg"}
                      className="w-auto h-auto"
                      alt="Company Logo"
                    />
                  </span>
                  <div className="text-center px-3 pb-3 border-bottom">
                    <h5 className="d-flex align-items-center justify-content-center mb-1">
                      {activeCompany?.name || "Company"}{" "}
                      <i className="ti ti-discount-check-filled text-success ms-1" />
                    </h5>
                    <p className="text-dark">
                      {activeCompany?.address?.fullAddress || activeCompany?.address?.street || activeCompany?.address?.city || ""}
                    </p>
                    <div className="mt-2">
                      {getStatusBadge(activeCompany?.status)}
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Basic information</h6>
                      <Link
                        to="#"
                        className="btn btn-icon btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#edit_company"
                        onClick={() => {(window as any).CURRENT_COMPANY_ID = activeCompany._id;}}
                      >
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-phone me-2" />
                        Phone
                      </span>
                      <p className="text-dark">{activeCompany?.phone || "-"}</p>
                    </div>
                    {activeCompany?.phone2 && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-phone me-2" />
                          Phone 2
                        </span>
                        <p className="text-dark">{activeCompany.phone2}</p>
                      </div>
                    )}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-mail-check me-2" />
                        Email
                      </span>
                      <Link
                        to={`mailto:${activeCompany?.email}`}
                        className="text-info d-inline-flex align-items-center"
                      >
                        {activeCompany?.email || "-"}{" "}
                        <i className="ti ti-copy text-dark ms-2" />
                      </Link>
                    </div>
                    {activeCompany?.website && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-world me-2" />
                          Website
                        </span>
                        <Link
                          to={activeCompany.website.startsWith('http') ? activeCompany.website : `https://${activeCompany.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary d-inline-flex align-items-center"
                        >
                          {activeCompany.website}
                          <i className="ti ti-external-link text-dark ms-2" />
                        </Link>
                      </div>
                    )}
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-calendar me-2" />
                        Created On
                      </span>
                      <p className="text-dark">{formatDate(activeCompany?.createdAt)}</p>
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Other Information</h6>
                      <Link 
                        to="#" 
                        className="btn btn-icon btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#edit_company"
                        onClick={() => {(window as any).CURRENT_COMPANY_ID = activeCompany._id;}}
                      >
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    {activeCompany?.language && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-e-passport me-2" />
                          Language
                        </span>
                        <p className="text-dark">{activeCompany.language}</p>
                      </div>
                    )}
                    {activeCompany?.currency && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-currency-dollar me-2" />
                          Currency
                        </span>
                        <p className="text-dark">{activeCompany.currency}</p>
                      </div>
                    )}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-clock me-2" />
                        Last Modified
                      </span>
                      <p className="text-dark">{formatDate(activeCompany?.updatedAt)}</p>
                    </div>
                    {activeCompany?.source && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-bookmark-plus me-2" />
                          Source
                        </span>
                        <p className="text-dark">{activeCompany.source}</p>
                      </div>
                    )}
                    {activeCompany?.industry && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-building me-2" />
                          Industry
                        </span>
                        <p className="text-dark">{activeCompany.industry}</p>
                      </div>
                    )}
                    {activeCompany?.rating && (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-star me-2" />
                          Rating
                        </span>
                        <div className="d-flex align-items-center">
                          <span className="me-1">{activeCompany.rating}</span>
                          <i className="ti ti-star-filled text-warning" />
                        </div>
                      </div>
                    )}
                  </div>
                  {activeCompany?.tags && activeCompany.tags.length > 0 && (
                    <div className="p-3 border-bottom">
                      <h5 className="mb-3">Tags</h5>
                      <div className="d-flex align-items-center flex-wrap">
                        {activeCompany.tags.map((tag: string, index: number) => (
                          <span key={index} className="badge badge-soft-success me-2 mb-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeCompany?.address && (
                    <div className="p-3 border-bottom">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6>Address Information</h6>
                        <Link 
                          to="#" 
                          className="btn btn-icon btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_company"
                          onClick={() => {(window as any).CURRENT_COMPANY_ID = activeCompany._id;}}
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                      {activeCompany.address.street && (
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="d-inline-flex align-items-center">
                            <i className="ti ti-map-pin me-2" />
                            Street
                          </span>
                          <p className="text-dark">{activeCompany.address.street}</p>
                        </div>
                      )}
                      {activeCompany.address.city && (
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="d-inline-flex align-items-center">
                            <i className="ti ti-building me-2" />
                            City
                          </span>
                          <p className="text-dark">{activeCompany.address.city}</p>
                        </div>
                      )}
                      {activeCompany.address.state && (
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="d-inline-flex align-items-center">
                            <i className="ti ti-map me-2" />
                            State
                          </span>
                          <p className="text-dark">{activeCompany.address.state}</p>
                        </div>
                      )}
                      {activeCompany.address.country && (
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="d-inline-flex align-items-center">
                            <i className="ti ti-flag me-2" />
                            Country
                          </span>
                          <p className="text-dark">{activeCompany.address.country}</p>
                        </div>
                      )}
                      {activeCompany.address.zipCode && (
                        <div className="d-flex align-items-center justify-content-between">
                          <span className="d-inline-flex align-items-center">
                            <i className="ti ti-mail me-2" />
                            Zip Code
                          </span>
                          <p className="text-dark">{activeCompany.address.zipCode}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {activeCompany?.about && (
                    <div className="p-3 border-bottom">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6>About</h6>
                        <Link 
                          to="#" 
                          className="btn btn-icon btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_company"
                          onClick={() => {(window as any).CURRENT_COMPANY_ID = activeCompany._id;}}
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                      <p className="text-dark">{activeCompany.about}</p>
                    </div>
                  )}
                  {activeCompany?.ownerName && (
                    <div className="p-3 border-bottom">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6>Owner Information</h6>
                        <Link 
                          to="#" 
                          className="btn btn-icon btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_company"
                          onClick={() => {(window as any).CURRENT_COMPANY_ID = activeCompany._id;}}
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                      <div className="d-flex align-items-center">
                        <span className="avatar avatar-md bg-primary avatar-rounded me-2">
                          <i className="ti ti-user fs-20" />
                        </span>
                        <div>
                          <h6 className="fw-medium mb-0">{activeCompany.ownerName}</h6>
                          <span className="text-muted">Company Owner</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeCompany?.socialLinks && (
                    <div className="p-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6>Social Links</h6>
                        <Link 
                          to="#" 
                          className="btn btn-icon btn-sm"
                          data-bs-toggle="modal"
                          data-bs-target="#edit_company"
                          onClick={() => {(window as any).CURRENT_COMPANY_ID = activeCompany._id;}}
                        >
                          <i className="ti ti-edit" />
                        </Link>
                      </div>
                      <div className="d-flex align-items-center mb-3 flex-wrap">
                        {activeCompany.socialLinks.facebook && (
                          <Link to={activeCompany.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                            <ImageWithBasePath
                              src="assets/img/social/social-01.svg"
                              alt="Facebook"
                            />
                          </Link>
                        )}
                        {activeCompany.socialLinks.twitter && (
                          <Link to={activeCompany.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                            <ImageWithBasePath
                              src="assets/img/social/social-06.svg"
                              alt="Twitter"
                            />
                          </Link>
                        )}
                        {activeCompany.socialLinks.linkedin && (
                          <Link to={activeCompany.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                            <ImageWithBasePath
                              src="assets/img/social/social-02.svg"
                              alt="LinkedIn"
                            />
                          </Link>
                        )}
                        {activeCompany.socialLinks.skype && (
                          <Link to={`skype:${activeCompany.socialLinks.skype}`} className="me-2 mb-2">
                            <ImageWithBasePath
                              src="assets/img/social/social-03.svg"
                              alt="Skype"
                            />
                          </Link>
                        )}
                        {activeCompany.socialLinks.whatsapp && (
                          <Link to={`https://wa.me/${activeCompany.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                            <ImageWithBasePath
                              src="assets/img/social/social-04.svg"
                              alt="WhatsApp"
                            />
                          </Link>
                        )}
                        {activeCompany.socialLinks.instagram && (
                          <Link to={activeCompany.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                            <ImageWithBasePath
                              src="assets/img/social/social-05.svg"
                              alt="Instagram"
                            />
                          </Link>
                        )}
                      </div>
                      <div className="row gx-2">
                        <div className="col-6">
                          <Link
                            to="#"
                            className="d-flex align-items-center justify-content-center btn btn-dark"
                            onClick={() => {
                              if (navigator.share) {
                                navigator.share({
                                  title: activeCompany.name,
                                  text: `Check out ${activeCompany.name}`,
                                  url: window.location.href
                                });
                              } else {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link copied to clipboard!');
                              }
                            }}
                          >
                            <i className="ti ti-share-2 me-2" />
                            Share
                          </Link>
                        </div>
                        <div className="col-6">
                          <Link
                            to="#"
                            className="d-flex align-items-center justify-content-center btn btn-outline-danger"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this company?')) {
                                try {
                                  const token = await (window as any).Clerk?.session?.getToken();
                                  await fetch(`${(typeof import.meta !== "undefined" && (import.meta as any).env?.REACT_APP_BACKEND_URL) || (window as any).REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/companies/${activeCompany._id}`, {
                                    method: 'DELETE',
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  window.dispatchEvent(new CustomEvent('companies:changed'));
                                  window.location.href = routes.companiesGrid;
                                } catch (err) { console.error('delete company', err); }
                              }
                            }}
                          >
                            <i className="ti ti-trash me-2" />
                            Delete
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <CommonTabs />
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

export default CompaniesDetails;
