import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import CommonTabs from "../common-components";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import CrmsModal from "../../../core/modals/crms_modal";
import { useContacts } from "../../../hooks/useContacts";
const ContactDetails = () => {
  const routes = all_routes;
  const { getContact } = useContacts();
  const { contactId } = useParams();
  const [activeContact, setActiveContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (contactId) {
        try {
          setLoading(true);
          const data = await getContact(contactId);
          setActiveContact(data);
        } catch (error) {
          console.error('Error loading contact:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    load();
  }, [contactId, getContact]);

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

  if (!activeContact) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="text-center">
              <h5>Contact not found</h5>
              <p className="text-muted">The contact you're looking for doesn't exist or has been removed.</p>
              <Link to={routes.contactGrid} className="btn btn-primary">
                Back to Contacts
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
                <Link to={routes.contactList}>
                  <i className="ti ti-arrow-left me-2" />
                  Contacts
                </Link>
                <span className="text-gray d-inline-flex ms-2">
                  / {activeContact?.name || "Contact"}
                </span>
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
                  data-bs-target="#edit_contact"
                  onClick={() => {(window as any).CURRENT_CONTACT_ID = activeContact._id;}}
                >
                  <i className="ti ti-edit me-2" />
                  Edit Contact
                </Link>
                <Link
                  to="#"
                  className="btn btn-outline-danger d-inline-flex align-items-center me-2"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this contact?')) {
                      try {
                        const token = await (window as any).Clerk?.session?.getToken();
                        await fetch(`${(typeof import.meta !== "undefined" && (import.meta as any).env?.REACT_APP_BACKEND_URL) || (window as any).REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/contacts/${activeContact._id}`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        window.dispatchEvent(new CustomEvent('contacts:changed'));
                        window.location.href = routes.contactGrid;
                      } catch (err) { console.error('delete contact', err); }
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
                  <span className="avatar avatar-xl avatar-rounded border border-2 border-white m-auto d-flex mb-2">
                    <ImageWithBasePath
                      src={activeContact?.image ? `assets/img/users/${activeContact.image}` : "assets/img/users/user-01.jpg"}
                      className="w-auto h-auto"
                      alt="Img"
                    />
                  </span>
                  <div className="text-center px-3 pb-3 border-bottom">
                    <h5 className="d-flex align-items-center justify-content-center mb-1">
                      {activeContact?.name || "Contact"}{" "}
                      <i className="ti ti-discount-check-filled text-success ms-1" />
                    </h5>
                    <p className="text-dark mb-1">{activeContact?.companyName || ""}</p>
                    <span className="badge bg-pink-transparent">
                      {activeContact?.role || "-"}
                    </span>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Basic information</h6>
                      <Link
                        to="#"
                        className="btn btn-icon btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#edit_contact"
                        onClick={() => {(window as any).CURRENT_CONTACT_ID = activeContact._id;}}
                      >
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-phone me-2" />
                        Phone
                      </span>
                      <p className="text-dark">{activeContact?.phone || "-"}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-mail-check me-2" />
                        Email
                      </span>
                      <Link
                        to={`mailto:${activeContact?.email}`}
                        className="text-info d-inline-flex align-items-center"
                      >
                        {activeContact?.email || "-"}{" "}
                        <i className="ti ti-copy text-dark ms-2" />
                      </Link>
                    </div>
                    {activeContact?.gender && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-gender-male me-2" />
                          Gender
                        </span>
                        <p className="text-dark">{activeContact.gender}</p>
                      </div>
                    )}
                    {activeContact?.birthday && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-cake me-2" />
                          Birthday
                        </span>
                        <p className="text-dark">{formatDate(activeContact.birthday)}</p>
                      </div>
                    )}
                    {activeContact?.address && (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-map-pin-check me-2" />
                          Address
                        </span>
                        <p className="text-dark text-end">
                          {typeof activeContact.address === 'object' && activeContact.address !== null
                            ? [activeContact.address.street, activeContact.address.city, activeContact.address.state, activeContact.address.zipCode, activeContact.address.country]
                                .filter(Boolean)
                                .join(', ')
                            : activeContact.address}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Other Information</h6>
                      <Link to="#" className="btn btn-icon btn-sm" data-bs-toggle="modal" data-bs-target="#edit_contact" onClick={() => {(window as any).CURRENT_CONTACT_ID = activeContact._id;}}>
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    {activeContact?.language && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-e-passport me-2" />
                          Language
                        </span>
                        <p className="text-dark">{activeContact.language}</p>
                      </div>
                    )}
                    {activeContact?.currency && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-currency-dollar me-2" />
                          Currency
                        </span>
                        <p className="text-dark">{activeContact.currency}</p>
                      </div>
                    )}
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-clock me-2" />
                        Last Modified
                      </span>
                      <p className="text-dark">{formatDate(activeContact?.updatedAt)}</p>
                    </div>
                    {activeContact?.source && (
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-bookmark-plus me-2" />
                          Source
                        </span>
                        <p className="text-dark">{activeContact.source}</p>
                      </div>
                    )}
                    {activeContact?.rating && (
                      <div className="d-flex align-items-center justify-content-between">
                        <span className="d-inline-flex align-items-center">
                          <i className="ti ti-star me-2" />
                          Rating
                        </span>
                        <div className="d-flex align-items-center">
                          <span className="me-1">{activeContact.rating}</span>
                          <i className="ti ti-star-filled text-warning" />
                        </div>
                      </div>
                    )}
                  </div>
                  {activeContact?.tags && activeContact.tags.length > 0 && (
                    <div className="p-3 border-bottom">
                      <h5 className="mb-3">Tags</h5>
                      <div className="d-flex align-items-center flex-wrap">
                        {activeContact.tags.map((tag: string, index: number) => (
                          <span key={index} className="badge badge-soft-success me-2 mb-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-3 border-bottom">
                    <h5 className="mb-3">Company</h5>
                    <div className="d-flex align-items-center file-name-icon">
                      <Link
                        to={activeContact.companyId ? routes.companiesDetails.replace(':companyId', activeContact.companyId) : "#"}
                        className="avatar avatar-md border rounded-circle"
                      >
                        <ImageWithBasePath
                          src={activeContact.companyImage ? `assets/img/company/${activeContact.companyImage}` : "assets/img/company/company-01.svg"}
                          className="img-fluid"
                          alt="img"
                        />
                      </Link>
                      <div className="ms-2">
                        <h6 className="fw-medium">{activeContact.companyName || "-"}</h6>
                        <span className="d-block">{activeContact.companyWebsite || ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Social Links</h6>
                      <Link to="#" className="btn btn-icon btn-sm" data-bs-toggle="modal" data-bs-target="#edit_contact" onClick={() => {(window as any).CURRENT_CONTACT_ID = activeContact._id;}}>
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    <div className="d-flex align-items-center mb-3 flex-wrap">
                      {activeContact.socialLinks?.facebook && (
                        <Link to={activeContact.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                          <ImageWithBasePath src="assets/img/social/social-01.svg" alt="Facebook" />
                        </Link>
                      )}
                      {activeContact.socialLinks?.twitter && (
                        <Link to={activeContact.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                          <ImageWithBasePath src="assets/img/social/social-06.svg" alt="Twitter" />
                        </Link>
                      )}
                      {activeContact.socialLinks?.linkedin && (
                        <Link to={activeContact.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                          <ImageWithBasePath src="assets/img/social/social-02.svg" alt="LinkedIn" />
                        </Link>
                      )}
                      {activeContact.socialLinks?.skype && (
                        <Link to={`skype:${activeContact.socialLinks.skype}`} className="me-2 mb-2">
                          <ImageWithBasePath src="assets/img/social/social-03.svg" alt="Skype" />
                        </Link>
                      )}
                      {activeContact.socialLinks?.whatsapp && (
                        <Link to={`https://wa.me/${activeContact.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                          <ImageWithBasePath src="assets/img/social/social-04.svg" alt="WhatsApp" />
                        </Link>
                      )}
                      {activeContact.socialLinks?.instagram && (
                        <Link to={activeContact.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="me-2 mb-2">
                          <ImageWithBasePath src="assets/img/social/social-05.svg" alt="Instagram" />
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
                                title: activeContact.name,
                                text: `Check out ${activeContact.name}`,
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
                            if (window.confirm('Are you sure you want to delete this contact?')) {
                              try {
                                const token = await (window as any).Clerk?.session?.getToken();
                                await fetch(`${(typeof import.meta !== "undefined" && (import.meta as any).env?.REACT_APP_BACKEND_URL) || (window as any).REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/contacts/${activeContact._id}`, {
                                  method: 'DELETE',
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                window.dispatchEvent(new CustomEvent('contacts:changed'));
                                window.location.href = routes.contactGrid;
                              } catch (err) { console.error('delete contact', err); }
                            }
                          }}
                        >
                          <i className="ti ti-trash me-2" />
                          Delete
                        </Link>
                      </div>
                    </div>
                  </div>
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

export default ContactDetails;