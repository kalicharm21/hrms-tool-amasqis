import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import PredefinedDateRanges from "../../../core/common/datePicker";
import Table from "../../../core/common/dataTable/index";
import { useSocket } from "../../../SocketContext";
import CrmsModal from "../../../core/modals/crms_modal";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface DateRange {
  start: string;
  end: string;
}

interface LeadFilters {
  dateRange?: DateRange;
  stage?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

const LeadsList = () => {
  const routes = all_routes;
  const socket = useSocket();
  
  // State management
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadFilters>({
    stage: 'all',
    sortBy: 'createdDate',
    page: 1,
    limit: 50
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(1970, 0, 1).toISOString(),
    end: new Date().toISOString(),
  });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    value: 0,
    stage: 'Not Contacted',
    source: 'Unknown',
    country: 'Unknown',
    address: '',
    owner: 'Unknown',
    priority: 'Medium'
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  // Fetch leads data from backend
  const fetchLeadsData = async () => {
    if (!socket) {
      console.log("[LeadsList] Socket not available yet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[LeadsList] Fetching leads data with filters:", filters);
      
      const requestData = {
        filters: {
          ...filters,
          dateRange: dateRange
        }
      };

      // Set up response handler
      const handleResponse = (response: any) => {
        console.log("[LeadsList] Received response:", response);
        setLoading(false);

        if (response.done) {
          const data = response.data || {};
          setLeadsData(data.leads || []);
          setPagination({
            totalCount: data.totalCount || 0,
            totalPages: data.totalPages || 0,
            currentPage: data.page || 1
          });
          setError(null);
        } else {
          setError(response.error || "Failed to load leads data");
          setLeadsData([]);
        }
      };

      // Listen for response
      socket.on('lead/list/get-data-response', handleResponse);

      // Emit request
      socket.emit('lead/list/get-data', requestData);

      // Clean up listener after response
      const timeout = setTimeout(() => {
        socket.off('lead/list/get-data-response', handleResponse);
        if (loading) {
          setLoading(false);
          setError("Request timed out");
        }
      }, 10000);

      // Clean up on successful response
      socket.once('lead/list/get-data-response', () => {
        clearTimeout(timeout);
        socket.off('lead/list/get-data-response', handleResponse);
      });

    } catch (error) {
      console.error("[LeadsList] Error fetching leads data:", error);
      setLoading(false);
      setError("Failed to fetch leads data");
    }
  };

  // Effect to fetch data when component mounts or filters change
  useEffect(() => {
    fetchLeadsData();
  }, [socket, filters, dateRange]);

  // Handle filter changes
  const handleStageFilter = (stage: string) => {
    setFilters(prev => ({ ...prev, stage, page: 1 }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy, page: 1 }));
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  // Handle form data changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle add new lead
  const handleAddLead = async () => {
    if (!socket) {
      console.log("[LeadsList] Socket not available");
      return;
    }

    setSubmitLoading(true);
    try {
      console.log("[LeadsList] Creating new lead:", formData);

      const handleResponse = (response: any) => {
        console.log("[LeadsList] Received create response:", response);
        setSubmitLoading(false);
        if (response.done) {
          setAddModalVisible(false);
          setFormData({
            name: '',
            company: '',
            email: '',
            phone: '',
            value: 0,
            stage: 'Not Contacted',
            source: 'Unknown',
            country: 'Unknown',
            address: '',
            owner: 'Unknown',
            priority: 'Medium'
          });
          // Refresh the leads data immediately and then again after a delay to ensure consistency
          fetchLeadsData();
          setTimeout(() => {
            fetchLeadsData();
          }, 1000);
          console.log("Lead created successfully");
        } else {
          console.error("Failed to create lead:", response.error);
        }
      };

      socket.on('lead/create-response', handleResponse);
      socket.emit('lead/create', formData);

      // Clean up listener
      setTimeout(() => {
        socket.off('lead/create-response', handleResponse);
      }, 5000);
    } catch (error) {
      setSubmitLoading(false);
      console.error("Error creating lead:", error);
    }
  };

  // Handle edit lead
  const handleEditLead = (lead: any) => {
    console.log("[LeadsList] Opening edit modal for lead:", lead);
    setEditingLead(lead);
    setFormData({
      name: lead.LeadName || '',
      company: lead.CompanyName || '',
      email: lead.Email || '',
      phone: lead.Phone || '',
      value: lead.value || 0,
      stage: lead.Tags || 'Not Contacted',
      source: lead.source || 'Unknown',
      country: lead.country || 'Unknown',
      address: lead.address || '',
      owner: lead.LeadOwner || 'Unknown',
      priority: 'Medium'
    });
    setEditModalVisible(true);
  };

  // Handle update lead
  const handleUpdateLead = async () => {
    if (!socket || !editingLead) {
      console.log("[LeadsList] Cannot update lead - socket or editingLead missing");
      return;
    }

    setSubmitLoading(true);
    try {
      // Map form data to backend expected format
      const updateData = {
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        value: formData.value,
        stage: formData.stage,
        source: formData.source,
        country: formData.country,
        address: formData.address,
        owner: formData.owner,
        priority: formData.priority
      };

      const requestData = {
        leadId: editingLead._id,
        updateData: updateData
      };

      console.log("[LeadsList] Sending update request:", requestData);

      const handleResponse = (response: any) => {
        console.log("[LeadsList] Received update response:", response);
        setSubmitLoading(false);
        if (response.done) {
          setEditModalVisible(false);
          setEditingLead(null);
          setFormData({
            name: '',
            company: '',
            email: '',
            phone: '',
            value: 0,
            stage: 'Not Contacted',
            source: 'Unknown',
            country: 'Unknown',
            address: '',
            owner: 'Unknown',
            priority: 'Medium'
          });
          // Refresh the leads data with a small delay to ensure database is updated
          setTimeout(() => {
            fetchLeadsData();
          }, 500);
          console.log("Lead updated successfully");
        } else {
          console.error("Failed to update lead:", response.error);
        }
      };

      socket.on('lead/update-response', handleResponse);
      socket.emit('lead/update', requestData);

      // Clean up listener
      setTimeout(() => {
        socket.off('lead/update-response', handleResponse);
      }, 5000);
    } catch (error) {
      setSubmitLoading(false);
      console.error("Error updating lead:", error);
    }
  };

  // Handle delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!socket) {
      console.log("[LeadsList] Socket not available");
      return;
    }

    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      console.log("[LeadsList] Deleting lead:", leadId);

