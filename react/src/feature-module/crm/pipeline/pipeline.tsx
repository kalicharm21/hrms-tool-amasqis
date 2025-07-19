import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { all_routes } from '../../router/all_routes';
// import { pipelineData } from '../../../core/data/json/pipelineData'; // Commented out static data
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import PredefinedDateRanges from "../../../core/common/datePicker";
import Table from "../../../core/common/dataTable/index";
import CrmsModal from '../../../core/modals/crms_modal';
import { useSocket } from '../../../SocketContext';
import { Socket } from "socket.io-client";
import EditPipeline from '../../../core/modals/edit_pipeline';
import DeletePipeline from '../../../core/modals/delete_pipeline';
import { message } from "antd";
import AddPipeline from "../../../core/modals/add_pipeline";

const Pipeline = () => {
  const routes = all_routes;
  // const data = pipelineData; // Commented out static data
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket() as Socket | null;
  const [editPipeline, setEditPipeline] = useState<any | null>(null);
  const [deletePipeline, setDeletePipeline] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);

  // Refetch pipelines function (fetch all, no filters)
  const fetchPipelines = () => {
    if (!socket) {
      console.error('No socket connection available for fetching pipelines');
      return;
    }
    setLoading(true);
    setError(null);
    socket.emit("pipeline:getAll");
  };

  useEffect(() => {
    if (!socket) return;
    fetchPipelines();
    const handler = (res: any) => {
      console.log('Pipeline getAll response:', res);
      if (res.done) {
        setPipelines(res.data || []);
        setError(null);
        console.log(`Loaded ${res.data?.length || 0} pipelines`);
      } else {
        setError(res.error || "Failed to fetch pipelines");
        console.error('Failed to fetch pipelines:', res.error);
      }
      setLoading(false);
    };
    socket.on("pipeline:getAll-response", handler);
    return () => {
      socket.off("pipeline:getAll-response", handler);
    };
  }, [socket]);

  // Listen for global refresh events
  useEffect(() => {
    const handleRefreshPipelines = () => {
      console.log('Global refresh event received, fetching pipelines...');
      fetchPipelines();
    };

    window.addEventListener('refresh-pipelines', handleRefreshPipelines);
    
    return () => {
      window.removeEventListener('refresh-pipelines', handleRefreshPipelines);
    };
  }, []);

  // Handle edit click
  const handleEditClick = (pipeline: any) => {
    console.log('Edit pipeline clicked:', pipeline);
    setEditPipeline(pipeline);
    // Open the modal
    const modal = document.getElementById('edit-pipeline-modal');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  };

  // Handle delete click
  const handleDeleteClick = (pipeline: any) => {
    console.log('Delete pipeline clicked:', pipeline);
    setDeletePipeline(pipeline);
    // Open the modal
    const modal = document.getElementById('delete-pipeline-modal');
    if (modal) {
      const bootstrapModal = new (window as any).bootstrap.Modal(modal);
      bootstrapModal.show();
    }
  };

  // Handle pipeline updated
  const handlePipelineUpdated = () => {
    console.log('Pipeline updated, refreshing list...');
    fetchPipelines();
    // Also dispatch global event for other components
    window.dispatchEvent(new Event('refresh-pipelines'));
  };

  // Handle pipeline deleted
  const handlePipelineDeleted = () => {
    console.log('Pipeline deleted, refreshing list...');
    fetchPipelines();
    // Also dispatch global event for other components
    window.dispatchEvent(new Event('refresh-pipelines'));
  };

  // Export functions
  const handleExportPDF = async () => {
    if (!socket) {
      message.error("Socket connection not available");
      return;
    }

    setExporting(true);
    try {
      console.log("Starting PDF export...");
      
      // Emit socket event to generate PDF
      socket.emit("pipeline/export-pdf");

      // Listen for response
      const handlePDFResponse = (response: any) => {
        if (response.done) {
          console.log("PDF generated successfully:", response.data.pdfUrl);
          
          // Create a temporary link and trigger download
          const link = document.createElement('a');
          link.href = response.data.pdfUrl;
          link.download = `pipelines_${Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          message.success("PDF exported successfully!");
        } else {
          console.error("PDF export failed:", response.error);
          message.error(`PDF export failed: ${response.error}`);
        }
        setExporting(false);
        socket.off("pipeline/export-pdf-response", handlePDFResponse);
      };

      socket.on("pipeline/export-pdf-response", handlePDFResponse);

    } catch (error) {
      console.error("Error exporting PDF:", error);
      message.error("Failed to export PDF");
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!socket) {
      message.error("Socket connection not available");
      return;
    }

    setExporting(true);
    try {
      console.log("Starting Excel export...");
      
      // Emit socket event to generate Excel
      socket.emit("pipeline/export-excel");

      // Listen for response
      const handleExcelResponse = (response: any) => {
        if (response.done) {
          console.log("Excel generated successfully:", response.data.excelUrl);
          
          // Create a temporary link and trigger download
          const link = document.createElement('a');
          link.href = response.data.excelUrl;
          link.download = `pipelines_${Date.now()}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          message.success("Excel exported successfully!");
        } else {
          console.error("Excel export failed:", response.error);
          message.error(`Excel export failed: ${response.error}`);
        }
        setExporting(false);
        socket.off("pipeline/export-excel-response", handleExcelResponse);
      };

      socket.on("pipeline/export-excel-response", handleExcelResponse);

    } catch (error) {
      console.error("Error exporting Excel:", error);
      message.error("Failed to export Excel");
      setExporting(false);
    }
  };

  // Map backend fields to frontend columns if needed
  const columns = [
    {
      title: "Pipeline Name",
      dataIndex: "pipelineName",
      render: (text: string, record: any) => (
        <h6 className="fs-14 fw-medium">{text}</h6>
      ),
      sorter: (a: any, b: any) => a.pipelineName.length - b.pipelineName.length,
    },
    {
      title: "Total Deal Value",
      dataIndex: "totalDealValue",
      render: (value: number) => `$${value.toLocaleString()}`,
      sorter: (a: any, b: any) => a.totalDealValue - b.totalDealValue,
    },
    {
      title: "No of Deals",
      dataIndex: "noOfDeals",
      sorter: (a: any, b: any) => a.noOfDeals - b.noOfDeals,
    },
    {
      title: "Stages",
      dataIndex: "stage",
      render: (text: string) => (
        <div className=" d-flex align-items-center">
          <div
            className="progress me-2"
            role="progressbar"
            aria-label="Basic example"
            aria-valuenow={0}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ height: 5, minWidth: 80 }}
          >
            <div
              className={`progress-bar  ${text === 'Won'?'bg-success':text === 'In Pipeline'?'bg-purple':text === 'Conversation'?'bg-skyblue':text === 'Follow Up'?'bg-warning':text === 'Schedule servise'?'bg-pink':'bg-danger'}`}
              style={{ width: "100%" }}
            />
          </div>
          <span className="fs-14 fw-normal">{text}</span>
        </div>
      ),
      sorter: (a: any, b: any) => a.stage.length - b.stage.length,
    },
    {
      title: "Created Date",
      dataIndex: "createdDate",
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a: any, b: any) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    },
    {
      title: "Status",
      dataIndex: "status",
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
      title: "",
      dataIndex: "actions",
      render: (_: any, record: any) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#edit_pipeline"
            onClick={e => {
              e.preventDefault();
              handleEditClick(record);
            }}
          >
            <i className="ti ti-edit" />
          </Link>
          <Link
            to="#"
            data-bs-toggle="modal"
            data-bs-target="#delete_pipeline"
            onClick={e => {
              e.preventDefault();
              handleDeleteClick(record);
            }}
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
              <h2 className="mb-1">Pipeline</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">CRM</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Pipeline List
                  </li>
                </ol>
              </nav>
            </div>
            <div className="col-auto float-end ms-auto">
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
                {/* Export Dropdown */}
                <div className="me-2 mb-2">
                  <div className="dropdown">
                    <Link
                      to="#"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                      onClick={(e) => e.preventDefault()}
                    >
                      <i className="ti ti-file-export me-1" />
                      {exporting ? "Exporting..." : "Export"}
                    </Link>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                          onClick={(e) => {
                            e.preventDefault();
                            handleExportPDF();
                          }}
                        >
                          <i className="ti ti-file-type-pdf me-1" />
                          Export as PDF
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
                        >
                          <i className="ti ti-file-type-xls me-1" />
                          Export as Excel
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                
                {/* Add Pipeline Button */}
                <div className="mb-2">
                  <Link
                    to="#"
                    data-bs-toggle="modal"
                    data-bs-target="#add_pipeline"
                    className="btn btn-primary d-flex align-items-center"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Add Pipeline
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Leads List */}
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <h5>Pipeline List</h5>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                {/* Date Range Filter */}
                <div className="me-3">
                  <div className="input-icon-end position-relative">
                   <PredefinedDateRanges/>
                    <span className="input-icon-addon">
                      <i className="ti ti-chevron-down" />
                    </span>
                  </div>
                </div>

                {/* Stage Filter */}
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Stage
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Won
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        In Pipeline
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Conversation
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Follow Up
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Deal Value Range Filter */}
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    $0.00 - $0.00
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        $10 - $20
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        $20 - $30
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        $40 - $50
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Status Filter */}
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Active
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Inactive
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Sort Options */}
                <div className="dropdown me-3">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By : Last 7 Days
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Recently Added
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Ascending
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Desending
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Last Month
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="#"
                        className="dropdown-item rounded-1"
                      >
                        Last 7 Days
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="p-4 text-center">Loading pipelines...</div>
              ) : error ? (
                <div className="p-4 text-danger text-center">{error}</div>
              ) : (
                <>
                  {/* Filter Summary */}
                  <Table dataSource={pipelines} columns={columns} Selection={true} />
                </>
              )}
            </div>
          </div>
          {/* /Leads List */}
        </div>
        <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
          <p className="mb-0">2014 - 2025 © SmartHR.</p>
          <p>
            Designed &amp; Developed By{" "}
            <Link to="#" className="text-primary">
              Dreams
            </Link>
          </p>
        </div>
      </div>
      {/* /Page Wrapper */}
      <CrmsModal/>
      <AddPipeline />
      <EditPipeline pipeline={editPipeline} onPipelineUpdated={handlePipelineUpdated} />
      <DeletePipeline pipeline={deletePipeline} onPipelineDeleted={handlePipelineDeleted} />
    </>
  );
}

export default Pipeline;