
import { subscription_details } from "../../../core/data/json/subscriptiondetails";

import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import { all_routes } from "../../router/all_routes";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import ReactApexChart from "react-apexcharts";
import PredefinedDateRanges from "../../../core/common/datePicker";
import Table from "../../../core/common/dataTable/index";

const Subscription = () => {
  const [socket, setSocket] = useState<any>(null);
  const [totalTransaction, setTotalTransaction] = useState<any>({
    series: [{ name: "", data: [] }],
    xaxis: { categories: [] },
  });
  const [totalSubscription, setTotalSubscription] = useState<any>({
    series: [{ name: "", data: [] }],
    xaxis: { categories: [] },
  });
  const [activeSubscription, setActiveSubscription] = useState<any>({
    series: [{ name: "", data: [] }],
    xaxis: { categories: [] },
  });
  const [expiredSubscription, setExpiredSubscription] = useState<any>({
    series: [{ name: "", data: [] }],
    xaxis: { categories: [] },
  });
  const [subscriptionList, setSubscriptionList] = useState<any[]>([]);

  const chartOptions = {
    fill: { type: "solid", opacity: 1 },
    chart: {
      foreColor: "#fff",
      type: "area",
      width: 80,
      toolbar: { show: false },
      zoom: { enabled: false },
      dropShadow: {
        enabled: 0,
        top: 3,
        left: 14,
        blur: 4,
        opacity: 0.12,
        color: "#fff",
      },
      sparkline: { enabled: true },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 0,
      hover: { size: 7 },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "35%", endingShape: "rounded" },
    },
    dataLabels: { enabled: false },
    stroke: { width: 0, curve: "monotoneCubic" },
    tooltip: {
      theme: "dark",
      fixed: { enabled: false },
      x: { show: false },
      marker: { show: false },
    },
  };

  const columns = [
    {
      title: "Company Name",
      dataIndex: "CompanyName",
      render: (text: String, record: any) => (
        <div className="d-flex align-items-center file-name-icon">
          <Link to="#" className="avatar avatar-md border rounded-circle">
            <ImageWithBasePath
              src={`assets/img/company/${record.Image}`}
              className="img-fluid"
              alt="img"
            />
          </Link>
          <div className="ms-2">
            <h6 className="fw-medium">
              <Link to="#">{record.CompanyName}</Link>
            </h6>
          </div>
        </div>
      ),
      sorter: (a: any, b: any) => a.CompanyName.length - b.CompanyName.length,
    },
    {
      title: "Plan",
      dataIndex: "Plan",
      sorter: (a: any, b: any) => a.Plan.length - b.Plan.length,
    },
    {
      title: "Billing Cycle",
      dataIndex: "BillCycle",
      render: (text: String, record: any) => (
        <span>{record.BillCycle} Days</span>
      ),
      sorter: (a: any, b: any) => a.BillCycle.length - b.BillCycle.length,
    },
    {
      title: "Amount",
      dataIndex: "Amount",
      sorter: (a: any, b: any) => a.Amount.length - b.Amount.length,
    },
    {
      title: "Created Date",
      dataIndex: "CreatedDate",
      sorter: (a: any, b: any) => a.CreatedDate.length - b.CreatedDate.length,
    },
    {
      title: "Expired On",
      dataIndex: "ExpiringDate",
      sorter: (a: any, b: any) => a.ExpiringDate.length - b.ExpiringDate.length,
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: any) => (
        <span
          className={`badge ${
            text === "Paid" ? "badge-success" : "badge-danger"
          } d-inline-flex align-items-center badge-xs`}
        >
          <i className="ti ti-point-filled me-1" />
          {text}
        </span>
      ),
      sorter: (a: any, b: any) => a.Status.length - b.Status.length,
    },
    {
      title: "",
      dataIndex: "actions",
      render: () => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#view_invoice"
          >
            <i className="ti ti-file-invoice" />
          </Link>
          <Link to="#" className="me-2">
            <i className="ti ti-download" />
          </Link>
          <Link to="#" data-bs-toggle="modal" data-bs-target="#delete_modal">
            <i className="ti ti-trash" />
          </Link>
        </div>
      ),
    },
  ];

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketIo = io("http://localhost:3000"); // Replace with your server URL
    setSocket(socketIo);

    // Request data from server
    socketIo.emit("superadmin/subscriptions/totalTransactions");
    socketIo.emit("superadmin/subscriptions/totalSubscriptions");
    socketIo.emit("superadmin/subscriptions/activeSubscriptions");
    socketIo.emit("superadmin/subscriptions/expiredSubscriptions");
    socketIo.emit("superadmin/subscriptions/list");

    // Listen for responses
    socketIo.on("superadmin/subscriptions/totalTransactionsResponse", (data) => {
      if (data.error) {
        console.error("Total Transactions Error:", data.error);
        return;
      }
      setTotalTransaction({
        ...chartOptions,
        series: [{ name: "", data: data.series }],
        xaxis: { categories: data.categories },
        colors: ["#F7A37A"],
        markers: { ...chartOptions.markers, colors: ["#F7A37A"] },
      });
    });

    socketIo.on("superadmin/subscriptions/totalSubscriptionsResponse", (data) => {
      if (data.error) {
        console.error("Total Subscriptions Error:", data.error);
        return;
      }
      setTotalSubscription({
        ...chartOptions,
        series: [{ name: "", data: data.series }],
        xaxis: { categories: data.categories },
        colors: ["#70B1FF"],
        markers: { ...chartOptions.markers, colors: ["#70B1FF"] },
      });
    });

    socketIo.on("superadmin/subscriptions/activeSubscriptionsResponse", (data) => {
      if (data.error) {
        console.error("Active Subscriptions Error:", data.error);
        return;
      }
      setActiveSubscription({
        ...chartOptions,
        series: [{ name: "", data: data.series }],
        xaxis: { categories: data.categories },
        colors: ["#60DD97"],
        markers: { ...chartOptions.markers, colors: ["#60DD97"] },
      });
    });

    socketIo.on("superadmin/subscriptions/expiredSubscriptionsResponse", (data) => {
      if (data.error) {
        console.error("Expired Subscriptions Error:", data.error);
        return;
      }
      setExpiredSubscription({
        ...chartOptions,
        series: [{ name: "", data: data.series }],
        xaxis: { categories: data.categories },
        colors: ["#DE5555"],
        markers: { ...chartOptions.markers, colors: ["#DE5555"] },
      });
    });

    socketIo.on("superadmin/subscriptions/listResponse", (data) => {
      if (data.error) {
        console.error("Subscription List Error:", data.error);
        return;
      }
      setSubscriptionList(data);
    });

    // Cleanup on unmount
    return () => {
      socketIo.disconnect();
    };
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumb */}
        <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
          <div className="my-auto mb-2">
            <h2 className="mb-1">Subscription</h2>
            <nav>
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to={all_routes.adminDashboard}>
                    <i className="ti ti-smart-home" />
                  </Link>
                </li>
                <li className="breadcrumb-item">Superadmin</li>
                <li className="breadcrumb-item active" aria-current="page">
                  Subscription
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex my-xl-auto right-content align-items-center flex-wrap">
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
                    <Link to="#" className="dropdown-item rounded-1">
                      <i className="ti ti-file-type-pdf me-1" />
                      Export as PDF
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      <i className="ti ti-file-type-xls me-1" />
                      Export as Excel
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="head-icons">
              <CollapseHeader />
            </div>
          </div>
        </div>
        {/* /Breadcrumb */}
        <div className="row">
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <div className="border-bottom pb-3 mb-3">
                  <div className="row align-items-center">
                    <div className="col-7">
                      <div>
                        <span className="fs-14 fw-normal text-truncate mb-1">
                          Total Transaction
                        </span>
                        <h5>$5,340</h5>
                      </div>
                    </div>
                    <div className="col-5">
                      <ReactApexChart
                        options={totalTransaction}
                        series={totalTransaction.series}
                        type="area"
                        width={60}
                        height={35}
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex">
                  <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                    <span className="text-primary fs-12 d-flex align-items-center me-1">
                      <i className="ti ti-arrow-wave-right-up me-1" />
                      +19.01%
                    </span>
                    from last week
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <div className="border-bottom pb-3 mb-3">
                  <div className="row align-items-center">
                    <div className="col-7">
                      <div>
                        <span className="fs-14 fw-normal text-truncate mb-1">
                          Total Subscribers
                        </span>
                        <h5>600</h5>
                      </div>
                    </div>
                    <div className="col-5">
                      <ReactApexChart
                        options={totalSubscription}
                        series={totalSubscription.series}
                        type="area"
                        width={60}
                        height={35}
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex">
                  <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                    <span className="text-primary fs-12 d-flex align-items-center me-1">
                      <i className="ti ti-arrow-wave-right-up me-1" />
                      +19.01%
                    </span>
                    from last week
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <div className="border-bottom pb-3 mb-3">
                  <div className="row align-items-center">
                    <div className="col-7">
                      <div>
                        <span className="fs-14 fw-normal text-truncate mb-1">
                          Active Subscribers
                        </span>
                        <h5>560</h5>
                      </div>
                    </div>
                    <div className="col-5">
                      <ReactApexChart
                        options={activeSubscription}
                        series={activeSubscription.series}
                        type="area"
                        width={60}
                        height={35}
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex">
                  <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                    <span className="text-primary fs-12 d-flex align-items-center me-1">
                      <i className="ti ti-arrow-wave-right-up me-1" />
                      +19.01%
                    </span>
                    from last week
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-md-6 d-flex">
            <div className="card flex-fill">
              <div className="card-body">
                <div className="border-bottom pb-3 mb-3">
                  <div className="row align-items-center">
                    <div className="col-7">
                      <div>
                        <span className="fs-14 fw-normal text-truncate mb-1">
                          Expired Subscribers
                        </span>
                        <h5>40</h5>
                      </div>
                    </div>
                    <div className="col-5">
                      <ReactApexChart
                        options={expiredSubscription}
                        series={expiredSubscription.series}
                        type="area"
                        width={60}
                        height={35}
                      />
                    </div>
                  </div>
                </div>
                <div className="d-flex">
                  <p className="fs-12 fw-normal d-flex align-items-center text-truncate">
                    <span className="text-primary fs-12 d-flex align-items-center me-1">
                      <i className="ti ti-arrow-wave-right-up me-1" />
                      +19.01%
                    </span>
                    from last week
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h5>Subscription List</h5>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div className="me-3">
                <div className="input-icon-end position-relative">
                  <PredefinedDateRanges />
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
                  Select Plan
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Advanced (Monthly)
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Basic (Yearly)
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Enterprise (Monthly)
                    </Link>
                  </li>
                </ul>
              </div>
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
                    <Link to="#" className="dropdown-item rounded-1">
                      Paid
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Unpaid
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
                  Sort By : Last 7 Days
                </Link>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Recently Added
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Ascending
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Descending
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Last Month
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="dropdown-item rounded-1">
                      Last 7 Days
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <Table dataSource={subscriptionList} columns={columns} Selection={true} />
          </div>
        </div>
      </div>
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0">2014 - 2025 © SmartHR.</p>
        <p>
          Designed & Developed By{" "}
          <Link to="#" className="text-primary">
            Dreams
          </Link>
        </p>
      </div>
      {/* View Invoice */}
      <div className="modal fade" id="view_invoice">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-body p-5">
              <div className="row justify-content-between align-items-center mb-3">
                <div className="col-md-6">
                  <div className="mb-4">
                    <ImageWithBasePath
                      src="assets/img/logo.svg"
                      className="img-fluid"
                      alt="logo"
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-end mb-3">
                    <h5 className="text-dark mb-1">Invoice</h5>
                    <p className="mb-1 fw-normal">
                      <i className="ti ti-file-invoice me-1" />
                      INV0287
                    </p>
                    <p className="mb-1 fw-normal">
                      <i className="ti ti-calendar-check me-1" />
                      Issue date: 12 Sep 2025
                    </p>
                    <p className="fw-normal">
                      <i className="ti ti-calendar-x me-1" />
                      Due date: 12 Oct 2025
                    </p>
                  </div>
                </div>
              </div>
              <div className="row mb-3 d-flex justify-content-between">
                <div className="col-md-7">
                  <p className="text-dark mb-2 fw-medium fs-16">
                    Invoice From:
                  </p>
                  <div>
                    <p className="mb-1">SmartHR</p>
                    <p className="mb-1">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1">smarthr@example.com</p>
                  </div>
                </div>
                <div className="col-md-5">
                  <p className="text-dark mb-2 fw-medium fs-16">Invoice To:</p>
                  <div>
                    <p className="mb-1">BrightWave Solutions</p>
                    <p className="mb-1">
                      367 Hillcrest Lane, Irvine, California, United States
                    </p>
                    <p className="mb-1">michael@brightwave.io</p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th>Plan</th>
                        <th>Billing Cycle</th>
                        <th>Created Date</th>
                        <th>Expiry Date</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Advanced (Monthly)</td>
                        <td>30 days</td>
                        <td>12 Sep 2025</td>
                        <td>12 Oct 2025</td>
                        <td>$200.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="row mb-3 d-flex justify-content-between">
                <div className="col-md-4">
                  <div className="d-flex justify-content-between align-items-center pe-3">
                    <p className="text-dark fw-medium mb-0">Subtotal</p>
                    <p className="mb-2">$200.00</p>
                  </div>
                  <div className="d-flex align-items-center">
                    <p className="text-dark fw-medium mb-0">Tax</p>
                    <div className="ms-auto">
                      <p className="mb-2">$0.00</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <p className="text-dark fw-medium mb-0">Total</p>
                    <div className="ms-auto">
                      <p className="text-dark fw-medium mb-2">$200.00</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card border mb-0">
                <div className="card-body">
                  <p className="text-dark fw-medium mb-2">
                    Terms & Conditions
                  </p>
                  <p className="fs-12 fw-normal d-flex align-items-baseline mb-2">
                    <i className="ti ti-circle-check-filled text-primary me-1"></i>
                    All payments must be made promptly according to the agreed schedule.
                    Late payments may result in additional fees or service suspension.
                  </p>
                  <p className="fs-12 fw-normal d-flex align-items-baseline">
                    <i className="ti ti-circle-check-filled text-primary me-1"></i>
                    We are not liable for any indirect, incidental, or consequential damages, including but not limited to profits, revenue, or data loss.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /View Invoice */}
    </div>
  );
};

export default Subscription;

      