      const handleResponse = (response: any) => {
        console.log("[LeadsList] Received delete response:", response);
        if (response.done) {
          // Refresh the leads data immediately and then again after a delay to ensure consistency
          fetchLeadsData();
          setTimeout(() => {
            fetchLeadsData();
          }, 1000);
          console.log("Lead deleted successfully");
        } else {
          console.error("Failed to delete lead:", response.error);
        }
      };

      socket.on('lead/delete-response', handleResponse);
      socket.emit('lead/delete', { leadId });

      // Clean up listener
      setTimeout(() => {
        socket.off('lead/delete-response', handleResponse);
      }, 5000);
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  // Handle cancel operations
  const handleCancelAdd = () => {
    setAddModalVisible(false);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      value: 0,
      stage: 'Not Contacted',
      source: 'Unknown',
      country: 'Unknown',
      address: '',
      owner: 'Unknown',
      priority: 'Medium'
    });
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingLead(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      value: 0,
      stage: 'Not Contacted',
      source: 'Unknown',
      country: 'Unknown',
      address: '',
      owner: 'Unknown',
      priority: 'Medium'
    });
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const currentYear = new Date().getFullYear();

      // Company colors (based on website theme)
      const primaryColor = [242, 101, 34]; // Orange - primary brand color
      const secondaryColor = [59, 112, 128]; // Blue-gray - secondary color
      const textColor = [33, 37, 41]; // Dark gray - main text
      const lightGray = [248, 249, 250]; // Light background
      const borderColor = [222, 226, 230]; // Border color

      // Add company logo with multiple fallback options
      const addCompanyLogo = async () => {
        const logoOptions = [
          '/assets/img/logo.svg',
          '/assets/img/logo-small.svg', 
          '/assets/img/logo-2.svg',
          '/favicon.png',
          '/assets/img/apple-touch-icon.png'
        ];

        for (const logoPath of logoOptions) {
          try {
            const response = await fetch(logoPath);
            if (response.ok) {
              const logoBlob = await response.blob();
              const logoDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(logoBlob);
              });
              
              // Try to add logo image to PDF with proper format detection and square aspect ratio
              const format = logoPath.endsWith('.svg') ? 'SVG' : 'PNG';
              doc.addImage(logoDataUrl as string, format, 20, 15, 20, 20);
              console.log(`Successfully loaded logo from: ${logoPath}`);
              return true;
            }
          } catch (error) {
            console.log(`Failed to load logo from ${logoPath}:`, error);
            continue;
          }
        }
        return false;
      };

      // Try to add logo, fallback to styled text if all fail
      const logoAdded = await addCompanyLogo();
      if (!logoAdded) {
        // Enhanced fallback with better styling
        console.log("All logo options failed, using enhanced text fallback");
        
        // Create a more professional text logo with square aspect ratio
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(20, 15, 20, 20, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text("AMASQIS", 22, 23);
        
        doc.setFontSize(5);
        doc.setFont(undefined, 'normal');
        doc.text("HRMS", 22, 28);
      }

      // Company name and report title
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text("Amasqis HRMS", 60, 20);
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text("Leads Management Report", 60, 28);

      // Report info section (right side)
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${currentDate}`, 150, 20);
      doc.text(`Time: ${currentTime}`, 150, 26);
      doc.text(`Total Leads: ${leadsData.length}`, 150, 32);

      let yPosition = 50;

      // Summary section with two columns
      if (leadsData.length > 0) {
        const totalValue = leadsData.reduce((sum: number, lead: any) => sum + (lead.value || 0), 0);
        const stageCounts = leadsData.reduce((acc: any, lead: any) => {
          const stage = lead.Tags || 'Unknown';
          acc[stage] = (acc[stage] || 0) + 1;
          return acc;
        }, {});

        // Left column - Financial Summary
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(20, yPosition, 85, 40, 'F');
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(20, yPosition, 85, 40, 'S');

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text("FINANCIAL SUMMARY", 25, yPosition + 8);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Total Value: $${totalValue.toLocaleString()}`, 25, yPosition + 16);
        doc.text(`Average Value: $${Math.round(totalValue / leadsData.length).toLocaleString()}`, 25, yPosition + 24);

        // Right column - Stage Breakdown (wider column for full text)
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(110, yPosition, 90, 40, 'F');
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(110, yPosition, 90, 40, 'S');

        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text("STAGE BREAKDOWN", 115, yPosition + 8);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        let stageY = yPosition + 16;
        Object.entries(stageCounts).forEach(([stage, count]: [string, any]) => {
          if (stageY < yPosition + 35) {
            // Use same font size as Financial Summary for consistency
            doc.text(`${stage}: ${count}`, 115, stageY);
            stageY += 5;
          }
        });

        yPosition += 50;
      }

      // Table section
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      // Table header with styling (wider table for full stage names)
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.rect(20, yPosition, 180, 12, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text("LEAD NAME", 22, yPosition + 8);
      doc.text("COMPANY", 60, yPosition + 8);
      doc.text("EMAIL", 100, yPosition + 8);
      doc.text("PHONE", 140, yPosition + 8);
      doc.text("STAGE", 175, yPosition + 8);
      yPosition += 15;

      // Table data with alternating rows
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      leadsData.forEach((lead: any, index: number) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }

        // Alternate row background (wider for full stage names)
        if (index % 2 === 0) {
          doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
          doc.rect(20, yPosition - 2, 180, 8, 'F');
        }

        // Truncate long text to fit columns (allow more space for stage)
        const leadName = (lead.LeadName || "N/A").substring(0, 18);
        const company = (lead.CompanyName || "N/A").substring(0, 18);
        const email = (lead.Email || "N/A").substring(0, 20);
        const phone = (lead.Phone || "N/A").substring(0, 12);
        const stage = (lead.Tags || "N/A").substring(0, 15); // Increased from 8 to 15

        doc.text(leadName, 22, yPosition + 4);
        doc.text(company, 60, yPosition + 4);
        doc.text(email, 100, yPosition + 4);
        doc.text(phone, 140, yPosition + 4);
        doc.text(stage, 175, yPosition + 4); // Moved to position 175

        yPosition += 8;
      });

      // Footer with company branding
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, 20, 290);
        doc.text(`Generated by Amasqis HRMS`, 150, 290);
      }

      // Save the PDF
      doc.save(`leads_report_${Date.now()}.pdf`);
      setExportLoading(false);
      console.log("PDF exported successfully");
    } catch (error) {
      setExportLoading(false);
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF");
    }
  };

  // Handle Excel export
  const handleExportExcel = () => {
    try {
      setExportLoading(true);
      const currentDate = new Date().toLocaleDateString();
      const wb = XLSX.utils.book_new();

      // Prepare leads data for Excel
      const leadsDataForExcel = leadsData.map((lead: any) => ({
        "Lead Name": lead.LeadName || "",
        "Company": lead.CompanyName || "",
        "Email": lead.Email || "",
        "Phone": lead.Phone || "",
        "Stage": lead.Tags || "",
        "Value": lead.value || 0,
        "Source": lead.source || "",
        "Country": lead.country || "",
        "Address": lead.address || "",
        "Owner": lead.LeadOwner || "",
        "Created Date": lead.CreatedDate || ""
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(leadsDataForExcel);
      
      // Set column widths
      const colWidths = [
        { wch: 20 }, // Lead Name
        { wch: 25 }, // Company
        { wch: 30 }, // Email
        { wch: 15 }, // Phone
        { wch: 15 }, // Stage
        { wch: 15 }, // Value
        { wch: 15 }, // Source
        { wch: 15 }, // Country
        { wch: 40 }, // Address
        { wch: 20 }, // Owner
        { wch: 20 }  // Created Date
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Leads");

      // Save the Excel file
      XLSX.writeFile(wb, `leads_report_${Date.now()}.xlsx`);
      setExportLoading(false);
      console.log("Excel exported successfully");
    } catch (error) {
      setExportLoading(false);
      console.error("Error exporting Excel:", error);
      alert("Failed to export Excel");
    }
  };

  const columns = [
    {
      title: "Lead Name",
      dataIndex: "LeadName",
      render: (text: string, record: any) => (
        <h6 className="fw-medium fs-14">
          <Link to={`${routes.leadsDetails}?id=${record._id}`}>{text}</Link>
        </h6>
      ),
      sorter: (a: any, b: any) => a.LeadName.length - b.LeadName.length,
    },
    {
      title: "Company Name",
      dataIndex: "CompanyName",
      render: (text: string, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link
            to={routes.companiesDetails}
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
              <Link to={routes.companiesDetails}>{text}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.CompanyName.length - b.CompanyName.length,
    },
    {
      title: "Phone",
      dataIndex: "Phone",
      sorter: (a: any, b: any) => a.Phone.length - b.Phone.length,
    },
    {
      title: "Email",
      dataIndex: "Email",
      sorter: (a: any, b: any) => a.Email.length - b.Email.length,
    },
    {
      title: "Tags",
      dataIndex: "Tags",
      render: (text: string) => (
        <span
          className={`badge  ${
            text === "Closed"
              ? "badge-info-transparent"
              : text === "Not Contacted"
              ? "badge-warning-transparent"
              : text === "Lost"
              ? "badge-danger-transparent"
              : "badge-purple-transparent"
          }`}
        >
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Tags.length - b.Tags.length,
    },
    {
      title: "CreatedDate",
      dataIndex: "CreatedDate",
      sorter: (a: any, b: any) => a.CreatedDate.length - b.CreatedDate.length,
    },
    {
      title: "Lead Owner",
      dataIndex: "LeadOwner",
      sorter: (a: any, b: any) => a.LeadOwner.length - b.LeadOwner.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: (text: any, record: any) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            onClick={() => handleEditLead(record)}
          >
            <i className="ti ti-edit" />
          </Link>
          <Link 
            to="#" 
            onClick={() => handleDeleteLead(record._id)}
          >
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ];
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Leads</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">CRM</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Contacts List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={routes.leadsList}
                    className="btn btn-icon btn-sm active bg-primary text-white me-1"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link to={routes.leadsGrid} className="btn btn-icon btn-sm">
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
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleExportPDF();
                        }}
                        style={{ pointerEvents: exportLoading ? 'none' : 'auto' }}
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        {exportLoading ? 'Exporting...' : 'Export as PDF'}
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleExportExcel();
                        }}
                        style={{ pointerEvents: exportLoading ? 'none' : 'auto' }}
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        {exportLoading ? 'Exporting...' : 'Export as Excel'}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mb-2">
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center"
                  onClick={() => setAddModalVisible(true)}
                >
                  <i className="ti ti-circle-plus me-2" />
                  Add Lead
                </button>
              </div>
              <div className="head-icons ms-2">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Leads List */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Leads List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="me-3">
                  <div className="input-icon-end position-relative">
                <PredefinedDateRanges 
                  onChange={handleDateRangeChange}
                  value={dateRange}
                />
                    <span className="input-icon-addon">
                      <i className="ti ti-chevron-down" />
                    </span>
                  </div>
                </div>
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    {filters.stage === 'all' ? 'All Stages' : filters.stage}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.stage === 'all' ? 'active' : ''}`}
                        onClick={() => handleStageFilter('all')}
                      >
                        All Stages
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.stage === 'Closed' ? 'active' : ''}`}
                        onClick={() => handleStageFilter('Closed')}
                      >
                        Closed
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.stage === 'Contacted' ? 'active' : ''}`}
                        onClick={() => handleStageFilter('Contacted')}
                      >
                        Contacted
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.stage === 'Lost' ? 'active' : ''}`}
                        onClick={() => handleStageFilter('Lost')}
                      >
                        Lost
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.stage === 'Not Contacted' ? 'active' : ''}`}
                        onClick={() => handleStageFilter('Not Contacted')}
                      >
                        Not Contacted
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By: {filters.sortBy === 'createdDate' ? 'Recently Added' : 
                              filters.sortBy === 'name' ? 'Name' :
                              filters.sortBy === 'company' ? 'Company' :
                              filters.sortBy === 'stage' ? 'Stage' : 'Recently Added'}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.sortBy === 'createdDate' ? 'active' : ''}`}
                        onClick={() => handleSortChange('createdDate')}
                      >
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.sortBy === 'name' ? 'active' : ''}`}
                        onClick={() => handleSortChange('name')}
                      >
                        Name (A-Z)
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.sortBy === 'company' ? 'active' : ''}`}
                        onClick={() => handleSortChange('company')}
                      >
                        Company (A-Z)
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className={`dropdown-item rounded-1 ${filters.sortBy === 'stage' ? 'active' : ''}`}
                        onClick={() => handleSortChange('stage')}
                      >
                        Stage
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading leads...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="text-center">
                    <div className="text-danger mb-2">
                      <i className="ti ti-alert-circle fs-24"></i>
                    </div>
                    <p className="text-muted">{error}</p>
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={fetchLeadsData}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : leadsData.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="text-center">
                    <div className="text-muted mb-2">
                      <i className="ti ti-inbox fs-24"></i>
                    </div>
                    <p className="text-muted">No leads found</p>
                    <p className="text-muted small">Try adjusting your filters or add a new lead</p>
                  </div>
                </div>
              ) : (
                <>
                  <Table dataSource={leadsData} columns={columns} Selection={true} />
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center p-3 border-top">
                      <div className="text-muted">
                        Showing {((pagination.currentPage - 1) * (filters.limit || 50)) + 1} to {Math.min(pagination.currentPage * (filters.limit || 50), pagination.totalCount)} of {pagination.totalCount} leads
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          disabled={pagination.currentPage === 1}
                          onClick={() => setFilters(prev => ({ ...prev, page: prev.page! - 1 }))}
                        >
                          Previous
                        </button>
                        <span className="btn btn-sm btn-outline-secondary disabled">
                          {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          disabled={pagination.currentPage === pagination.totalPages}
                          onClick={() => setFilters(prev => ({ ...prev, page: prev.page! + 1 }))}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* /Leads List */}
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
      
      {/* Add Lead Modal */}
      {addModalVisible && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Lead</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCancelAdd}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Lead Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.company}
                      onChange={(e) => handleFormChange('company', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.value}
                      onChange={(e) => handleFormChange('value', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Stage</label>
                    <select
                      className="form-control"
                      value={formData.stage}
                      onChange={(e) => handleFormChange('stage', e.target.value)}
                    >
                      <option value="Not Contacted">Not Contacted</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Opportunity">Opportunity</option>
                      <option value="Closed">Closed</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Source</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.source}
                      onChange={(e) => handleFormChange('source', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.country}
                      onChange={(e) => handleFormChange('country', e.target.value)}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Owner</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.owner}
                      onChange={(e) => handleFormChange('owner', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-control"
                      value={formData.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancelAdd}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddLead}
                  disabled={submitLoading || !formData.name || !formData.company}
                >
                  {submitLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Lead'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editModalVisible && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Lead</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCancelEdit}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Lead Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Company Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.company}
                      onChange={(e) => handleFormChange('company', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.value}
                      onChange={(e) => handleFormChange('value', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Stage</label>
                    <select
                      className="form-control"
                      value={formData.stage}
                      onChange={(e) => handleFormChange('stage', e.target.value)}
                    >
                      <option value="Not Contacted">Not Contacted</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Opportunity">Opportunity</option>
                      <option value="Closed">Closed</option>
                      <option value="Lost">Lost</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Source</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.source}
                      onChange={(e) => handleFormChange('source', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Country</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.country}
                      onChange={(e) => handleFormChange('country', e.target.value)}
                    />
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Address</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Owner</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.owner}
                      onChange={(e) => handleFormChange('owner', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-control"
                      value={formData.priority}
                      onChange={(e) => handleFormChange('priority', e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleUpdateLead}
                  disabled={submitLoading || !formData.name || !formData.company}
                >
                  {submitLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Lead'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CrmsModal />
    </>
  );
};

export default LeadsList;
