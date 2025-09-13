// notes.tsx

import React, { useState, useEffect, FormEvent } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import NotesModal from "./notesModal";
import { all_routes } from "../router/all_routes";
import CommonSelect from "../../core/common/commonSelect";
import CollapseHeader from "../../core/common/collapse-header/collapse-header";
import ImageWithBasePath from "../../core/common/imageWithBasePath";
import { DatePicker } from "antd";
import CommonTagsInput from "../../core/common/Taginput";
import CommonTextEditor from "../../core/common/textEditor";
import { useSocket } from "../../SocketContext";
import { Socket } from "socket.io-client";
import dayjs from 'dayjs';
import Select from "react-select";
import { getStatusClassNames } from "antd/es/_util/statusUtils";

interface Note {
  _id: string;
  title: string;
  tag: string[];
  priority: string;
  dueDate: string;
  isStarred: boolean;
  description: string;
}

const optionsSelect = [
  { value: "starrred", label: "Star" },
  { value: "notStarred", label: "Not-Star" },
];
const optionsPriority = [
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

type TagOption = {
  value: string;
  label: string;
};

type FilterState = {
  tab: "all" | "important" | "trash";
  tags: string[];
  priority: "Low" | "Medium" | "High" | "";
  sort: "Recent" | "Last Modified";
};

const predefinedTags: TagOption[] = [
  { value: "urgent", label: "Urgent" },
  { value: "followup", label: "Follow Up" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];
const Notes = () => {
  const routes = all_routes;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteToToggleStar, setNoteToTogglestar] = useState<Note | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [selectedTags, setSelectedTags] = useState<("Urgent" | "Followup" | "Pending" | "Completed")[]>([]);
  const [tags, setTags] = useState<TagOption[]>(
    editingNote?.tag?.map(tagValue => {
      const existing = predefinedTags.find(t => t.value === tagValue);
      return existing || { value: tagValue, label: tagValue }; // handle custom tags too
    }) || []
  );
  const [formData, setFormData] = useState<{
    title: string;
    tag: string[];
    priority: string;
    dueDate: string;
    status: string;
    description: string;
  }>({
    title: "",
    tag: [],
    priority: "",
    dueDate: "",
    status: "",
    description: "",
  });

  const [filters, setFilters] = useState<FilterState>({
    tab: "all",
    tags: [],
    priority: "",
    sort: "Recent",
  });

  const socket = useSocket() as Socket | null;

  useEffect(() => {
    if (!socket) return;

    let isMounted = true;

    setLoading(true);

    const timeoutId = setTimeout(() => {
      if (loading && isMounted) {
        console.warn("Employees loading timeout - showing fallback");
        setError("Employees loading timed out. Please refresh the page.");
        setLoading(false);
      }
    }, 30000);

    socket.emit("employees/notes/get", filters);

    const handleNoteResponse = (response: any) => {
      if (!isMounted) return;
      if (response.done) {
        if (Array.isArray(response.data)) {
          setNotes(response.data);
        }
        setError(null);
      } else {
        setError(response.message || response.error || "Failed to fetch notes");
      }
      setLoading(false);
    };

    const handleAddNoteResponse = (response: any) => {
      if (!isMounted) return;
      console.log(response);
      if (response.done) {
        console.log(response);
        if (socket) {
          socket.emit("employees/notes/get");
        }
        setError(null);
        setLoading(false);
      } else {
        setError(response.message || response.error || "Failed to add note");
        setLoading(false);
      }
    }

    const handleDeleteNoteResponse = (response: any) => {
      if (!isMounted) return;
      if (response.done) {
        if (socket) {
          socket.emit("employees/notes/get");
        }
        setError(null);
        setLoading(false);
      } else {
        console.log(response);

        setError(response.message || response.error || "Failed to delete notes");
        setLoading(false);
      }
    }

    const handleEditNoteResponse = (response: any) => {
      if (!isMounted) return;
      if (response.done) {
        // toast.success("Employee updated successfully!");
        // Optionally refresh employee list
        if (socket) {
          socket.emit("employees/notes/get");
        }
        setEditingNote(null); // Close modal or reset editing state
        setError(null);
      } else {
        // toast.error(response.error || "Failed to update employee.");
        setError(response.message || response.error || "Failed to update employee.");
      }
      setLoading(false);
    }

    const handleToggleStarResponse = (response: any) => {
      if (!isMounted) return;

      if (response.done) {
        if (socket) {
          socket.emit("employees/notes/get", filters);
        }
        setError(null);
      } else {
        setError(response.message || response.error || "Failed to update note importance.");
      }
      setLoading(false);
    };


    socket.on("employees/notes/get-response", handleNoteResponse);
    socket.on("employees/notes/add-response", handleAddNoteResponse);
    socket.on("employees/notes/trash-response", handleDeleteNoteResponse);
    socket.on("employees/notes/edit-response", handleEditNoteResponse);
    socket.on("employees/notes/star-response", handleToggleStarResponse);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      socket.off("employees/notes/get-response", handleNoteResponse);
      socket.off("employees/notes/add-response", handleAddNoteResponse);
      socket.off("employees/notes/trash-response", handleDeleteNoteResponse);
      socket.off("employees/notes/edit-response", handleEditNoteResponse);
      socket.on("employees/notes/star-response", handleToggleStarResponse);

    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const optionsChoose = [
    { value: "Bulk Actions", label: "Bulk Actions" },
    { value: "Delete Marked", label: "Delete Marked" },
    { value: "Unmark All", label: "Unmark All" },
    { value: "Mark All", label: "Mark All" },
  ];
  const recentChoose = [
    { value: "Recent", label: "Recent" },
    { value: "Last Modified", label: "Last Modified" },
    // { value: "Last Modified by me", label: "Last Modified by me" }
  ];

  const settings = {
    dots: false,
    autoplay: false,
    slidesToShow: 3,
    margin: 24,
    speed: 500,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 800,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 776,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 567,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };
  // helper functions

  console.log("Notes", notes);
  if (error) console.error(error);

  // For tab buttons: All / Important / Trash
  const handleTabChange = (tab: FilterState["tab"]) => {
    setFilters((prev) => ({ ...prev, tab }));
    fetchFilteredNotes({ ...filters, tab });
  };

  // For tag buttons
  const handleTagToggle = (tag: string) => {
    setFilters((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      fetchFilteredNotes({ ...prev, tags: newTags });
      return { ...prev, tags: newTags };
    });
  };

  // For priority buttons
  const handlePriorityToggle = (priority: FilterState["priority"]) => {
    setFilters((prev) => {
      const newPriority = prev.priority === priority ? "" : priority;
      fetchFilteredNotes({ ...prev, priority: newPriority });
      return { ...prev, priority: newPriority };
    });
  };

  // For dropdown: Recent / Last Modified
  const handleSortChange = (sort: FilterState["sort"]) => {
    setFilters((prev) => ({ ...prev, sort }));
    fetchFilteredNotes({ ...filters, sort });
  };

  const fetchFilteredNotes = async (appliedFilters: FilterState) => {
    try {
      const payload = {
        tab: appliedFilters.tab,
        tags: appliedFilters.tags,
        priority: appliedFilters.priority,
        sort: appliedFilters.sort,
      };
      console.log("filters from tsx", payload);

      if (socket) {
        socket.emit("employees/notes/get", payload);
      }
    } catch (error) {
      console.error("Failed to fetch filtered notes:", error);
    }
  };



  const toggleStarNote = (note: Note) => {
    if (!note._id) {
      console.warn("No noteId found, cannot update");
      return;
    }

    // Prepare updated note data
    const updatedNote = {
      noteId: note._id,
    };

    // Emit to socket for backend update
    if (socket) {
      socket.emit("employees/notes/star", updatedNote);
    }
  };

  const handleEditTag = (selectedOptions: readonly TagOption[] | null) => {
    const newTags = selectedOptions ? [...selectedOptions] : [];
    setTags(newTags);
    setEditingNote(prev =>
      prev ? { ...prev, tag: newTags.map(tag => tag.value) } : prev
    );
  };

  const handleUpdateSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!editingNote || !editingNote._id) {
      console.warn("No noteId found, cannot update");
      return;
    }

    // Prepare payload for backend
    const payload = {
      noteId: editingNote._id,
      title: editingNote.title,
      tag: editingNote.tag || [],
      priority: editingNote.priority,
      dueDate: editingNote.dueDate,
      description: editingNote.description,
      isStarred: editingNote.isStarred,
    };

    console.log("Updating note with:", payload);

    if (socket) {
      socket.emit("employees/notes/edit", payload);
    }

    // Close modal + reset editing state
    setEditingNote(null);
  };

  const getStatusClass = (status: string) => {
    if (!status) return "border rounded text-secondary";

    switch (status.trim().toLowerCase()) {
      case "medium":
      case "followup":
        return "border-warning text-warning rounded";

      case "low":
      case "completed":
        return "border-success text-success rounded";

      case "high":
      case "urgent":
        return "border-danger text-danger rounded";

      default:
        return "border-info text-info rounded"; // 🔹 default blue
    }
  };

  const deleteNote = (id: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!socket) {
        setError("Socket connection is not available");
        setLoading(false);
        return;
      }

      if (!id) {
        setError("Employee ID is required");
        setLoading(false);
        return;
      }
      console.log(id);

      socket.emit("employees/notes/trash", { noteId: id });
    } catch (error) {
      console.error("Delete error:", error);
      setError("Failed to initiate policy deletion");
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  interface OptionType {
    value: string;
    label: string;
  }
  // Handle select changes
  const handleSelectChange = (name: string, selectedOption: OptionType | null) => {
    setFormData({
      ...formData,
      [name]: selectedOption?.value || ""
    });
  };

  const handleTagChange = (selectedOptions: readonly TagOption[] | null) => {
    const newTags = selectedOptions ? [...selectedOptions] : [];
    setTags(newTags);
    setFormData(prev => ({
      ...prev,
      tag: newTags.map(tag => tag.value),
    }));
  };

  // Handle date changes
  const handleDateChange = (date: dayjs.Dayjs | null, dateString: string) => {
    setFormData({
      ...formData,
      dueDate: dateString
    });
  };

  // Handle editor content changes
  const handleEditorChange = (content: string) => {
    setFormData({
      ...formData,
      description: content
    });
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Here you would typically send the data to an API
    console.log("Form submitted with data:", formData);

    if (socket) {
      socket.emit("employees/notes/add", formData);
    }

    // Reset form after submission
    setFormData({
      title: "",
      // assignee: "",
      tag: [],
      priority: "High",
      dueDate: "",
      status: "starred",
      description: "",
    });
    setTags([]);
  }
  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ height: "400px" }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error!</h4>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <>
        {/* Page wrapper */}
        <div className="page-wrapper">
          <div className="content pb-4">
            {/* Breadcrumb */}
            <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
              <div className="my-auto mb-2">
                <h2 className="mb-1">Notes</h2>
                <nav>
                  <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item">
                      <Link to={routes.adminDashboard}>
                        <i className="ti ti-smart-home" />
                      </Link>
                    </li>
                    <li className="breadcrumb-item">Application</li>
                    <li className="breadcrumb-item active" aria-current="page">
                      Notes
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
                      <i className="ti ti-file-export me-2" />
                      Export
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
                          <i className="ti ti-file-type-pdf me-1" />
                          Export as PDF
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                        >
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
                    className="btn btn-primary d-flex align-items-center"
                    data-bs-toggle="modal" data-inert={true}
                    data-bs-target="#add_note"
                  >
                    <i className="ti ti-circle-plus me-2" />
                    Add Notes
                  </Link>
                </div>
                <div className="ms-2 head-icons">
                  <CollapseHeader />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget">
                <div className="border rounded-3 bg-white p-3">
                  <div className="mb-3 pb-3 border-bottom">
                    <h4 className="d-flex align-items-center">
                      <i className="ti ti-file-text me-2" />
                      Notes List
                    </h4>
                  </div>
                  <div className="border-bottom pb-3 ">
                    <div
                      className="nav flex-column nav-pills"
                      id="v-pills-tab"
                      role="tablist"
                      aria-orientation="vertical"
                    >
                      {[
                        { id: "all" as const, icon: "ti ti-inbox", label: "All Notes" },
                        { id: "important" as const, icon: "ti ti-star", label: "Important" },
                        { id: "trash" as const, icon: "ti ti-trash", label: "Trash" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          className={`d-flex text-start align-items-center fw-medium fs-15 nav-link mb-1 ${selectedTab === tab.id ? "active" : ""}`}
                          id={`v-pills-${tab.id}-tab`}
                          data-bs-toggle="pill"
                          data-bs-target={`#v-pills-${tab.id}`}
                          type="button"
                          role="tab"
                          aria-controls={`v-pills-${tab.id}`}
                          aria-selected={selectedTab === tab.id ? "true" : "false"}
                          onClick={() => handleTabChange(tab.id)}
                        >
                          <i className={`${tab.icon} me-2`} />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    {/* Tags Filter */}
                    <div className="border-bottom px-2 pb-3 mb-3">
                      <h5 className="mb-2">Tags</h5>
                      <div className="d-flex flex-column mt-2">
                        {["Urgent", "Followup", "Pending", "Completed"].map((tag) => (
                          <Link
                            to="#"
                            key={tag}
                            className={`mb-2  ${getStatusClass(tag as "Urgent" | "Followup" | "Pending" | "Completed")} ${filters.tags.includes(tag as "Urgent" | "Followup" | "Pending" | "Completed") ? "text-primary" : ""}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const updatedTags = selectedTags.includes(tag as "Urgent" | "Followup" | "Pending" | "Completed")
                                ? selectedTags.filter((t) => t !== (tag as "Urgent" | "Followup" | "Pending" | "Completed"))
                                : [...selectedTags, tag as "Urgent" | "Followup" | "Pending" | "Completed"];
                              setSelectedTags(updatedTags);

                              // Send updated filters to backend
                              fetchFilteredNotes({ ...filters, tags: updatedTags });
                            }}
                          >
                            <span className={`me-2 ${getStatusClass(tag as "Urgent" | "Followup" | "Pending" | "Completed")}`}>
                              <i className="fas fa-square square-rotate fs-10" />
                            </span>
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Priority Filter */}
                    <div className="px-2">
                      <h5 className="mb-2">Priority</h5>
                      <div className="d-flex flex-column mt-2">
                        {["Medium", "High", "Low"].map((priority) => (
                          <Link
                            to="#"
                            key={priority}
                            className={`mb-2  ${getStatusClass(priority)} ${filters.priority === priority ? "text-primary" : ""}`}
                            onClick={(e) => {
                              e.preventDefault();

                              const updatedPriority: "" | "High" | "Medium" | "Low" =
                                filters.priority === priority ? "" : (priority as "High" | "Medium" | "Low");

                              setFilters({ ...filters, priority: updatedPriority });
                              fetchFilteredNotes({ ...filters, priority: updatedPriority });
                            }}
                          >
                            <span className={`${getStatusClass(priority)} me-2`}>
                              <i className="fas fa-square square-rotate fs-10" />
                            </span>
                            {priority}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-9 budget-role-notes">
                <div className="bg-white rounded-3 d-flex align-items-center justify-content-between flex-wrap mb-4 p-3 pb-0">
                  {/* <div className="d-flex align-items-center mb-3">
                    <div className="me-3">
                      <CommonSelect
                        className="select"
                        options={optionsChoose}
                        defaultValue={optionsChoose[0]}
                      />
                    </div>
                    <Link to="#" className="btn btn-light">
                      Apply
                    </Link>
                  </div> */}
                  <div className="form-sort mb-3">
                    <i className="ti ti-filter feather-filter info-img" />
                    <CommonSelect
                      className="select"
                      options={[
                        { value: "Recent", label: "Recent" },
                        { value: "Last Modified", label: "Last Modified" },
                      ]}
                      defaultValue={{ value: filters.sort, label: filters.sort }}
                      onChange={(option) => handleSortChange(option?.value as "Recent" | "Last Modified")}
                    />
                  </div>
                </div>
                <div className="tab-content" id="v-pills-tabContent2">
                  <div
                    className={`tab-pane fade ${selectedTab === "all" ? "active show" : ""}`}
                    id="v-pills-profile"
                    role="tabpanel"
                    aria-labelledby="v-pills-profile-tab"
                  >
                    <div className="row">
                      {loading ? (
                        <p className="text-center" >Loading notes...</p>
                      ) :
                        notes.length === 0 ? (
                          <p className="text-center">No notes available.</p>
                        ) : (
                          notes.map((note) => (
                            <div key={note._id} className="col-md-4 d-flex">
                              <div className="card rounded-3 mb-4 flex-fill">
                                <div className="card-body p-4">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <span
                                      className={`badge border d-inline-flex align-items-center ${getStatusClass(note.priority || "Low")}`}
                                    >
                                      <i className="fas fa-circle fs-6 me-1" />
                                      {note.priority || "Low"}
                                    </span>
                                    <div>
                                      <Link
                                        to="#"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                      >
                                        <i className="fas fa-ellipsis-v" />
                                      </Link>
                                      <div className="dropdown-menu notes-menu dropdown-menu-end">
                                        <Link
                                          to="#"
                                          className="dropdown-item"
                                          data-bs-toggle="modal"
                                          data-inert={true}
                                          data-bs-target="#edit-note-units"
                                          onClick={() => { setEditingNote(note) }}
                                        >
                                          <span>
                                            <i data-feather="edit" />
                                          </span>
                                          Edit
                                        </Link>
                                        <Link
                                          to="#"
                                          className="dropdown-item"
                                          data-bs-toggle="modal"
                                          data-inert={true}
                                          data-bs-target="#delete_modal"
                                          onClick={() => { setNoteToDelete(note) }}
                                        >
                                          <span>
                                            <i data-feather="trash-2" />
                                          </span>
                                          Delete
                                        </Link>
                                        <Link
                                          to="#"
                                          className="dropdown-item"
                                          onClick={() => toggleStarNote(note)}
                                        >
                                          <span>
                                            <i data-feather="star" />
                                          </span>
                                          {note.isStarred ? "Not Important" : "Mark as Important"}
                                        </Link>

                                        <Link
                                          to="#"
                                          className="dropdown-item"
                                          data-bs-toggle="modal"
                                          data-inert={true}
                                          data-bs-target="#view-note-units"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setViewNote(note);
                                          }}
                                        >
                                          <span>
                                            <i data-feather="eye" />
                                          </span>
                                          View
                                        </Link>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="my-3">
                                    <h5 className="text-truncate mb-1">
                                      <Link to="#">{note.title || "Untitled Note"}</Link>
                                    </h5>
                                    <p className="mb-3 d-flex align-items-center text-dark">
                                      <i className="ti ti-calendar me-1" />
                                      {new Date(note.dueDate).toLocaleDateString() || "No Date"}
                                    </p>
                                    <p className="text-truncate line-clamp-2 text-wrap">
                                      {note.description || "No description provided."}
                                    </p>
                                  </div>
                                  <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                    <div className="d-flex align-items-center">
                                      {/* <Link
                                        to="#"
                                        className="avatar avatar-md me-2"
                                      >
                                        <ImageWithBasePath
                                          src="./assets/img/profiles/avatar-06.jpg"
                                          alt="Profile"
                                          className="img-fluid rounded-circle"
                                        />
                                      </Link>
                                      <span className="text-success d-flex align-items-center">
                                        <i className="fas fa-square square-rotate fs-10 me-1" />
                                        Work
                                      </span> */}
                                      <div className="d-flex align-items-center">
                                        {note.isStarred && (
                                          <Link to="#" className="me-2">
                                            <span>
                                              <i className="fas fa-star text-warning" />
                                            </span>
                                          </Link>
                                        )}

                                        <Link to="#">
                                          <span>
                                            <i className="ti ti-trash text-danger" />
                                          </span>
                                        </Link>
                                      </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                      {/* {note.isStarred && (
                                        <Link to="#" className="me-2">
                                          <span>
                                            <i className="fas fa-star text-warning" />
                                          </span>
                                        </Link>
                                      )} */}

                                      {/* <Link to="#">
                                        <span>
                                          <i className="ti ti-trash text-danger" />
                                        </span>
                                      </Link> */}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                    </div>
                  </div>

                  <div
                    className={`tab-pane fade ${selectedTab === "important" ? "active show" : ""}`}
                    id="v-pills-messages"
                    role="tabpanel"
                    aria-labelledby="v-pills-messages-tab"
                  >
                    <div className="row">
                      {loading ? (
                        <p className="text-center">Loading notes...</p>
                      ) : notes.length === 0 ? (
                        <p className="text-center">No important notes available.</p>
                      ) : (
                        notes.map((note) => (
                          <div key={note._id} className="col-md-4 d-flex">
                            <div className="card rounded-3 mb-4 flex-fill">
                              <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                  <span
                                    className={`badge border d-inline-flex align-items-center ${getStatusClass(note.priority || "Low")}`}
                                  >
                                    <i className="fas fa-circle fs-6 me-1" />
                                    {note.priority || "Low"}
                                  </span>
                                  <div>
                                    <Link
                                      to="#"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fas fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu notes-menu dropdown-menu-end">
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-inert={true}
                                        data-bs-target="#edit-note-units"
                                        onClick={() => { setEditingNote(note) }}
                                      >
                                        <span>
                                          <i data-feather="edit" />
                                        </span>
                                        Edit
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-inert={true}
                                        data-bs-target="#delete_modal"
                                        onClick={() => { setNoteToDelete(note) }}
                                      >
                                        <span>
                                          <i data-feather="trash-2" />
                                        </span>
                                        Delete
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        onClick={() => { setNoteToTogglestar(note) }}
                                      >
                                        <span>
                                          <i data-feather="star" />
                                        </span>
                                        Not Important
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-inert={true}
                                        data-bs-target="#view-note-units"
                                        onClick={() => { setViewNote(note) }}
                                      >
                                        <span>
                                          <i data-feather="eye" />
                                        </span>
                                        View
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                <div className="my-3">
                                  <h5 className="text-truncate mb-1">
                                    <Link to="#">{note.title || "Untitled Note"}</Link>
                                  </h5>
                                  <p className="mb-3 d-flex align-items-center text-dark">
                                    <i className="ti ti-calendar me-1" />
                                    {new Date(note.dueDate).toLocaleDateString() || "No Date"}
                                  </p>
                                  <p className="text-truncate line-clamp-2 text-wrap">
                                    {note.description || "No description provided."}
                                  </p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                  <div className="d-flex align-items-center">
                                    <Link
                                      to="#"
                                      className="avatar avatar-md me-2"
                                    >
                                      <ImageWithBasePath
                                        src="./assets/img/profiles/avatar-06.jpg"
                                        alt="Profile"
                                        className="img-fluid rounded-circle"
                                      />
                                    </Link>
                                    <span className="text-success d-flex align-items-center">
                                      <i className="fas fa-square square-rotate fs-10 me-1" />
                                      Work
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Link to="#" className="me-2">
                                      <span>
                                        <i className="fas fa-star text-warning" />
                                      </span>
                                    </Link>
                                    <Link to="#">
                                      <span>
                                        <i className="ti ti-trash text-danger" />
                                      </span>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div
                    className={`tab-pane fade ${selectedTab === "trash" ? "active show" : ""}`}
                    id="v-pills-settings"
                    role="tabpanel"
                    aria-labelledby="v-pills-settings-tab"
                  >
                    <div className="row">
                      {loading ? (
                        <p className="text-center">Loading notes...</p>
                      ) : notes.length === 0 ? (
                        <p className="text-center">No trashed notes available.</p>
                      ) : (
                        notes.map((note) => (
                          <div key={note._id} className="col-md-4 d-flex">
                            <div className="card rounded-3 mb-4 flex-fill">
                              <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                  <span
                                    className={`badge border d-inline-flex align-items-center ${getStatusClass(note.priority || "Low")}`}
                                  >
                                    <i className="fas fa-circle fs-6 me-1" />
                                    {note.priority || "Low"}
                                  </span>
                                  <div>
                                    <Link
                                      to="#"
                                      data-bs-toggle="dropdown"
                                      aria-expanded="false"
                                    >
                                      <i className="fas fa-ellipsis-v" />
                                    </Link>
                                    <div className="dropdown-menu notes-menu dropdown-menu-end">
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-inert={true}
                                        data-bs-target="#edit-note-units"
                                        onClick={() => { setEditingNote(note) }}
                                      >
                                        <span>
                                          <i data-feather="edit" />
                                        </span>
                                        Edit
                                      </Link>
                                      {/* <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-inert={true}
                                        data-bs-target="#delete_modal"
                                        onClick={() => { setNoteToDelete(note) }}
                                      >
                                        <span>
                                          <i data-feather="trash-2" />
                                        </span>
                                        Delete
                                      </Link> */}
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        onClick={() => { setNoteToTogglestar(note) }}
                                      >
                                        <span>
                                          <i data-feather="star" />
                                        </span>
                                        Not Important
                                      </Link>
                                      <Link
                                        to="#"
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-inert={true}
                                        data-bs-target="#view-note-units"
                                        onClick={() => setViewNote(note)}
                                      >
                                        <span>
                                          <i data-feather="eye" />
                                        </span>
                                        View
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                                <div className="my-3">
                                  <h5 className="text-truncate mb-1">
                                    <Link to="#">{note.title || "Untitled Note"}</Link>
                                  </h5>
                                  <p className="mb-3 d-flex align-items-center text-dark">
                                    <i className="ti ti-calendar me-1" />
                                    {new Date(note.dueDate).toLocaleDateString() || "No Date"}
                                  </p>
                                  <p className="text-truncate line-clamp-2 text-wrap">
                                    {note.description || "No description provided."}
                                  </p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between border-top pt-3">
                                  <div className="d-flex align-items-center">
                                    <Link
                                      to="#"
                                      className="avatar avatar-md me-2"
                                    >
                                      <ImageWithBasePath
                                        src="./assets/img/profiles/avatar-06.jpg"
                                        alt="Profile"
                                        className="img-fluid rounded-circle"
                                      />
                                    </Link>
                                    <span className="text-success d-flex align-items-center">
                                      <i className="fas fa-square square-rotate fs-10 me-1" />
                                      Work
                                    </span>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <Link to="#" className="me-2">
                                      <span>
                                        <i className="fas fa-star text-warning" />
                                      </span>
                                    </Link>
                                    <Link to="#">
                                      <span>
                                        <i className="ti ti-trash text-danger" />
                                      </span>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="row custom-pagination">
                  <div className="col-md-12">
                    <div className="paginations d-flex justify-content-end">
                      <span>
                        <i className="fas fa-chevron-left" />
                      </span>
                      <ul className="d-flex align-items-center page-wrap">
                        <li>
                          <Link to="#" className="active">
                            1
                          </Link>
                        </li>
                        <li>
                          <Link to="#">2</Link>
                        </li>
                        <li>
                          <Link to="#">3</Link>
                        </li>
                        <li>
                          <Link to="#">4</Link>
                        </li>
                      </ul>
                      <span>
                        <i className="fas fa-chevron-right" />
                      </span>
                    </div>
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
        {/* /Page wrapper */}
        {/* Add Note */}
        <div className="modal fade" id="add_note">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Add Notes</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>
              <form action={all_routes.notes} onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-12">
                      <div className="mb-3">
                        <label className="form-label">Note Title</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      {/* <div className="mb-3">
                        <label className="form-label">Assignee</label>
                        <CommonSelect
                          className="select"
                          options={optionsChoose}
                          value={optionsChoose.find(option => option.value === formData.assignee)}
                          onChange={(selectedOption) => handleSelectChange('assignee', selectedOption)}
                        />
                      </div> */}
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Tag</label>
                        <Select
                          isMulti
                          options={predefinedTags}
                          value={tags}
                          onChange={handleTagChange}
                          placeholder="Select tags"
                          className="custom-select-class"
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Priority</label>
                        <CommonSelect
                          className="select"
                          options={optionsPriority}
                          defaultValue={optionsPriority.find(option => option.value === formData.priority)}
                          onChange={(selectedOption) => handleSelectChange("priority", selectedOption)}
                        />
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="input-blocks todo-calendar">
                        <label className="form-label">Due Date</label>
                        <div className="input-groupicon calender-input">
                          <DatePicker
                            className="form-control datetimepicker"
                            placeholder="Select Date"
                            value={formData.dueDate ? dayjs(formData.dueDate) : null}
                            // In your DatePicker component:
                            onChange={(date, dateString) => {
                              setFormData({
                                ...formData,
                                dueDate: Array.isArray(dateString) ? dateString[0] : dateString
                              });
                            }}
                            format="YYYY-MM-DD"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <CommonSelect
                          className="select"
                          options={optionsSelect}
                          defaultValue={optionsSelect.find(option => option.value === formData.status)}
                          onChange={(selectedOption) => handleSelectChange("status", selectedOption)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-0 summer-description-box notes-summernote">
                        <label className="form-label">Descriptions</label>
                        <CommonTextEditor
                          defaultValue={formData.description}
                          onChange={handleEditorChange}
                        />
                        <small>Maximum 60 Characters</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-light me-2"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        {/* /Add Note */}
        {/* Delete Modal */}
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body text-center">
                <span className="avatar avatar-xl bg-transparent-danger text-danger mb-3">
                  <i className="ti ti-trash-x fs-36" />
                </span>
                <h4 className="mb-1">Confirm Deletion</h4>
                <p className="mb-3">
                  {noteToDelete
                    ? `Are you sure you want to delete employee "${noteToDelete?.title}"? This cannot be undone.`
                    : "You want to delete all the marked items, this can't be undone once you delete."}
                </p>
                <div className="d-flex justify-content-center">
                  <button
                    className="btn btn-light me-3"
                    data-bs-dismiss="modal"
                    onClick={() => setNoteToDelete(null)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-danger"
                    data-bs-dismiss="modal"
                    onClick={() => {
                      if (noteToDelete) {
                        deleteNote(noteToDelete._id);
                      }
                      setNoteToDelete(null);
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /Delete Modal */}
        {/* Edit modal */}
        <div className="modal fade" id="edit-note-units">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Edit Note</h4>
                <button
                  type="button"
                  className="btn-close custom-btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <i className="ti ti-x" />
                </button>
              </div>

              <div className="modal-body">
                <div className="row">
                  {/* Title */}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">
                        Note Title <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingNote?.title || ""}
                        onChange={(e) =>
                          setEditingNote((prev) =>
                            prev ? { ...prev, title: e.target.value } : prev
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Tag */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tag</label>
                      <Select
                        isMulti
                        options={predefinedTags}
                        value={tags}
                        onChange={handleEditTag}
                        placeholder="Select tags"
                        className="custom-select-class"
                      />
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Priority</label>
                      <CommonSelect
                        className="select"
                        options={optionsPriority}
                        defaultValue={
                          optionsPriority.find(
                            (opt) => opt.value === editingNote?.priority
                          ) || { value: "", label: "Select" }
                        }
                        onChange={(option) => {
                          if (option) {
                            setEditingNote((prev) =>
                              prev ? { ...prev, priority: option.value } : prev
                            );
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Due Date</label>
                      <DatePicker
                        className="form-control datetimepicker"
                        value={
                          editingNote?.dueDate ? dayjs(editingNote.dueDate) : null
                        }
                        onChange={(date) =>
                          setEditingNote((prev) =>
                            prev
                              ? {
                                ...prev,
                                dueDate: date ? date.toDate().toISOString() : "",
                              }
                              : prev
                          )
                        }
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <CommonSelect
                        className="select"
                        options={[
                          { value: "true", label: "Starred" },
                          { value: "false", label: "Not Starred" },
                        ]}
                        defaultValue={
                          editingNote
                            ? {
                              value: editingNote.isStarred ? "true" : "false",
                              label: editingNote.isStarred ? "Starred" : "Not Starred",
                            }
                            : { value: "", label: "Select" }
                        }
                        onChange={(option) => {
                          if (option) {
                            setEditingNote((prev) =>
                              prev ? { ...prev, isStarred: option.value === "true" } : prev
                            );
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-md-12">
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <CommonTextEditor
                        defaultValue={editingNote?.description || ""}
                        onChange={(val) =>
                          setEditingNote((prev) =>
                            prev ? { ...prev, description: val } : prev
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-light border me-2"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                  onClick={handleUpdateSubmit}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Note */}
        {/* View Note */}
        <div className="modal fade" id="view-note-units">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="page-wrapper-new p-0">
                <div className="content">
                  <div className="modal-header">
                    <div className="d-flex align-items-center">
                      <h4 className="modal-title me-3">Notes</h4>
                      <p className="text-info">Personal</p>
                    </div>
                    <button
                      type="button"
                      className="btn-close custom-btn-close"
                      data-bs-dismiss="modal"
                      aria-label="Close"
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-12">
                        <div>
                          <h4 className="mb-2">{viewNote?.title}</h4>
                          <p>{viewNote?.description}</p>
                          <p className={`badge d-inline-flex align-items-center mb-0 ${viewNote?.priority === "High"
                            ? "bg-outline-danger"
                            : viewNote?.priority === "Medium"
                              ? "bg-outline-warning"
                              : "bg-outline-success"
                            }`}>
                            <i className="fas fa-circle fs-6 me-1" /> {viewNote?.priority}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <Link
                      to="#"
                      className="btn btn-danger"
                      data-bs-dismiss="modal"
                      onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()}
                    >
                      Close
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /View Note */}

        {/* /View Note */}

      </>

      <NotesModal />
    </>
  );
};

export default Notes;
