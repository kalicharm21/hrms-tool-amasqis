import React, { useState, useEffect } from "react";
import CommonTabs from "../common-components";
import { Link, useSearchParams } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../../SocketContext";
import CrmsModal from "../../../core/modals/crms_modal";

interface LeadDetails {
  _id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  stage: string;
  source: string;
  country: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  ownerDetails?: any;
  lostReason?: string;
  tags: string[];
  priority: string;
  followUpDate?: string;
  dueDate?: string;
  activities: any[];
}

const LeadsDetails = () => {
  const routes = all_routes;
  const socket = useSocket();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('id');
  
  // State management
  const [leadDetails, setLeadDetails] = useState<LeadDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lead details from backend
  const fetchLeadDetails = async () => {
    if (!socket || !leadId) {
      console.log("[LeadDetails] Socket or leadId not available");
      setLoading(false);
      setError("Lead ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[LeadDetails] Fetching lead details for leadId:", leadId);
      
      const requestData = {
        leadId: leadId
      };

      // Set up response handler
      const handleResponse = (response: any) => {
        console.log("[LeadDetails] Received response:", response);
        setLoading(false);

        if (response.done) {
          const data = response.data || {};
          setLeadDetails(data);
          setError(null);
        } else {
          setError(response.error || "Failed to load lead details");
          setLeadDetails(null);
        }
      };

      // Listen for response
      socket.on('lead/details/get-data-response', handleResponse);

      // Emit request
      socket.emit('lead/details/get-data', requestData);

      // Clean up listener after response
      const timeout = setTimeout(() => {
        socket.off('lead/details/get-data-response', handleResponse);
        if (loading) {
          setLoading(false);
          setError("Request timed out");
        }
      }, 10000);

      // Clean up on successful response
      socket.once('lead/details/get-data-response', () => {
        clearTimeout(timeout);
        socket.off('lead/details/get-data-response', handleResponse);
      });

    } catch (error) {
      console.error("[LeadDetails] Error fetching lead details:", error);
      setLoading(false);
      setError("Failed to fetch lead details");
    }
  };

  // Effect to fetch data when component mounts or leadId changes
  useEffect(() => {
    fetchLeadDetails();
  }, [socket, leadId]);

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get badge class for stage
  const getStageBadgeClass = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'closed':
        return 'badge-success-transparent';
      case 'contacted':
        return 'badge-secondary-transparent';
      case 'lost':
        return 'badge-danger-transparent';
      case 'not contacted':
        return 'badge-warning-transparent';
      default:
        return 'badge-purple-transparent';
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading lead details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !leadDetails) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div className="text-danger mb-2">
                <i className="ti ti-alert-circle fs-24"></i>
              </div>
              <p className="text-muted">{error || 'Lead not found'}</p>
              <Link to={routes.leadsList} className="btn btn-primary btn-sm">
                Back to Leads List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          <div className="row align-items-center mb-4">
            <div className="col-sm-6">
              <div className="d-flex align-items-center flex-wrap row-gap-3">
                <h6 className="fw-medium d-inline-flex align-items-center me-2">
                  <Link to={routes.leadsList}>
                    <i className="ti ti-arrow-left me-2" />
                    Leads
                  </Link>
                  <span className="text-gray d-inline-flex ms-2">
                    / {leadDetails.name}
                  </span>
                </h6>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-git-branch me-1" />
                    Marketing Pipeline
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Marketing Pipeline
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        Deal Pipeline
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-sm-6">
              <div className="d-flex justify-content-sm-end">
                <div className="head-icons ms-2">
                  <CollapseHeader />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-4 theiaStickySidebar">
              <div className="card card-bg-1 sticky-class">
                <div className="card-body p-0">
                  <span className="avatar avatar-xl border text-dark bg-white rounded-circle m-auto d-flex mb-2">
                    {getInitials(leadDetails.name)}
                  </span>
                  <div className="text-center px-3 pb-3 border-bottom">
                    <h5 className="d-flex align-items-center justify-content-center mb-1">
                      {leadDetails.name}
                      <span className="avatar avatar-sm avatar-rounded bg-light ms-2">
                        <i className="ti ti-star-filled text-warning fs-14" />
                      </span>
                    </h5>
                    <p className="text-dark mb-1">
                      {leadDetails.address}
                    </p>
                    <p className="d-inline-flex align-items-center text-dark mb-2">
                      <i className="ti ti-building me-1" />
                      {leadDetails.company}
                    </p>
                    <div className="d-flex align-items-center justify-content-center">
                      <span className="badge badge-dark-transparent me-2">
                        <i className="ti ti-lock me-1" />
                        Private
                      </span>
                      <span className={`badge ${getStageBadgeClass(leadDetails.stage)}`}>
                        {leadDetails.stage}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Lead information</h6>
                      <Link
                        to="#"
                        className="btn btn-icon btn-sm"
                        data-bs-toggle="modal"
                        data-bs-target="#edit_company"
                      >
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-calendar me-2" />
                        Date Created
                      </span>
                      <p className="text-dark">{formatDate(leadDetails.createdAt)}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-currency-dollar me-2" />
                        Value
                      </span>
                      <p className="text-dark">${leadDetails.value.toLocaleString()}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-calendar-event me-2" />
                        Due Date
                      </span>
                      <p className="text-dark">{leadDetails.dueDate ? formatDate(leadDetails.dueDate) : 'N/A'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-clock me-2" />
                        Follow Up
                      </span>
                      <p className="text-dark">{leadDetails.followUpDate ? formatDate(leadDetails.followUpDate) : 'N/A'}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-source-code me-2" />
                        Source
                      </span>
                      <p className="text-dark">{leadDetails.source}</p>
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Owner</h6>
                      <Link to="#" className="btn btn-icon btn-sm">
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="avatar avatar-md avatar-rounded me-2">
                        {leadDetails.ownerDetails?.profileImage ? (
                          <ImageWithBasePath
                            src={leadDetails.ownerDetails.profileImage}
                            alt="Owner"
                          />
                        ) : (
                          <span className="avatar-title text-dark">
                            {leadDetails.ownerDetails?.name ? getInitials(leadDetails.ownerDetails.name) : 'U'}
                          </span>
                        )}
                      </span>
                      <h6>{leadDetails.ownerDetails?.name || leadDetails.owner}</h6>
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <h5 className="mb-3">Tags</h5>
                    <div className="d-flex align-items-center flex-wrap">
                      {leadDetails.tags && leadDetails.tags.length > 0 ? (
                        leadDetails.tags.map((tag, index) => (
                          <span key={index} className="badge badge-soft-primary me-2 mb-1">
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">No tags assigned</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <h5 className="mb-3">Projects</h5>
                    <div className="d-flex align-items-center">
                      <span className="badge badge-dark-transparent me-3">
                        Devops Design
                      </span>
                      <span className="badge badge-dark-transparent">
                        Material Design
                      </span>
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <h5 className="mb-3">Priority</h5>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="dropdown-toggle btn-sm btn btn-white d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <span className={`border border-purple rounded-circle d-flex justify-content-center align-items-center me-1 ${
                          leadDetails.priority === 'High' ? 'bg-soft-danger' :
                          leadDetails.priority === 'Medium' ? 'bg-soft-warning' :
                          'bg-soft-success'
                        }`}>
                          <i className={`ti ti-point-filled ${
                            leadDetails.priority === 'High' ? 'text-danger' :
                            leadDetails.priority === 'Medium' ? 'text-warning' :
                            'text-success'
                          }`} />
                        </span>
                        {leadDetails.priority}
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            High
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Medium
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1">
                            Low
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-3 border-bottom">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5>Contacts</h5>
                      <Link
                        to="#"
                        className="text-primary d-inline-flex align-items-center"
                        data-bs-toggle="modal"
                        data-bs-target="#add_company"
                      >
                        <i className="ti ti-circle-plus me-1" />
                        Add New
                      </Link>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="avatar avatar-md avatar-rounded me-2">
                        <ImageWithBasePath
                          src="assets/img/profiles/avatar-01.jpg"
                          alt="Img"
                        />
                      </span>
                      <h6>Sharon Roy</h6>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h6>Other information</h6>
                      <Link to="#" className="btn btn-icon btn-sm">
                        <i className="ti ti-edit" />
                      </Link>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-calendar-check me-2" />
                        Last Modified
                      </span>
                      <p className="text-dark">{formatDate(leadDetails.updatedAt)}</p>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="d-inline-flex align-items-center">
                        <i className="ti ti-user-check me-2" />
                        Modified By
                      </span>
                      <p className="text-dark d-flex align-items-center">
                        <span className="avatar avatar-sm avatar-rounded me-2">
                          {leadDetails.ownerDetails?.profileImage ? (
                            <ImageWithBasePath
                              src={leadDetails.ownerDetails.profileImage}
                              alt="Owner"
                            />
                          ) : (
                            <span className="avatar-title text-dark">
                              {leadDetails.ownerDetails?.name ? getInitials(leadDetails.ownerDetails.name) : 'U'}
                            </span>
                          )}
                        </span>
                        {leadDetails.ownerDetails?.name || leadDetails.owner}
                      </p>
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
      {/* /Page Wrapper */}
      <CrmsModal />
    </>
  );
};

export default LeadsDetails;
