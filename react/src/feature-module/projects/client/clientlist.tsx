import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom';
import { all_routes } from '../../router/all_routes';
import { useSocket } from '../../../SocketContext';
import { Socket } from 'socket.io-client';
import Table from "../../../core/common/dataTable/index";
import CollapseHeader from '../../../core/common/collapse-header/collapse-header';
import ImageWithBasePath from '../../../core/common/imageWithBasePath';
import AddClient from './add_client';
import EditClient from './edit_client';
import DeleteClient from './delete_client';
import { message } from 'antd';

interface Client {
  _id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  status: 'Active' | 'Inactive';
  contractValue?: number;
  projects?: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  newClients: number;
}

const ClientList = () => {
    const socket = useSocket() as Socket | null;
    
    // State management
    const [clients, setClients] = useState<Client[]>([]);
    const [stats, setStats] = useState<ClientStats>({
        totalClients: 0,
        activeClients: 0,
        inactiveClients: 0,
        newClients: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    
    const [filters, setFilters] = useState({
        status: 'All',
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc' as 'asc' | 'desc'
    });
    
    const [selectedClient, setSelectedClient] = useState<any>(null);
    
    // Fetch clients data
    const fetchClients = useCallback(() => {
        if (!socket) return;
        setLoading(true);
        setError(null);
        console.log("[ClientList] Fetching all clients from backend");
        socket.emit('client:getAllData', {});
    }, [socket]);
    
    // Load data on component mount
    useEffect(() => {
        if (!socket) return;
        
        fetchClients();
        
        const clientHandler = (res: any) => {
            console.log('Client getAllData response:', res);
            if (res.done) {
                console.log('Raw clients from backend:', res.data.clients);
                setClients(res.data.clients || []);
                setStats(res.data.stats || {
                    totalClients: 0,
                    activeClients: 0,
                    inactiveClients: 0,
                    newClients: 0
                });
                setError(null);
                console.log(`Loaded ${res.data.clients?.length || 0} clients`);
            } else {
                setError(res.error || "Failed to fetch clients");
                console.error('Failed to fetch clients:', res.error);
            }
            setLoading(false);
        };

        // Listen for real-time updates
        const handleClientCreated = (response: any) => {
            if (response.done && response.data) {
                console.log('Client created:', response.data);
                fetchClients();
                message.success('Client created successfully!');
            }
        };

        const handleClientUpdated = (response: any) => {
            if (response.done && response.data) {
                console.log('Client updated:', response.data);
                fetchClients();
                message.success('Client updated successfully!');
            }
        };

        const handleClientDeleted = (response: any) => {
            if (response.done && response.data) {
                console.log('Client deleted:', response.data);
                fetchClients();
                message.success('Client deleted successfully!');
            }
        };

        socket.on("client:getAllData-response", clientHandler);
        socket.on('client:client-created', handleClientCreated);
        socket.on('client:client-updated', handleClientUpdated);
        socket.on('client:client-deleted', handleClientDeleted);

        return () => {
            socket.off("client:getAllData-response", clientHandler);
            socket.off('client:client-created', handleClientCreated);
            socket.off('client:client-updated', handleClientUpdated);
            socket.off('client:client-deleted', handleClientDeleted);
        };
    }, [socket, fetchClients]);

    // Handle delete client
    const handleDeleteClient = (client: any) => {
        setSelectedClient(client);
        // Dispatch custom event that delete_client.tsx is listening for
        window.dispatchEvent(
            new CustomEvent('delete-client', { detail: { client } })
        );
    };

    // Handle edit client
    const handleEditClient = (client: any) => {
        setSelectedClient(client);
        // Dispatch custom event that edit_client.tsx is listening for
        window.dispatchEvent(
            new CustomEvent('edit-client', { detail: { client } })
        );
    };

    // Export functions
    const handleExportPDF = useCallback(async () => {
        if (!socket) {
            message.error("Socket connection not available");
            return;
        }

        setExporting(true);
        try {
            console.log("Starting PDF export...");
            socket.emit("client/export-pdf");

            const handlePDFResponse = (response: any) => {
                if (response.done) {
                    console.log("PDF generated successfully:", response.data.pdfUrl);
                    const link = document.createElement('a');
                    link.href = response.data.pdfUrl;
                    link.download = `clients_${Date.now()}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    message.success("PDF exported successfully!");
                } else {
                    console.error("PDF export failed:", response.error);
                    message.error(`PDF export failed: ${response.error}`);
                }
                setExporting(false);
                socket.off("client/export-pdf-response", handlePDFResponse);
            };

            socket.on("client/export-pdf-response", handlePDFResponse);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            message.error("Failed to export PDF");
            setExporting(false);
        }
    }, [socket]);

    const handleExportExcel = useCallback(async () => {
        if (!socket) {
            message.error("Socket connection not available");
            return;
        }

        setExporting(true);
        try {
            console.log("Starting Excel export...");
            socket.emit("client/export-excel");

            const handleExcelResponse = (response: any) => {
                if (response.done) {
                    console.log("Excel generated successfully:", response.data.excelUrl);
                    const link = document.createElement('a');
                    link.href = response.data.excelUrl;
                    link.download = `clients_${Date.now()}.xlsx`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    message.success("Excel exported successfully!");
                } else {
                    console.error("Excel export failed:", response.error);
                    message.error(`Excel export failed: ${response.error}`);
                }
                setExporting(false);
                socket.off("client/export-excel-response", handleExcelResponse);
            };

            socket.on("client/export-excel-response", handleExcelResponse);
        } catch (error) {
            console.error("Error exporting Excel:", error);
            message.error("Failed to export Excel");
            setExporting(false);
        }
    }, [socket]);

    // Handle filter changes
    const handleStatusFilter = (status: string) => {
        setFilters(prev => ({ ...prev, status }));
    };

    const handleSearch = (search: string) => {
        setFilters(prev => ({ ...prev, search }));
    };

    const handleSort = (sortBy: string) => {
        setFilters(prev => ({ 
            ...prev, 
            sortBy,
            sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
        }));
    };

    const columns = [
        {
            title: "Client ID",
            dataIndex: "_id",
            render: (text: string, record: any) => (
                <Link to={all_routes.clientdetils}>
                    {record._id.slice(-8).toUpperCase()}
                </Link>
            ),
            sorter: (a: any, b: any) => a._id.localeCompare(b._id),
        },
        {
            title: "Client Name",
            dataIndex: "name",
            render: (text: string, record: any) => (
                <div className="d-flex align-items-center file-name-icon">
                    <Link
                        to={all_routes.clientdetils}
                        className="avatar avatar-md border avatar-rounded"
                    >
                        <ImageWithBasePath 
                            src={record.logo || `assets/img/users/user-01.jpg`} 
                            className="img-fluid" 
                            alt="img" 
                        />
                    </Link>
                    <div className="ms-2">
                        <h6 className="fw-medium">
                            <Link to={all_routes.clientdetils}>{record.name}</Link>
                        </h6>
                        <span className="fs-12 fw-normal">{record.company}</span>
                    </div>
                </div>
            ),
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        },
        {
            title: "Company Name",
            dataIndex: "company",
            sorter: (a: any, b: any) => a.company.localeCompare(b.company),
        },
        {
            title: "Email",
            dataIndex: "email",
            sorter: (a: any, b: any) => a.email.localeCompare(b.email),
        },
        {
            title: "Phone",
            dataIndex: "phone",
            render: (text: string) => text || 'N/A',
            sorter: (a: any, b: any) => (a.phone || '').localeCompare(b.phone || ''),
        },
        {
            title: "Status",
            dataIndex: "status",
            render: (text: string, record: any) => (
                <span className={`badge d-inline-flex align-items-center badge-xs ${
                    record.status === 'Active' ? 'badge-success' : 'badge-danger'
                }`}>
                    <i className="ti ti-point-filled me-1" />
                    {record.status}
                </span>
            ),
            sorter: (a: any, b: any) => a.status.localeCompare(b.status),
        },
        {
            title: "Contract Value",
            dataIndex: "contractValue",
            render: (text: number) => `$${(text || 0).toLocaleString()}`,
            sorter: (a: any, b: any) => (a.contractValue || 0) - (b.contractValue || 0),
        },
        {
            title: "",
            dataIndex: "actions",
            render: (text: any, record: any) => (
                <div className="action-icon d-inline-flex">
                    <Link
                        to="#"
                        className="me-2"
                        data-bs-toggle="modal"
                        data-bs-target="#edit_client"
                        onClick={(e) => {
                            e.preventDefault();
                            handleEditClient(record);
                        }}
                    >
                        <i className="ti ti-edit" />
                    </Link>
                    <Link
                        to="#"
                        data-bs-toggle="modal"
                        data-bs-target="#delete_client"
                        onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClient(record);
                        }}
                    >
                        <i className="ti ti-trash" />
                    </Link>
                </div>
            ),
        },
    ]

    return (
        <>
            {/* Page Wrapper */}
            <div className="page-wrapper">
                <div className="content">
                    {/* Breadcrumb */}
                    <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
                        <div className="my-auto mb-2">
                            <h2 className="mb-1">Clients</h2>
                            <nav>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to={all_routes.adminDashboard}>
                                            <i className="ti ti-smart-home" />
                                        </Link>
                                    </li>
                                    <li className="breadcrumb-item">Employee</li>
                                    <li className="breadcrumb-item active" aria-current="page">
                                        Client List
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
                            <div className="me-2 mb-2">
                                <div className="d-flex align-items-center border bg-white rounded p-1 me-2 icon-list">
                                    <Link
                                        to={all_routes.clientlist}
                                        className="btn btn-icon btn-sm active bg-primary text-white me-1"
                                    >
                                        <i className="ti ti-list-tree" />
                                    </Link>
                                    <Link to={all_routes.clientgrid} className="btn btn-icon btn-sm">
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
                                            >
                                                <i className="ti ti-file-type-pdf me-1" />
                                                {exporting ? "Exporting..." : "Export as PDF"}
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
                                                {exporting ? "Exporting..." : "Export as Excel"}
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mb-2">
                                <Link
                                    to="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#add_client"
                                    className="btn btn-primary d-flex align-items-center"
                                >
                                    <i className="ti ti-circle-plus me-2" />
                                    Add Client
                                </Link>
                            </div>
                            <div className="ms-2 head-icons">
                            <CollapseHeader />
                            </div>
                        </div>
                    </div>
                    {/* /Breadcrumb */}
                    {/* Clients Info */}
                    <div className="row">
                        <div className="col-xl-3 col-md-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <span className="p-2 br-10 bg-pink-transparent border border-pink d-flex align-items-center justify-content-center">
                                                    <i className="ti ti-users-group text-pink fs-18" />
                                                </span>
                                            </div>
                                            <div>
                                                <p className="fs-12 fw-medium mb-0 text-gray-5 mb-1">
                                                    Total Clients
                                                </p>
                                                <h4>{stats?.totalClients || 0}</h4>
                                            </div>
                                        </div>
                                        <span className="badge bg-transparent-purple d-inline-flex align-items-center fw-normal">
                                            <i className="ti ti-arrow-wave-right-down me-1" />
                                            +19.01%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <span className="p-2 br-10 bg-success-transparent border border-success d-flex align-items-center justify-content-center">
                                                    <i className="ti ti-user-share fs-18" />
                                                </span>
                                            </div>
                                            <div>
                                                <p className="fs-12 fw-medium mb-0 text-gray-5 mb-1">
                                                    Active Clients
                                                </p>
                                                <h4>{stats?.activeClients || 0}</h4>
                                            </div>
                                        </div>
                                        <span className="badge bg-transparent-primary text-primary d-inline-flex align-items-center fw-normal">
                                            <i className="ti ti-arrow-wave-right-down me-1" />
                                            +19.01%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <span className="p-2 br-10 bg-danger-transparent border border-danger d-flex align-items-center justify-content-center">
                                                    <i className="ti ti-user-pause fs-18" />
                                                </span>
                                            </div>
                                            <div>
                                                <p className="fs-12 fw-medium mb-0 text-gray-5 mb-1">
                                                    Inactive Clients
                                                </p>
                                                <h4>{stats?.inactiveClients || 0}</h4>
                                            </div>
                                        </div>
                                        <span className="badge bg-transparent-dark text-dark d-inline-flex align-items-center fw-normal">
                                            <i className="ti ti-arrow-wave-right-down me-1" />
                                            +19.01%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-3 col-md-6 d-flex">
                            <div className="card flex-fill">
                                <div className="card-body">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <span className="p-2 br-10 bg-info-transparent border border-info d-flex align-items-center justify-content-center">
                                                    <i className="ti ti-user-plus fs-18" />
                                                </span>
                                            </div>
                                            <div>
                                                <p className="fs-12 fw-medium mb-0 text-gray-5 mb-1">
                                                    New Clients
                                                </p>
                                                <h4>{stats?.newClients || 0}</h4>
                                            </div>
                                        </div>
                                        <span className="badge bg-transparent-secondary text-dark d-inline-flex align-items-center fw-normal">
                                            <i className="ti ti-arrow-wave-right-down me-1" />
                                            +19.01%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /Clients Info */}
                    {/* Clients list */}
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                            <h5>Client List</h5>
                            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                                <div className="dropdown me-3">
                                    <Link
                                        to="#"
                                        className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                                        data-bs-toggle="dropdown"
                                    >
                                        Select Status
                                    </Link>
                                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                                        <li>
                                            <Link
                                                to="#"
                                                className="dropdown-item rounded-1"
                                                onClick={() => handleStatusFilter('Active')}
                                            >
                                                Active
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="#"
                                                className="dropdown-item rounded-1"
                                                onClick={() => handleStatusFilter('Inactive')}
                                            >
                                                Inactive
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div className="dropdown">
                                    <Link
                                        to="#"
                                        className="dropdown-toggle btn btn-sm btn-white d-inline-flex align-items-center"
                                        data-bs-toggle="dropdown"
                                    >
                                        Sort By : Last 7 Days
                                    </Link>
                                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                                        <li>
                                            <Link
                                                to="#"
                                                className="dropdown-item rounded-1"
                                                onClick={() => handleSort('createdAt')}
                                            >
                                                Recently Added
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to="#"
                                                className="dropdown-item rounded-1"
                                                onClick={() => handleSort('name')}
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
                                <div className="text-center p-4">
                                    <div className="spinner-border" role="status">
                                        <span className="sr-only">Loading clients...</span>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="alert alert-danger m-3">
                                    <h6>Error loading clients</h6>
                                    <p className="mb-0">{error}</p>
                                    <button className="btn btn-primary mt-2" onClick={fetchClients}>
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <Table dataSource={clients} columns={columns} Selection={true} />
                            )}
                        </div>
                    </div>
                    {/* /Clients list */}
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
            
            {/* Modal Components */}
            <AddClient />
            <EditClient />
            <DeleteClient />
        </>
    )
}

export default ClientList