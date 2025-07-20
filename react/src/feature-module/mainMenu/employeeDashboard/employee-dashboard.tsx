import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../router/all_routes";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import ReactApexChart from "react-apexcharts";
import CircleProgressSmall from "./circleProgressSmall";
import CircleProgress from "./circleProgress";
import { Calendar } from "primereact/calendar";
import { DatePicker } from "antd";
import CommonSelect from "../../../core/common/commonSelect";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { useAuth, useUser } from "@clerk/clerk-react";
import { attendance } from "../../../core/common/selectoption/selectoption";
import io from "socket.io-client";
import { ApexOptions } from "apexcharts";
import RequestModals from "../../../core/modals/requestModal";
import CryptoJS from "crypto-js";

interface DashboardData {
  employeeDetails?: {
    _id: string
    name: string;
    designation: string;
    role: string;
    avatar: string;
    phoneNumber: string;
    email: string;
    reportOffice: string;
    joinedOn: string;
  },
  attendanceStats?: {
    absent: number,
    late: number,
    onTime: number,
    workFromHome: number,
    workedDays: number,
    workingDays: number,
    punchIn: string,
    punchOut: string,
  }
  leaveStats?: {
    lossOfPay: number,
    requestedLeaves: number,
    sickLeaves: number,
    takenLeaves: number,
    totalLeavesAllowed: number,
  }
  workingHoursStats?: {
    today: {
      breakHours: number,
      expectedHours: number,
      overtimeHours: number,
      workedHours: number,
    }
    thisWeek: {
      expectedHours: number,
      workedHours: number,
    }
    thisMonth: {
      expectedHours: number,
      workedHours: number,
      expectedOvertimeHours: number,
      overtimeHours: number,
    }
  }
  projects?: Array<{
    projectId: string
    projectTitle: string,
    dueDate: string,
    totalTasks: number,
    completedTasks: number,
    projectLeadAvatar: string | null;
    leadName: string | null;
    membersAvatars: string[];
  }>
  tasks?: Array<{
    _id: string,
    title: string,
    starred: boolean,
    checked: boolean,
    status: string,
    avatars: Array<{ _id: string, avatar: string }>;
  }>
  skills?: Array<{
    name: string,
    updatedAt: string,
    proficiency: number,
  }>
  teamMembers?: Array<{
    _id: string;
    name: string;
    avatar: string;
    role: string;
  }>,
  notifications?: Array<{
    _id: string,
    title: string,
    createdAt: string,
    avatar: string,
  }>
  meetings?: Array<{
    _id: string
    title: string,
    description: string,
    startTime: string,
    tag: string
  }>
  performance?: {
    months: string[];
    salaries: number[];
  }
  birthdays?: Array<{
    _id: string;
    name: string;
    avatarUrl?: string;
    role?: string;
  }>
}
const ENCRYPTION_KEY = 'your-strong-encryption-key';
const leaveType = [
  { value: "Select", label: "Select" },
  { value: "Sick Leave", label: "Medical Leave" },
  { value: "Casual Leave", label: "Casual Leave" },
  { label: "Loss of Pay", value: "lossOfPay" }
];
const EmployeeDashboard = () => {
  const routes = all_routes;
  const { getToken } = useAuth();
  const { user, isLoaded, isSignedIn } = useUser();
  const [socket, setSocket] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [date, setDate] = useState(new Date());

  const [filters, setFilters] = useState({
    attendanceStats: year,
    projects: 'ongoing',
    tasks: 'ongoing',
    performance: year,
    skills: year,
    meetings: "today",
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => (currentYear - i).toString());

  const handleYearChangeAll = (newDate: Date) => {
    console.log(`[YEAR FILTER] Year changed to: ${newDate.getFullYear()}`);
    setDate(newDate);

    if (socket) {
      const year = newDate.getFullYear();
      socket.emit("admin/dashboard/get-all-data", { year });
    }
  };

  useEffect(() => {
    let isMounted = true;
    let currentSocket: any = null;

    const initSocket = async () => {
      try {
        console.log("Initializing socket connection...");
        const token = await getToken();
        console.log("Token obtained, creating socket...");

        if (!isMounted) return;

        currentSocket = io("http://localhost:5000", {
          auth: { token },
          timeout: 20000,
        });

        const timeoutId = setTimeout(() => {
          if (loading && isMounted) {
            console.warn("Dashboard loading timeout - showing fallback");
            setError("Dashboard loading timed out. Please refresh the page.");
            setLoading(false);
          }
        }, 30000);

        currentSocket.on("connect", () => {
          console.log("Connected to admin dashboard");
          console.log("Requesting dashboard data...");
          currentSocket.emit("employee/dashboard/get-all-data");
        });

        currentSocket.on("employee/dashboard/get-all-data-response", (response: any) => {
          console.log("Received dashboard data response:", response);
          clearTimeout(timeoutId);
          if (!isMounted) return;
          if (response.done) {
            console.log("Dashboard data loaded successfully");
            setDashboardData(response.data);
            setLoading(false);
          } else {
            console.error("Dashboard data error:", response.error);
            setError(response.error || "Failed to fetch dashboard data");
            setLoading(false);
          }
        });

        currentSocket.on("employee/dashboard/get-attendance-stats-response", (response: any) => {
          if (!isMounted) return;
          if (response.done) {
            setDashboardData(prev => ({
              ...prev,
              attendanceStats: response.data,
            }));
          }
        });

        currentSocket.on("employee/dashboard/get-leave-stats-response", (response: any) => {
          if (!isMounted) return;
          if (response.done) {
            setDashboardData(prev => ({
              ...prev,
              leaveStats: response.data,
            }));
          }
        });

        currentSocket.on('employee/dashboard/get-projects-response', (response: any) => {
          if (!isMounted) return;
          if (response.done) {
            console.log(response);
            setDashboardData(prev => ({
              ...prev,
              projects: response.data
            }));
          }
        });

        currentSocket.on('employee/dashboard/get-tasks-response', (response: any) => {
          if (!isMounted) return;
          if (response.done) {
            setDashboardData(prev => ({
              ...prev,
              tasks: response.data
            }));
          }
        });

        currentSocket.on("employee/dashboard/get-skills-response", (response: any) => {
          if (!isMounted) return;
          if (response.done) {
            setDashboardData(prev => ({
              ...prev,
              skills: response.data
            }));
          }
        });

        currentSocket.on("employee/dashboard/get-meetings-response", (response: any) => {
          if (!isMounted) return;
          if (response.done) {
            setDashboardData(prev => ({
              ...prev,
              meetings: response.data
            }));
          }
        });

        currentSocket.on("employee/dashboard/get-performance-response", (response: any) => {
          if (!isMounted) return;
          if (response.done) {
            console.log(response);
            setDashboardData(prev => ({
              ...(prev ?? {}),
              performance: response.data
            }));
          }
        });

        currentSocket.on("connect_error", (err: any) => {
          console.error("Socket connection error:", err);
          clearTimeout(timeoutId);
          if (!isMounted) return;

          setError("Failed to connect to server");
          setLoading(false);
        });

        currentSocket.on("disconnect", (reason: any) => {
          console.log("Socket disconnected:", reason);
          clearTimeout(timeoutId);
        });

        if (isMounted) {
          setSocket(currentSocket);
        }
      } catch (err) {
        console.error("Failed to initialize socket:", err);
        if (isMounted) {
          setError("Failed to authenticate");
          setLoading(false);
        }
      }
    };

    if (!socket)
      initSocket();

    return () => {
      isMounted = false;
      if (currentSocket) {
        console.log("Cleaning up socket connection...");
        currentSocket.removeAllListeners();
        currentSocket.disconnect();
      }
    };

  }, []);

  // helper functions

  function encryptValue(value: string): string {
    return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
  }

  function decryptValue(encrypted: string): string | null {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted;
    } catch {
      return null;
    }
  }
  let overallTimerInterval: ReturnType<typeof setInterval> | null = null;
  let productionTimerInterval: ReturnType<typeof setInterval> | null = null;

  function handlePunchIn(employeeId : String): void {
    const checkInTime = Date.now();
    const encryptedCheckIn = encryptValue(checkInTime.toString());
    localStorage.setItem('encryptedCheckIn', encryptedCheckIn);
    socket.emit("employee/dashboard/punch-in");
    console.log(` Punched in at ${new Date(checkInTime).toLocaleString()}`);
    startOverallTimer(checkInTime);
    startProductionTimer(checkInTime);
  }
  function startOverallTimer(checkInTime: number) {
    clearInterval(overallTimerInterval!);

    overallTimerInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - checkInTime;

      const formatted = formatMsToTime(elapsed);
      console.log("🕒 Overall Time:", formatted);

      // Optionally update UI state here
    }, 1000);
  }

  function startProductionTimer(startTime: number) {
    clearInterval(productionTimerInterval!);
    productionTimerInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const formatted = formatMsToTime(elapsed);
      console.log("🔧 Production Time:", formatted);
      // Optionally update UI state here
    }, 1000);
  }

  function formatMsToTime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return [hours, minutes, seconds].map(pad).join(':');
  }

  function pad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-secondary-transparent';
      case 'inprogress':
        return 'bg-transparent-purple';
      case 'onhold':
        return 'bg-soft-pink';
      default:
        return 'bg-light';
    }
  };

  function formatDateProject(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function convertHoursDecimalToHoursMinutes(decimalHours: number): string {
    if (decimalHours === undefined || decimalHours === null) return '0h 0m';
    const totalMinutes = Math.round(decimalHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  const formatCurrentDateTime = () => {
    const date = new Date();

    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).replace(/^0/, '');

    const day = date.toLocaleDateString('en-US', { day: '2-digit' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();

    return `${time}, ${day} ${month} ${year}`;
  };
  function parseHourDecimal(hourDecimal: number | undefined): number {
    if (hourDecimal == null) return 0;
    const hours = Math.floor(hourDecimal);
    const minutes = Math.round((hourDecimal - hours) * 100);
    return hours + minutes / 60;
  }

  function calculateTimePercentages(
    totalWorkingHours?: number,
    productiveHours?: number,
    overtimeHours?: number,
    breakTime?: number,
  ) {
    const total = parseHourDecimal(totalWorkingHours);
    const productive = parseHourDecimal(productiveHours);
    const overtime = parseHourDecimal(overtimeHours);
    const brk = parseHourDecimal(breakTime);

    if (total === 0) {
      return {
        productivePercent: 0,
        overtimePercent: 0,
        breakPercent: 0,
      };
    }

    return {
      productivePercent: (productive / total) * 100,
      overtimePercent: (overtime / total) * 100,
      breakPercent: (brk / total) * 100,
    };
  };

  const {
    productivePercent,
    overtimePercent,
    breakPercent,
  } = calculateTimePercentages(
    dashboardData?.workingHoursStats?.today?.expectedHours,
    dashboardData?.workingHoursStats?.today?.workedHours,
    dashboardData?.workingHoursStats?.today?.overtimeHours,
    dashboardData?.workingHoursStats?.today?.breakHours,
  );

  function fillMissingMonths(performanceData: { months: string[]; salaries: number[] }) {
    const allMonths = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
      "Sep", "Oct", "Nov", "Dec"
    ];
    const currentMonthIndex = new Date().getMonth();
    const monthsToUse = allMonths.slice(0, currentMonthIndex + 1);

    const salaryMap = new Map<string, number>();
    performanceData.months.forEach((month, idx) => {
      salaryMap.set(month.toLowerCase(), performanceData.salaries[idx]);
    });

    let lastSalary: number | null = null;
    const filledSalaries = monthsToUse.map(month => {
      const salary = salaryMap.get(month.toLowerCase());
      if (salary !== undefined) {
        lastSalary = salary;
        return salary;
      }
      return lastSalary === null ? 0 : lastSalary;
    });

    return {
      months: monthsToUse,
      salaries: filledSalaries,
    };
  }
  // const processedPerformance = fillMissingMonths(
  //   dashboardData.performanceData ?? { months: [], salaries: [] }
  // );

  //New Chart
  const leavesChart_series = [
    dashboardData?.attendanceStats?.onTime || 0,
    dashboardData?.attendanceStats?.late || 0,
    dashboardData?.attendanceStats?.workFromHome || 0,
    dashboardData?.attendanceStats?.absent || 0,
    dashboardData?.leaveStats?.sickLeaves || 0,
  ];
  const leavesChart_options: ApexOptions = {
    chart: {
      height: 165,
      type: "donut",
      toolbar: { show: false },
    },
    labels: ["On Time", "Late", "Work From Home", "Absent", "Sick Leaves"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
      },
    },
    dataLabels: { enabled: false },
    series: [
      dashboardData?.attendanceStats?.onTime || 0,
      dashboardData?.attendanceStats?.late || 0,
      dashboardData?.attendanceStats?.workFromHome || 0,
      dashboardData?.attendanceStats?.absent || 0,
      dashboardData?.leaveStats?.sickLeaves || 0,
    ],
    colors: ["#0C4B5E", "#03C95A", "#F26522", "#E70D0D", "#FFC107",],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 200 },
        legend: { show: false },
      },
    }],
    legend: { show: false },
  };

  const performance_chart2_series = dashboardData?.performance?.salaries ?? [];
  const months = dashboardData?.performance?.months ?? [];


  const performance_chart2_options: ApexOptions = {
    chart: {
      height: 288,
      type: "area",
      zoom: {
        enabled: false,
      },
    },
    colors: ["#00C853"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "straight",
    },
    title: {
      text: "Performance Over Time",
      align: "left",
    },
    xaxis: {
      categories: months,
    },
    yaxis: {

    },
    legend: {
      position: "top",
    },
  };


  const employeename = [
    { value: "Select", label: "Select" },
    { value: "Anthony Lewis", label: "Anthony Lewis" },
    { value: "Brian Villalobos", label: "Brian Villalobos" },
    { value: "Harvey Smith", label: "Harvey Smith" },
  ];

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  const handleMeetingFilterChange = (filter: "today" | "month" | "year") => {
    setFilters(prev => ({ ...prev, meetings: filter }));
    socket.emit('employee/dashboard/get-meetings', { filter: filter });
  }

  const handleProjectFilterChange = (filter: "all" | "ongoing") => {
    setFilters(prev => ({ ...prev, projects: filter }));
    socket.emit('employee/dashboard/get-projects', { filter: filter });
  }

  const handleTaskChange = (filter: "all" | "ongoing") => {
    setFilters(prev => ({ ...prev, tasks: filter }));
    socket.emit('employee/dashboard/get-tasks', { filter: filter });
  }
  const handleYearChange = (widget: string, year: string) => {
    console.log(`[YEAR FILTER] ${widget}: ${year}`);
    setFilters(prev => ({
      ...prev,
      [widget]: year
    }));
    if (socket) {
      const payload = { year: Number(year) };
      if (widget === 'attendanceStats') {
        console.log('[SOCKET EMIT] Payload:', payload);
        socket.emit("employee/dashboard/get-attendance-stats", payload);
        socket.emit("employee/dashboard/get-leave-stats", payload);
      }
      if (widget === 'performance') {
        socket.emit("employee/dashboard/get-performance", payload);
      }
      if (widget === 'skills') {
        socket.emit("employee/dashboard/get-skills", payload);
      }
    }
  };
  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Employee Dashboard</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Dashboard</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Employee Dashboard
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
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
              <div className="input-icon w-120 position-relative mb-2">
                <span className="input-icon-addon">
                  <i className="ti ti-calendar text-gray-9" />
                </span>
                <Calendar
                  value={date}
                  onChange={(e: any) => setDate(e.value)}
                  view="year"
                  dateFormat="yy"
                  className="Calendar-form"
                />
              </div>
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          <div className="alert bg-secondary-transparent alert-dismissible fade show mb-4">
            {/* Your Leave Request on“24th April 2024”has been Approved!!! */}
            <button
              type="button"
              className="btn-close fs-14"
              data-bs-dismiss="alert"
              aria-label="Close"
            >
              <i className="ti ti-x" />
            </button>
          </div>
          <div className="row">
            <div className="col-xl-4 d-flex">
              <div className="card position-relative flex-fill">
                <div className="card-header bg-dark">
                  <div className="d-flex align-items-center">
                    <span className="avatar avatar-lg avatar-rounded border border-white border-2 flex-shrink-0 me-2">
                      <ImageWithBasePath
                        src={dashboardData?.employeeDetails?.avatar || "assets/img/users/user-01.jpg"}
                        alt="Img"
                      />
                    </span>
                    <div>
                      <h5 className="text-white mb-1">{dashboardData?.employeeDetails?.name}</h5>
                      <div className="d-flex align-items-center">
                        <p className="text-white fs-12 mb-0">
                          {dashboardData?.employeeDetails?.designation}
                        </p>
                        <span className="mx-1">
                          <i className="ti ti-point-filled text-primary" />
                        </span>
                        <p className="fs-12">{dashboardData?.employeeDetails?.role}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="#"
                    className="btn btn-icon btn-sm text-white rounded-circle edit-top"
                  >
                    <i className="ti ti-edit" />
                  </Link>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <span className="d-block mb-1 fs-13">Phone Number</span>
                    <p className="text-gray-9">{dashboardData?.employeeDetails?.phoneNumber}</p>
                  </div>
                  <div className="mb-3">
                    <span className="d-block mb-1 fs-13">Email Address</span>
                    <p className="text-gray-9">{dashboardData?.employeeDetails?.email}</p>
                  </div>
                  <div className="mb-3">
                    <span className="d-block mb-1 fs-13">Report Office</span>
                    <p className="text-gray-9">{dashboardData?.employeeDetails?.reportOffice}</p>
                  </div>
                  <div>
                    <span className="d-block mb-1 fs-13">Joined on</span>
                    <p className="text-gray-9">{dashboardData?.employeeDetails?.joinedOn}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <h5>Leave Details</h5>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="btn btn-white border btn-sm d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1" />
                        {filters.attendanceStats}
                      </Link>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        {yearOptions.map((year) => (
                          <li key={year}>
                            <Link
                              to="#"
                              className="dropdown-item rounded-1"
                              onClick={() => handleYearChange('attendanceStats', year)}
                            >
                              {year}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <div className="mb-4">
                        <div className="mb-3">
                          <p className="d-flex align-items-center">
                            <i className="ti ti-circle-filled fs-8 text-dark me-1" />
                            <span className="text-gray-9 fw-semibold me-1">
                              {dashboardData?.attendanceStats?.onTime}
                            </span>
                            on time
                          </p>
                        </div>
                        <div className="mb-3">
                          <p className="d-flex align-items-center">
                            <i className="ti ti-circle-filled fs-8 text-success me-1" />
                            <span className="text-gray-9 fw-semibold me-1">
                              {dashboardData?.attendanceStats?.late}
                            </span>
                            Late Attendance
                          </p>
                        </div>
                        <div className="mb-3">
                          <p className="d-flex align-items-center">
                            <i className="ti ti-circle-filled fs-8 text-primary me-1" />
                            <span className="text-gray-9 fw-semibold me-1">
                              {dashboardData?.attendanceStats?.workFromHome}
                            </span>
                            Work From Home
                          </p>
                        </div>
                        <div className="mb-3">
                          <p className="d-flex align-items-center">
                            <i className="ti ti-circle-filled fs-8 text-danger me-1" />
                            <span className="text-gray-9 fw-semibold me-1">
                              {dashboardData?.attendanceStats?.absent}
                            </span>
                            Absent
                          </p>
                        </div>
                        <div>
                          <p className="d-flex align-items-center">
                            <i className="ti ti-circle-filled fs-8 text-warning me-1" />
                            <span className="text-gray-9 fw-semibold me-1">
                              {dashboardData?.leaveStats?.sickLeaves}
                            </span>
                            Sick Leave
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="d-flex justify-content-md-end" style={{ width: '100%' }}>
                        <div style={{ width: 200, height: 165 }}>
                          <ReactApexChart
                            id="leaves_chart"
                            options={leavesChart_options}
                            series={leavesChart_series}
                            type="donut"
                            height={165}
                            width={200}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className="form-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="todo1"
                        />
                        <label className="form-check-label" htmlFor="todo1">
                          Better than <span className="text-gray-9">85%</span>{" "}
                          of Employees
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <h5>Leave Details</h5>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="btn btn-white border btn-sm d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1" />
                        {filters.attendanceStats}
                      </Link>
                      <ul className="dropdown-menu dropdown-menu-end p-3">
                        {yearOptions.map((year) => (
                          <li key={year}>
                            <Link
                              to="#"
                              className="dropdown-item rounded-1"
                              onClick={() => handleYearChange('attendanceStats', year)}
                            >
                              {year}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <span className="d-block mb-1">Total Leaves</span>
                        <h4>{dashboardData?.leaveStats?.totalLeavesAllowed}</h4>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <span className="d-block mb-1">taken</span>
                        <h4>{dashboardData?.leaveStats?.takenLeaves}</h4>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <span className="d-block mb-1">Absent</span>
                        <h4>{dashboardData?.attendanceStats?.absent}</h4>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <span className="d-block mb-1">Request</span>
                        <h4>{dashboardData?.leaveStats?.requestedLeaves}</h4>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <span className="d-block mb-1">Worked Days</span>
                        <h4>{dashboardData?.attendanceStats?.workedDays}</h4>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="mb-3">
                        <span className="d-block mb-1">Loss of Pay</span>
                        <h4>{dashboardData?.leaveStats?.lossOfPay}</h4>
                      </div>
                    </div>
                    <div className="col-sm-12">
                      <div>
                        <Link
                          to="#"
                          className="btn btn-dark w-100"
                          data-bs-toggle="modal"
                          data-inert={true}
                          data-bs-target="#add_leaves"
                        >
                          Apply New Leave
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill border-primary attendance-bg">
                <div className="card-body">
                  <div className="mb-4 text-center">
                    <h6 className="fw-medium text-gray-5 mb-1">Attendance</h6>
                    <h4>{formatCurrentDateTime()}</h4>
                  </div>
                  <CircleProgress working_hour={dashboardData?.workingHoursStats?.today?.expectedHours ?? 0} time={9} />
                  <div className="text-center">
                    <div className="badge badge-dark badge-md mb-3">
                      Production : 3.45 hrs
                    </div>
                    <h6 className="fw-medium d-flex align-items-center justify-content-center mb-4">
                      <i className="ti ti-fingerprint text-primary me-1" />
                      Punch In at {dashboardData?.attendanceStats?.punchIn}
                    </h6>
                    <Link to="#" className="btn btn-primary w-100">
                      Punch Out
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-8 d-flex">
              <div className="row flex-fill">
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-primary mb-2">
                          <i className="ti ti-clock-stop" />
                        </span>
                        <h2 className="mb-2">
                          {dashboardData?.workingHoursStats?.today?.workedHours} / <span className="fs-20 text-gray-5">{dashboardData?.workingHoursStats?.today?.expectedHours}</span>
                        </h2>
                        <p className="fw-medium text-truncate">
                          Total Hours Today
                        </p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13">
                          <span className="avatar avatar-xs rounded-circle bg-success flex-shrink-0 me-2">
                            <i className="ti ti-arrow-up fs-12" />
                          </span>
                          <span>5% This Week</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-dark mb-2">
                          <i className="ti ti-clock-up" />
                        </span>
                        <h2 className="mb-2">
                          {dashboardData?.workingHoursStats?.thisWeek?.workedHours} / <span className="fs-20 text-gray-5"> {dashboardData?.workingHoursStats?.thisWeek?.expectedHours}</span>
                        </h2>
                        <p className="fw-medium text-truncate">
                          Total Hours Week
                        </p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13">
                          <span className="avatar avatar-xs rounded-circle bg-success flex-shrink-0 me-2">
                            <i className="ti ti-arrow-up fs-12" />
                          </span>
                          <span>7% Last Week</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-info mb-2">
                          <i className="ti ti-calendar-up" />
                        </span>
                        <h2 className="mb-2">
                          {dashboardData?.workingHoursStats?.thisMonth?.workedHours} / <span className="fs-20 text-gray-5"> {dashboardData?.workingHoursStats?.thisMonth?.expectedHours}</span>
                        </h2>
                        <p className="fw-medium text-truncate">
                          Total Hours Month
                        </p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13 text-truncate">
                          <span className="avatar avatar-xs rounded-circle bg-danger flex-shrink-0 me-2">
                            <i className="ti ti-arrow-down fs-12" />
                          </span>
                          <span>8% Last Month</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xl-3 col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="border-bottom mb-3 pb-2">
                        <span className="avatar avatar-sm bg-pink mb-2">
                          <i className="ti ti-calendar-star" />
                        </span>
                        <h2 className="mb-2">
                          {dashboardData?.workingHoursStats?.thisMonth?.overtimeHours} / <span className="fs-20 text-gray-5"> {dashboardData?.workingHoursStats?.thisMonth?.overtimeHours}</span>
                        </h2>
                        <p className="fw-medium text-truncate">
                          Overtime this Month
                        </p>
                      </div>
                      <div>
                        <p className="d-flex align-items-center fs-13 text-truncate">
                          <span className="avatar avatar-xs rounded-circle bg-danger flex-shrink-0 me-2">
                            <i className="ti ti-arrow-down fs-12" />
                          </span>
                          <span>6% Last Month</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-xl-3">
                          <div className="mb-4">
                            <p className="d-flex align-items-center mb-1">
                              <i className="ti ti-point-filled text-dark-transparent me-1" />
                              Total Working hours
                            </p>
                            <h3>{convertHoursDecimalToHoursMinutes(dashboardData?.workingHoursStats?.today?.expectedHours ?? 0)}</h3>
                          </div>
                        </div>
                        <div className="col-xl-3">
                          <div className="mb-4">
                            <p className="d-flex align-items-center mb-1">
                              <i className="ti ti-point-filled text-success me-1" />
                              Productive Hours
                            </p>
                            <h3>{convertHoursDecimalToHoursMinutes(dashboardData?.workingHoursStats?.today?.workedHours ?? 0)}</h3>
                          </div>
                        </div>
                        <div className="col-xl-3">
                          <div className="mb-4">
                            <p className="d-flex align-items-center mb-1">
                              <i className="ti ti-point-filled text-warning me-1" />
                              Break hours
                            </p>
                            <h3>{convertHoursDecimalToHoursMinutes(dashboardData?.workingHoursStats?.today?.breakHours ?? 0)}</h3>
                          </div>
                        </div>
                        <div className="col-xl-3">
                          <div className="mb-4">
                            <p className="d-flex align-items-center mb-1">
                              <i className="ti ti-point-filled text-info me-1" />
                              Overtime
                            </p>
                            <h3>{convertHoursDecimalToHoursMinutes(dashboardData?.workingHoursStats?.today?.overtimeHours ?? 0)}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-12">
                          <div
                            className="progress bg-transparent-dark mb-3"
                            style={{ height: 24 }}
                          >
                            <div
                              className="progress-bar bg-white rounded"
                              role="progressbar"
                              style={{ width: "18%" }}
                            />
                            <div
                              className="progress-bar bg-success rounded me-2"
                              role="progressbar"
                              style={{ width: "18%" }}
                            />
                            <div
                              className="progress-bar bg-warning rounded me-2"
                              role="progressbar"
                              style={{ width: "5%" }}
                            />
                            <div
                              className="progress-bar bg-success rounded me-2"
                              role="progressbar"
                              style={{ width: "28%" }}
                            />
                            <div
                              className="progress-bar bg-warning rounded me-2"
                              role="progressbar"
                              style={{ width: "17%" }}
                            />
                            <div
                              className="progress-bar bg-success rounded me-2"
                              role="progressbar"
                              style={{ width: "22%" }}
                            />
                            <div
                              className="progress-bar bg-warning rounded me-2"
                              role="progressbar"
                              style={{ width: "5%" }}
                            />
                            <div
                              className="progress-bar bg-info rounded me-2"
                              role="progressbar"
                              style={{ width: "3%" }}
                            />
                            <div
                              className="progress-bar bg-info rounded"
                              role="progressbar"
                              style={{ width: "2%" }}
                            />
                            <div
                              className="progress-bar bg-white rounded"
                              role="progressbar"
                              style={{ width: "18%" }}
                            />
                          </div>
                        </div>
                        <div className="co-md-12">
                          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                            <span className="fs-10">06:00</span>
                            <span className="fs-10">07:00</span>
                            <span className="fs-10">08:00</span>
                            <span className="fs-10">09:00</span>
                            <span className="fs-10">10:00</span>
                            <span className="fs-10">11:00</span>
                            <span className="fs-10">12:00</span>
                            <span className="fs-10">01:00</span>
                            <span className="fs-10">02:00</span>
                            <span className="fs-10">03:00</span>
                            <span className="fs-10">04:00</span>
                            <span className="fs-10">05:00</span>
                            <span className="fs-10">06:00</span>
                            <span className="fs-10">07:00</span>
                            <span className="fs-10">08:00</span>
                            <span className="fs-10">09:00</span>
                            <span className="fs-10">10:00</span>
                            <span className="fs-10">11:00</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <h5>Projects</h5>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="btn btn-white border-0 dropdown-toggle border btn-sm d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        {filters.projects}
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link to="#" className="dropdown-item rounded-1"
                            onClick={() => handleProjectFilterChange("all")}>
                            All Projects
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1"
                            onClick={() => handleProjectFilterChange("ongoing")}>
                            Ongoing Projects
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {dashboardData?.projects?.length === 0 ? (
                    <p className="text-center text-gray-500 text-lg">No available projects</p>
                  ) : (
                    <div className="row">
                      {dashboardData?.projects?.map((project) => (
                        <div key={project.projectId} className="col-md-6 mb-4">
                          <div className="card shadow-none h-100">
                            <div className="card-body">
                              <div className="d-flex align-items-center justify-content-between mb-3">
                                <h6>{project.projectTitle}</h6>
                                <div className="dropdown">
                                  <Link
                                    to="#"
                                    className="d-inline-flex align-items-center"
                                    data-bs-toggle="dropdown"
                                  >
                                    <i className="ti ti-dots-vertical" />
                                  </Link>
                                  <ul className="dropdown-menu dropdown-menu-end p-3">
                                    <li>
                                      <Link
                                        to="#"
                                        className="dropdown-item rounded-1"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit_task"
                                      >
                                        <i className="ti ti-edit me-2" /> Edit
                                      </Link>
                                    </li>
                                    <li>
                                      <Link
                                        to="#"
                                        className="dropdown-item rounded-1"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete_modal"
                                      >
                                        <i className="ti ti-trash me-2" /> Delete
                                      </Link>
                                    </li>
                                  </ul>
                                </div>
                              </div>

                              {/* Leader */}
                              <div className="d-flex align-items-center mb-3">
                                <Link to="#" className="avatar">
                                  <img
                                    src={project.projectLeadAvatar || 'assets/img/users/user-placeholder.jpg'}
                                    className="img-fluid rounded-circle"
                                    alt="lead"
                                  />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-normal">
                                    <Link to="#">{project.leadName || 'N/A'}</Link>
                                  </h6>
                                  <span className="fs-13 d-block">Project Leader</span>
                                </div>
                              </div>

                              {/* Deadline */}
                              <div className="d-flex align-items-center mb-3">
                                <Link to="#" className="avatar bg-soft-primary rounded-circle">
                                  <i className="ti ti-calendar text-primary fs-16" />
                                </Link>
                                <div className="ms-2">
                                  <h6 className="fw-normal">{formatDateProject(project.dueDate)}</h6>
                                  <span className="fs-13 d-block">Deadline</span>
                                </div>
                              </div>

                              {/* Tasks + Avatars */}
                              <div className="d-flex align-items-center justify-content-between bg-transparent-light border rounded p-2 ">
                                <div className="d-flex align-items-center">
                                  <span className="avatar avatar-sm bg-success-transparent rounded-circle me-1">
                                    <i className="ti ti-checklist fs-16" />
                                  </span>
                                  <p>
                                    Tasks : <span className="text-gray-9">{project.completedTasks}</span> / {project.totalTasks}
                                  </p>
                                </div>
                                <div className="avatar-list-stacked avatar-group-sm">
                                  {project.membersAvatars.slice(0, 3).map((avatarUrl, idx) => (
                                    <span key={idx} className="avatar avatar-rounded">
                                      <img className="border border-white" src={avatarUrl || "assets/img/profiles/avatar-31.jpg"} alt="member" />
                                    </span>
                                  ))}
                                  {project.membersAvatars.length > 3 && (
                                    <Link
                                      className="avatar bg-primary avatar-rounded text-fixed-white fs-12 fw-medium"
                                      to="#"
                                    >
                                      +{project.membersAvatars.length - 3}
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-xl-6 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <h5>Tasks</h5>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="btn btn-white border-0 dropdown-toggle border btn-sm d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        All Projects
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link to="#" className="dropdown-item rounded-1"
                            onClick={() => handleTaskChange("all")}>
                            All Projects
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1"
                            onClick={() => handleTaskChange("ongoing")}>
                            Ongoing Projects
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {dashboardData?.tasks?.map((task) => (
                      <div key={task._id} className="list-group-item border rounded mb-3 p-2">
                        <div className="row align-items-center row-gap-3">
                          <div className="col-md-8">
                            <div className="todo-inbox-check d-flex align-items-center">
                              <span><i className="ti ti-grid-dots me-2" /></span>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  defaultChecked={task.checked}
                                />
                              </div>
                              <span className="me-2 d-flex align-items-center rating-select">
                                <i className={`ti ${task.starred ? 'ti-star-filled filled' : 'ti-star'}`} />
                              </span>
                              <div className="strike-info">
                                <h4 className="fs-14 text-truncate">{task.title}</h4>
                              </div>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex align-items-center justify-content-md-end flex-wrap row-gap-3">
                              <span className={`badge d-inline-flex align-items-center me-2 ${getStatusBadgeClass(task.status)}`}>
                                <i className="fas fa-circle fs-6 me-1" />
                                {task.status}
                              </span>
                              <div className="d-flex align-items-center">
                                <div className="avatar-list-stacked avatar-group-sm">
                                  {task.avatars.slice(0, 3).map((member) => (
                                    <span key={member._id} className="avatar avatar-rounded">
                                      {member.avatar ? (
                                        <img className="border border-white" src={member.avatar || "assets/img/profiles/avatar-31.jpg"} alt="member" />
                                      ) : (
                                        <span className="avatar bg-secondary avatar-rounded text-white">U</span>
                                      )}
                                    </span>
                                  ))}
                                  {task.avatars.length > 3 && (
                                    <span className="avatar bg-primary avatar-rounded text-fixed-white fs-12 fw-medium">
                                      +{task.avatars.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-5 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <h5>Performance</h5>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="btn btn-white border btn-sm d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1" />
                        {filters.performance}
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        {yearOptions.map((year) => (
                          <li key={year}>
                            <Link
                              to="#"
                              className="dropdown-item rounded-1"
                              onClick={() => handleYearChange('performance', year)}
                            >
                              {year}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div>
                    <div className="bg-light d-flex align-items-center rounded p-2">
                      <h3 className="me-2">98%</h3>
                      <span className="badge badge-outline-success bg-success-transparent rounded-pill me-1">
                        12%
                      </span>
                      <span>vs last years</span>
                    </div>
                    {performance_chart2_series.length === months.length && performance_chart2_series.length > 0 ? (
                      <ReactApexChart
                        options={{
                          ...performance_chart2_options,
                          xaxis: { ...performance_chart2_options.xaxis, categories: months }
                        }}
                        series={[{ name: "Monthly Salary", data: performance_chart2_series }]}
                        type="area"
                        height={288}
                      />
                    ) : (
                      <div>Loading performance...</div>
                    )}

                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <h5>My Skills</h5>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="btn btn-white border btn-sm d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1" />
                        {filters.skills}
                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        {yearOptions.map((year) => (
                          <li key={year}>
                            <Link
                              to="#"
                              className="dropdown-item rounded-1"
                              onClick={() => handleYearChange('skills', year)}
                            >
                              {year}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div>
                    {dashboardData?.skills?.length === 0 && (
                      <div className="text-muted text-center">No skills available.</div>
                    )}
                    {dashboardData?.skills?.map((skill, idx) => {
                      const borderColors = [
                        "border-primary",
                        "border-success",
                        "border-purple",
                        "border-info",
                        "border-dark",
                      ];
                      const colorClass = borderColors[idx % borderColors.length];
                      const dateObj = new Date(skill.updatedAt);
                      const formattedDate =
                        dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                      return (
                        <div
                          key={skill.name}
                          className="border border-dashed bg-transparent-light rounded p-2 mb-2"
                        >
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              <span
                                className={`d-block border border-2 h-12 ${colorClass} border-red rounded-5 me-2`}
                                style={{ width: 2, minWidth: 2, height: 10 }}
                              />
                              <div>
                                <h6 className="fw-medium mb-1">{skill.name}</h6>
                                <p>
                                  Updated : {formattedDate}
                                </p>
                              </div>
                            </div>
                            <CircleProgressSmall value={skill.proficiency} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 d-flex">
              <div className="flex-fill">
                <div className="card card-bg-5 bg-dark mb-3">
                  <div className="card-body">
                    <div className="text-center">
                      <h5 className="text-white mb-4">Team Birthday</h5>
                      {dashboardData?.birthdays && dashboardData?.birthdays.length > 0 ? (
                        dashboardData?.birthdays.map(birthday => (
                          <div key={birthday._id} className="mb-4">
                            <span className="avatar avatar-xl avatar-rounded mb-2">
                              <ImageWithBasePath
                                src={birthday.avatarUrl || "assets/img/users/default-avatar.jpg"}
                                alt={birthday.name}
                              />
                            </span>
                            <div className="mb-3">
                              <h6 className="text-white fw-medium mb-1">
                                {birthday.name}
                              </h6>
                              <p>{birthday.role || "—"}</p>
                            </div>
                            <Link to="#" className="btn btn-sm btn-primary">
                              Send Wishes
                            </Link>
                          </div>
                        ))
                      ) : (
                        <div className="text-white-50">No team birthdays today.</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card bg-secondary mb-3">
                  <div className="card-body d-flex align-items-center justify-content-between p-3">
                    <div>
                      <h5 className="text-white mb-1">Leave Policy</h5>
                      <p className="text-white">Last Updated : Today</p>
                    </div>
                    <Link to="#" className="btn btn-white btn-sm px-3">
                      View All
                    </Link>
                  </div>
                </div>
                <div className="card bg-warning">
                  <div className="card-body d-flex align-items-center justify-content-between p-3">
                    <div>
                      <h5 className="mb-1">Next Holiday</h5>
                      <p className="text-gray-9">Diwali, 15 Sep 2025</p>
                    </div>
                    <Link
                      to="holidays.html"
                      className="btn btn-white btn-sm px-3"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <h5>Team Members</h5>
                    <div>
                      <Link to="#" className="btn btn-light btn-sm">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {dashboardData?.teamMembers?.length === 0 && (
                    <p className="text-muted text-center">No team members available.</p>
                  )}

                  {dashboardData?.teamMembers?.map((member) => (
                    <div
                      className="d-flex align-items-center justify-content-between mb-4"
                      key={member._id}
                    >
                      <div className="d-flex align-items-center">
                        <Link to="#" className="avatar flex-shrink-0">
                          <ImageWithBasePath
                            src={member.avatar || "assets/img/profiles/avatar-31.jpg"}
                            className="rounded-circle border border-2"
                            alt={`${member.name}'s avatar`}
                          />
                        </Link>
                        <div className="ms-2">
                          <h6 className="fs-14 fw-medium text-truncate mb-1">
                            <Link to="#">{member.name}</Link>
                          </h6>
                          <p className="fs-13">{member.role}</p>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <Link
                          to="#"
                          className="btn btn-light btn-icon btn-sm me-2"
                          title="Call"
                        >
                          <i className="ti ti-phone fs-16" />
                        </Link>
                        <Link
                          to="#"
                          className="btn btn-light btn-icon btn-sm me-2"
                          title="Mail"
                        >
                          <i className="ti ti-mail-bolt fs-16" />
                        </Link>
                        <Link
                          to="#"
                          className="btn btn-light btn-icon btn-sm"
                          title="Chat"
                        >
                          <i className="ti ti-brand-hipchat fs-16" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap">
                    <h5>Notifications</h5>
                    <div>
                      <Link to="#" className="btn btn-light btn-sm">
                        View All
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  {dashboardData?.notifications?.length === 0 && (
                    <p className="text-muted text-center">No new notifications</p>
                  )}
                  {dashboardData?.notifications?.map((notification) => (
                    <div className="d-flex align-items-start mb-4" key={notification._id}>
                      <Link to="#" className="avatar flex-shrink-0">
                        <ImageWithBasePath
                          src={notification.avatar || "assets/img/profiles/avatar-31.jpg"}
                          className="rounded-circle border border-2"
                          alt="Avatar"
                        />
                      </Link>
                      <div className="ms-2">
                        <h6 className="fs-14 fw-medium text-truncate mb-1">
                          {notification.title}
                        </h6>
                        <p className="fs-13 mb-0">
                          {new Date(notification.createdAt).toLocaleString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header">
                  <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-2">
                    <h5>Meetings Schedule</h5>
                    <div className="dropdown">
                      <Link
                        to="#"
                        className="btn btn-white border btn-sm d-inline-flex align-items-center"
                        data-bs-toggle="dropdown"
                      >
                        <i className="ti ti-calendar me-1" />
                        <span>
                          {filters.meetings === "today"
                            ? "Today"
                            : filters.meetings === "month"
                              ? "This Month"
                              : "This Year"}
                        </span>

                      </Link>
                      <ul className="dropdown-menu  dropdown-menu-end p-3">
                        <li>
                          <Link to="#" className="dropdown-item rounded-1"
                            onClick={() => handleMeetingFilterChange("today")}>
                            Today
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1"
                            onClick={() => handleMeetingFilterChange("month")}>
                            This Month
                          </Link>
                        </li>
                        <li>
                          <Link to="#" className="dropdown-item rounded-1"
                            onClick={() => handleMeetingFilterChange("year")}>
                            This Year
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body schedule-timeline">
                  {dashboardData?.meetings?.length === 0 && (
                    <div className="text-muted text-center">No meetings scheduled.</div>
                  )}
                  {dashboardData?.meetings?.map((meeting) => {
                    let colorClass = "text-primary";
                    switch ((meeting.tag || "").toLowerCase()) {
                      case "review":
                        colorClass = "text-secondary"; break;
                      case "celebration":
                        colorClass = "text-warning"; break;
                      case "development":
                        colorClass = "text-success"; break;
                      default:
                        colorClass = "text-primary";
                    }
                    return (
                      <div className="d-flex align-items-start" key={meeting._id}>
                        <div className="d-flex align-items-center active-time">
                          <span>
                            {new Date(meeting.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>
                            <i className={`ti ti-point-filled ${colorClass} fs-20`} />
                          </span>
                        </div>
                        <div className="flex-fill ps-3 pb-4 timeline-flow">
                          <div className="bg-light p-2 rounded">
                            <p className="fw-medium text-gray-9 mb-1">{meeting.title}</p>
                            <span>{meeting.tag}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
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
      <RequestModals socket={socket} onLeaveRequestCreated={() => {
        // Refresh dashboard data when a leave request is created
        if (socket) {
          socket.emit("employee/dashboard/get-all-data");
        }
      }} />
    </>
  );
};

export default EmployeeDashboard;
