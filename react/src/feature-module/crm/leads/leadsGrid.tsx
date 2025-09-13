import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { useSocket } from "../../../SocketContext";
import dragula, { Drake } from "dragula";
import "dragula/dist/dragula.css";
import CrmsModal from "../../../core/modals/crms_modal";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface DateRange {
  start: string;
  end: string;
}

interface LeadFilters {
  dateRange?: DateRange;
  search?: string;
  sortBy?: string;
}

interface Lead {
  _id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  address: string;
  source: string;
  country: string;
  createdAt: string;
  owner: string;
}

interface StageData {
  [key: string]: Lead[];
}

interface StageTotals {
  [key: string]: {
    count: number;
    value: number;
  };
}

const LeadsGrid = () => {
  const routes = all_routes;
  const socket = useSocket();
  
  // State management
  const [stages, setStages] = useState<StageData>({
    'Contacted': [],
    'Not Contacted': [],
    'Closed': [],
    'Lost': []
  });
  const [stageTotals, setStageTotals] = useState<StageTotals>({
    'Contacted': { count: 0, value: 0 },
    'Not Contacted': { count: 0, value: 0 },
    'Closed': { count: 0, value: 0 },
    'Lost': { count: 0, value: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeadFilters>({
    sortBy: 'recentlyAdded'
  });
  const [sortBy, setSortBy] = useState('recentlyAdded');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(1970, 0, 1).toISOString(),
    end: new Date().toISOString(),
  });
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
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

  const container1Ref = useRef<HTMLDivElement>(null);
  const container2Ref = useRef<HTMLDivElement>(null);
  const container3Ref = useRef<HTMLDivElement>(null);
  const container4Ref = useRef<HTMLDivElement>(null);

  // Fetch leads grid data from backend
  const fetchLeadsGridData = async () => {
    if (!socket) {
      console.log("[LeadsGrid] Socket not available yet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[LeadsGrid] Fetching leads grid data with filters:", filters);
      
      const requestData = {
        filters: {
          ...filters,
          dateRange: dateRange,
          sortBy: sortBy
        }
      };

      // Set up response handler
      const handleResponse = (response: any) => {
        console.log("[LeadsGrid] Received response:", response);
        setLoading(false);

        if (response.done) {
          const data = response.data || {};
          console.log("[LeadsGrid] Received data from backend:", data);
          
          const stagesData = data.stages || {
            'Contacted': [],
            'Not Contacted': [],
            'Closed': [],
            'Lost': []
          };
          
          const stageTotalsData = data.stageTotals || {
            'Contacted': { count: 0, value: 0 },
            'Not Contacted': { count: 0, value: 0 },
            'Closed': { count: 0, value: 0 },
            'Lost': { count: 0, value: 0 }
          };
          
          console.log("[LeadsGrid] Setting stages:", {
            'Contacted': stagesData['Contacted'].length,
            'Not Contacted': stagesData['Not Contacted'].length,
            'Closed': stagesData['Closed'].length,
            'Lost': stagesData['Lost'].length
          });
          
          console.log("[LeadsGrid] Setting stage totals:", stageTotalsData);
          
          setStages(stagesData);
          setStageTotals(stageTotalsData);
          setError(null);
        } else {
          setError(response.error || "Failed to load leads grid data");
          setStages({
            'Contacted': [],
            'Not Contacted': [],
            'Closed': [],
            'Lost': []
          });
          setStageTotals({
            'Contacted': { count: 0, value: 0 },
            'Not Contacted': { count: 0, value: 0 },
            'Closed': { count: 0, value: 0 },
            'Lost': { count: 0, value: 0 }
          });
        }
      };

      // Listen for response
      socket.on('lead/grid/get-data-response', handleResponse);

      // Emit request
      socket.emit('lead/grid/get-data', requestData);

      // Clean up listener after response
      const timeout = setTimeout(() => {
        socket.off('lead/grid/get-data-response', handleResponse);
        if (loading) {
          setLoading(false);
          setError("Request timed out");
        }
      }, 10000);

      // Clean up on successful response
      socket.once('lead/grid/get-data-response', () => {
        clearTimeout(timeout);
        socket.off('lead/grid/get-data-response', handleResponse);
      });

    } catch (error) {
      console.error("[LeadsGrid] Error fetching leads grid data:", error);
      setLoading(false);
      setError("Failed to fetch leads grid data");
    }
  };

  // Effect to fetch data when component mounts or filters change
  useEffect(() => {
    fetchLeadsGridData();
  }, [socket, filters, dateRange, sortBy]);

  // Handle filter changes
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  // Handle sort changes
  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
    setFilters(prev => ({
      ...prev,
      sortBy: sortOption
    }));
  };

  // Get sort display text
  const getSortDisplayText = (sortOption: string) => {
    switch (sortOption) {
      case 'recentlyAdded':
        return 'Recently Added';
      case 'ascending':
        return 'Ascending';
      case 'descending':
        return 'Descending';
      case 'lastMonth':
        return 'Last Month';
      case 'last7Days':
        return 'Last 7 Days';
      default:
        return 'Recently Added';
    }
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
      console.log("[LeadsGrid] Socket not available");
      return;
    }

    setSubmitLoading(true);
    try {
      console.log("[LeadsGrid] Creating new lead:", formData);

      const handleResponse = (response: any) => {
        console.log("[LeadsGrid] Received create response:", response);
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
          fetchLeadsGridData();
          setTimeout(() => {
            fetchLeadsGridData();
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

  // Handle cancel add
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

  // Handle edit lead
  const handleEditLead = (lead: any) => {
    console.log("[LeadsGrid] Opening edit modal for lead:", lead);
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      value: lead.value || 0,
      stage: lead.stage || 'Not Contacted',
      source: lead.source || 'Unknown',
      country: lead.country || 'Unknown',
      address: lead.address || '',
      owner: lead.owner || 'Unknown',
      priority: 'Medium'
    });
    setEditModalVisible(true);
  };

  // Handle update lead
  const handleUpdateLead = async () => {
    if (!socket || !editingLead) {
      console.log("[LeadsGrid] Cannot update lead - socket or editingLead missing");
      return;
    }

    setSubmitLoading(true);
    try {
      const requestData = {
        leadId: editingLead._id,
        updateData: formData
      };

      console.log("[LeadsGrid] Sending update request:", requestData);

      const handleResponse = (response: any) => {
        console.log("[LeadsGrid] Received update response:", response);
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
            fetchLeadsGridData();
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

  // Handle cancel edit
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

  // Handle delete lead
  const handleDeleteLead = async (leadId: string) => {
    if (!socket) {
      console.log("[LeadsGrid] Socket not available");
      return;
    }

    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      console.log("[LeadsGrid] Deleting lead:", leadId);

      const handleResponse = (response: any) => {
        console.log("[LeadsGrid] Received delete response:", response);
        if (response.done) {
          // Refresh the leads data immediately and then again after a delay to ensure consistency
          fetchLeadsGridData();
          setTimeout(() => {
            fetchLeadsGridData();
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

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      const doc = new jsPDF();
      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const currentYear = new Date().getFullYear();

      // Get all leads from all stages with stage information
      const allLeads = [
        ...stages['Contacted'].map((lead: Lead) => ({ ...lead, stage: 'Contacted' })),
        ...stages['Not Contacted'].map((lead: Lead) => ({ ...lead, stage: 'Not Contacted' })),
        ...stages['Closed'].map((lead: Lead) => ({ ...lead, stage: 'Closed' })),
        ...stages['Lost'].map((lead: Lead) => ({ ...lead, stage: 'Lost' }))
      ];

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
      doc.text("Leads Grid Report", 60, 28);

      // Report info section (right side)
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${currentDate}`, 150, 20);
      doc.text(`Time: ${currentTime}`, 150, 26);
      doc.text(`Total Leads: ${allLeads.length}`, 150, 32);

      let yPosition = 50;

      // Summary section with two columns
      if (allLeads.length > 0) {
        const totalValue = allLeads.reduce((sum: number, lead: any) => sum + (lead.value || 0), 0);
        
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
        doc.text(`Average Value: $${Math.round(totalValue / allLeads.length).toLocaleString()}`, 25, yPosition + 24);

        // Right column - Stage Breakdown with Values (wider column for full text)
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
        doc.text(`Contacted: ${stages['Contacted'].length} - $${stageTotals['Contacted'].value.toLocaleString()}`, 115, stageY);
        stageY += 4;
        doc.text(`Not Contacted: ${stages['Not Contacted'].length} - $${stageTotals['Not Contacted'].value.toLocaleString()}`, 115, stageY);
        stageY += 4;
        doc.text(`Closed: ${stages['Closed'].length} - $${stageTotals['Closed'].value.toLocaleString()}`, 115, stageY);
        stageY += 4;
        doc.text(`Lost: ${stages['Lost'].length} - $${stageTotals['Lost'].value.toLocaleString()}`, 115, stageY);

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
      
      allLeads.forEach((lead: any, index: number) => {
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
        const leadName = (lead.name || "N/A").substring(0, 18);
        const company = (lead.company || "N/A").substring(0, 18);
        const email = (lead.email || "N/A").substring(0, 20);
        const phone = (lead.phone || "N/A").substring(0, 12);
        const stage = (lead.stage || "N/A").substring(0, 15); // Increased from 8 to 15

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
      doc.save(`leads_grid_report_${Date.now()}.pdf`);
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

      // Get all leads from all stages with stage information
      const allLeads = [
        ...stages['Contacted'].map((lead: Lead) => ({ ...lead, stage: 'Contacted' })),
        ...stages['Not Contacted'].map((lead: Lead) => ({ ...lead, stage: 'Not Contacted' })),
        ...stages['Closed'].map((lead: Lead) => ({ ...lead, stage: 'Closed' })),
        ...stages['Lost'].map((lead: Lead) => ({ ...lead, stage: 'Lost' }))
      ];

      // Prepare leads data for Excel
      const leadsDataForExcel = allLeads.map((lead: any) => ({
        "Lead Name": lead.name || "",
        "Company": lead.company || "",
        "Email": lead.email || "",
        "Phone": lead.phone || "",
        "Stage": lead.stage || "",
        "Value": lead.value || 0,
        "Source": lead.source || "",
        "Country": lead.country || "",
        "Address": lead.address || "",
        "Owner": lead.owner || "",
        "Created Date": lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ""
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
      XLSX.utils.book_append_sheet(wb, ws, "Leads Grid");

      // Save the Excel file
      XLSX.writeFile(wb, `leads_grid_report_${Date.now()}.xlsx`);
      setExportLoading(false);
      console.log("Excel exported successfully");
    } catch (error) {
      setExportLoading(false);
      console.error("Error exporting Excel:", error);
      alert("Failed to export Excel");
    }
  };

  // Dragula setup
  useEffect(() => {
    const containers = [
      container1Ref.current as HTMLDivElement,
      container2Ref.current as HTMLDivElement,
      container3Ref.current as HTMLDivElement,
      container4Ref.current as HTMLDivElement,
    ].filter((container) => container !== null);

    if (containers.length > 0) {
      const drake: Drake = dragula(containers, {
        moves: function (el: any, source: any, handle: any, sibling: any) {
          return true; // Allow all moves
        },
        accepts: function (el: any, target: any, source: any, sibling: any) {
          return true; // Allow drops in all containers
        }
      });

      // Handle drop events
      drake.on('drop', function (el: any, target: any, source: any, sibling: any) {
        console.log('Lead moved from', source.className, 'to', target.className);
        // Here you can add logic to update the lead's stage in the backend
        // For now, we'll just log the move
      });

    return () => {
      drake.destroy();
    };
    }
  }, [stages]); // Re-initialize dragula when stages change

  // Helper function to render lead card
  const renderLeadCard = (lead: Lead) => {
    const initials = lead.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div key={lead._id} className="card kanban-card">
        <div className="card-body">
          <div className="d-block">
            <div className="border-warning border border-2 mb-3" />
            <div className="d-flex align-items-center mb-3">
              <Link
                to={`${routes.leadsDetails}?id=${lead._id}`}
                className="avatar avatar-lg bg-gray flex-shrink-0 me-2"
              >
                <span className="avatar-title text-dark">{initials}</span>
              </Link>
              <h6 className="fw-medium">
                <Link to={`${routes.leadsDetails}?id=${lead._id}`}>{lead.name}</Link>
              </h6>
            </div>
          </div>
          <div className="mb-3 d-flex flex-column">
            <p className="text-default d-inline-flex align-items-center mb-2">
              <i className="ti ti-report-money text-dark me-1" />
              ${lead.value.toLocaleString()}
            </p>
            <p className="text-default d-inline-flex align-items-center mb-2">
              <i className="ti ti-mail text-dark me-1" />
              {lead.email}
            </p>
            <p className="text-default d-inline-flex align-items-center mb-2">
              <i className="ti ti-phone text-dark me-1" />
              {lead.phone}
            </p>
            <p className="text-default d-inline-flex align-items-center">
              <i className="ti ti-map-pin-pin text-dark me-1" />
              {lead.address}
            </p>
          </div>
          <div className="d-flex align-items-center justify-content-between border-top pt-3 mt-3">
            <Link
              to="#"
              className="avatar avatar-sm avatar-rounded flex-shrink-0 me-2"
            >
              <ImageWithBasePath
                src={`assets/img/company/company-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}.svg`}
                alt="image"
              />
            </Link>
            <div className="icons-social d-flex align-items-center">
              <Link
                to="#"
                className="d-flex align-items-center justify-content-center me-2"
                onClick={() => handleEditLead(lead)}
                title="Edit Lead"
              >
                <i className="ti ti-edit" />
              </Link>
              <Link
                to="#"
                className="d-flex align-items-center justify-content-center me-2"
                onClick={() => handleDeleteLead(lead._id)}
                title="Delete Lead"
              >
                <i className="ti ti-trash" />
              </Link>
              <Link
                to="#"
                className="d-flex align-items-center justify-content-center me-2"
                title="Call"
              >
                <i className="ti ti-phone-call" />
              </Link>
              <Link
                to="#"
                className="d-flex align-items-center justify-content-center me-2"
                title="Chat"
              >
                <i className="ti ti-brand-hipchat" />
              </Link>
              <Link
                to="#"
                className="d-flex align-items-center justify-content-center"
                title="More Options"
              >
                <i className="ti ti-color-swatch" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                    Leads Grid
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              <div className="me-2 mb-2">
                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                  <Link
                    to={routes.leadsList}
                    className="btn btn-icon btn-sm me-1"
                  >
                    <i className="ti ti-list-tree" />
                  </Link>
                  <Link
                    to={routes.leadsGrid}
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
          {/* Leads Grid */}
          <div className="card">
            <div className="card-body p-3">
              <div className="d-flex align-items-center justify-content-between">
                <h5>Leads Grid</h5>
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : {getSortDisplayText(sortBy)}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('recentlyAdded');
                        }}
                      >
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('ascending');
                        }}
                      >
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('descending');
                        }}
                      >
                        Descending
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('lastMonth');
                        }}
                      >
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="#" 
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleSortChange('last7Days');
                        }}
                      >
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          {/* Leads Kanban */}
          <div className="d-flex overflow-x-auto align-items-start mb-4">
            <div className="kanban-list-items bg-white">
              <div className="card mb-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="fw-semibold d-flex align-items-center mb-1">
                        <i className="ti ti-circle-filled fs-8 text-warning me-2" />
                        Contacted
                      </h4>
                      <span className="fw-medium text-default">
                        {stageTotals['Contacted'].count} Leads - ${stageTotals['Contacted'].value.toLocaleString()}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="action-icon d-inline-flex">
                        <Link to="#">
                          <i className="ti ti-circle-plus" />
                        </Link>
                        <Link
                          to="#"
                          className=""
                          data-bs-toggle="modal"
                          data-bs-target="#edit_leads"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="kanban-drag-wrap pt-4" ref={container1Ref}>
                {loading ? (
                  <div className="d-flex align-items-center justify-content-center py-4">
                    <div className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                        </div>
                      <p className="mt-2 text-muted">Loading leads...</p>
                      </div>
                      </div>
                ) : error ? (
                  <div className="d-flex align-items-center justify-content-center py-4">
                    <div className="text-center">
                      <div className="text-danger mb-2">
                        <i className="ti ti-alert-circle fs-24"></i>
                        </div>
                      <p className="text-muted">{error}</p>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={fetchLeadsGridData}
                      >
                        Retry
                      </button>
                        </div>
                      </div>
                ) : stages['Contacted'].length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center py-4">
                    <div className="text-center">
                      <div className="text-muted mb-2">
                        <i className="ti ti-inbox fs-24"></i>
                      </div>
                      <p className="text-muted">No contacted leads</p>
                        </div>
                      </div>
                ) : (
                  stages['Contacted'].map((lead) => renderLeadCard(lead))
                )}
              </div>
            </div>
            <div className="kanban-list-items bg-white">
              <div className="card mb-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="fw-semibold d-flex align-items-center mb-1">
                        <i className="ti ti-circle-filled fs-8 text-purple me-2" />
                        Not Contacted
                      </h4>
                      <span className="fw-medium text-default">
                        {stageTotals['Not Contacted'].count} Leads - ${stageTotals['Not Contacted'].value.toLocaleString()}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="action-icon d-inline-flex">
                        <Link to="#">
                          <i className="ti ti-circle-plus" />
                        </Link>
                        <Link
                          to="#"
                          className=""
                          data-bs-toggle="modal"
                          data-bs-target="#edit_leads"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="kanban-drag-wrap pt-4" ref={container2Ref}>
                {stages['Not Contacted'].length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center py-4">
                    <div className="text-center">
                      <div className="text-muted mb-2">
                        <i className="ti ti-inbox fs-24"></i>
                        </div>
                      <p className="text-muted">No uncontacted leads</p>
                      </div>
                      </div>
                ) : (
                  stages['Not Contacted'].map((lead) => renderLeadCard(lead))
                )}
              </div>
            </div>
            <div className="kanban-list-items bg-white">
              <div className="card mb-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="fw-semibold d-flex align-items-center mb-1">
                        <i className="ti ti-circle-filled fs-8 text-success me-2" />
                        Closed
                      </h4>
                      <span className="fw-medium text-default">
                        {stageTotals['Closed'].count} Leads - ${stageTotals['Closed'].value.toLocaleString()}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="action-icon d-inline-flex">
                        <Link to="#">
                          <i className="ti ti-circle-plus" />
                        </Link>
                        <Link
                          to="#"
                          className=""
                          data-bs-toggle="modal"
                          data-bs-target="#edit_leads"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="kanban-drag-wrap pt-4" ref={container3Ref}>
                {stages['Closed'].length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center py-4">
                    <div className="text-center">
                      <div className="text-muted mb-2">
                        <i className="ti ti-inbox fs-24"></i>
                        </div>
                      <p className="text-muted">No closed leads</p>
                      </div>
                      </div>
                ) : (
                  stages['Closed'].map((lead) => renderLeadCard(lead))
                )}
              </div>
            </div>
            <div className="kanban-list-items bg-white me-0">
              <div className="card mb-0">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="fw-semibold d-flex align-items-center mb-1">
                        <i className="ti ti-circle-filled fs-8 text-danger me-2" />
                        Lost
                      </h4>
                      <span className="fw-medium text-default">
                        {stageTotals['Lost'].count} Leads - ${stageTotals['Lost'].value.toLocaleString()}
                      </span>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="action-icon d-inline-flex">
                        <Link to="#">
                          <i className="ti ti-circle-plus" />
                        </Link>
                        <Link
                          to="#"
                          className=""
                          data-bs-toggle="modal"
                          data-bs-target="#edit_leads"
                        >
                          <i className="ti ti-edit" />
                        </Link>
                        <Link
                          to="#"
                          data-bs-toggle="modal"
                          data-bs-target="#delete_modal"
                        >
                          <i className="ti ti-trash" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="kanban-drag-wrap pt-4" ref={container4Ref}>
                {stages['Lost'].length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center py-4">
                    <div className="text-center">
                      <div className="text-muted mb-2">
                        <i className="ti ti-inbox fs-24"></i>
                        </div>
                      <p className="text-muted">No lost leads</p>
                      </div>
                      </div>
                ) : (
                  stages['Lost'].map((lead) => renderLeadCard(lead))
                )}
                        </div>
                      </div>
                    </div>
          {/* /Leads Kanban */}
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

export default LeadsGrid;
