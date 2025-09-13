import { ObjectId } from "mongodb";
import * as notesServices from "../../services/employee/notes.services.js";

const VALID_TABS = ["important", "trash", "active"];
const VALID_PRIORITY = ["Low", "Medium", "High"];
const VALID_SORT = ["Recent", "Last Modified"];
const VALID_TAGS = ["Urgent", "Followup", "Pending", "Completed"];

const notesController = (socket, io) => {    
    const isDevelopment =
        process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production";

    const validateEmployeeAccess = (socket) => {
        if (!socket.companyId) {
            console.error("[Employee] Company ID not found in user metadata", { user: socket.user?.sub });
            throw new Error("Company ID not found in user metadata");
        }
        const companyIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
        if (!companyIdRegex.test(socket.companyId)) {
            console.log(`[Employee] Invalid company ID format: ${socket.companyId}`);
            throw new Error("Invalid company ID format");
        }
        if (socket.userMetadata?.companyId !== socket.companyId) {
            console.log(
                `[Employee] Company ID mismatch: user metadata has ${socket.userMetadata?.companyId}, socket has ${socket.companyId}`
            );
            throw new Error("Unauthorized: Company ID mismatch");
        }
        // if ((socket.userMetadata?.role !== "employee")) {
        //     console.log(`[Employee] Unauthorized role: ${socket.userMetadata?.role}, employee role required`);
        //     throw new Error("Unauthorized: Employee role required");
        // }
        return { companyId: socket.companyId, employeeId: socket.user?.sub };
    };

    const withRateLimit = (handler) => {
        return async (...args) => {
            if (isDevelopment) {
                return handler(...args);
            }
            if (!socket.checkRateLimit()) {
                console.warn(`Rate limit exceeded for user ${socket.user.sub}`);
                const eventName = args[0] || "unknown";
                socket.emit(`${eventName}-response`, {
                    done: false,
                    message: "Rate limit exceeded. Please try again later.",
                });
                return;
            }
            return handler(...args);
        };
    };

    socket.on("employees/notes/add",
        withRateLimit(async (payload) => {
            try {
                const { companyId, employeeId } = validateEmployeeAccess(socket);

                if (!payload || typeof payload !== "object") {
                    throw new Error("Invalid notes data format.");
                }

                const { title, status, tag, priority, dueDate, description } = payload;
                const isTagArray = Array.isArray(tag);

                if (
                    !title ||
                    typeof title !== "string" ||
                    !status ||
                    typeof status !== "string" ||
                    !isTagArray ||
                    !priority ||
                    typeof priority !== "string" ||
                    !dueDate ||
                    isNaN(Date.parse(dueDate)) ||
                    !description ||
                    typeof description !== "string"
                ) {
                    throw new Error("Missing or invalid required note fields.");
                }
                const result = await notesServices.addNote(companyId, employeeId, payload);

                if (!result.done) {
                    socket.emit("employees/notes/add-response", {
                        done: false,
                        message: result.message || "Failed to add note.",
                    });
                    return;
                }

                socket.emit("employees/notes/add-response", {
                    done: true,
                    insertedId: result.insertedId,
                });

            } catch (error) {
                console.log("[employees/notes/add] Error:", error);

                socket.emit("employees/notes/add-response", {
                    done: false,
                    message: error.message || "Internal server error",
                });
            }
        })
    );
    socket.on("employees/notes/star",
        withRateLimit(async (payload) => {
            try {
                const { companyId, employeeId } = validateEmployeeAccess(socket);

                if (!payload || typeof payload.noteId !== "string") {
                    throw new Error("Invalid payload or missing noteId.");
                }

                const result = await notesServices.starNote(companyId, employeeId, payload);

                socket.emit("employees/notes/star-response", result);
            } catch (error) {
                console.error("[employees/notes/star] Error:", error);
                socket.emit("employees/notes/star-response", {
                    done: false,
                    message: error.message || "Internal server error",
                });
            }
        })
    );

    socket.on("employees/notes/edit",
        withRateLimit(async (payload) => {
            try {
                const { companyId, employeeId } = validateEmployeeAccess(socket);

                if (!payload || typeof payload !== "object") {
                    throw new Error("Invalid notes data format.");
                }

                const { noteId, title, status, tag, priority, dueDate, description } = payload;

                if (!noteId || typeof noteId !== "string") {
                    throw new Error("Missing or invalid noteId.");
                }

                // Optional validations (only check if field exists in payload)
                if (title && typeof title !== "string") {
                    throw new Error("Invalid title format.");
                }
                if (status && typeof status !== "string") {
                    throw new Error("Invalid status format.");
                }
                if (tag && !Array.isArray(tag)) {
                    throw new Error("Invalid tag format.");
                }
                if (priority && typeof priority !== "string") {
                    throw new Error("Invalid priority format.");
                }
                if (dueDate && isNaN(Date.parse(dueDate))) {
                    throw new Error("Invalid dueDate format.");
                }
                if (description && typeof description !== "string") {
                    throw new Error("Invalid description format.");
                }

                const result = await notesServices.editNote(companyId, employeeId, noteId, payload);

                if (!result.done) {
                    socket.emit("employees/notes/edit-response", {
                        done: false,
                        message: result.error || "Failed to edit note.",
                    });
                    return;
                }

                socket.emit("employees/notes/edit-response", {
                    done: true,
                    message: "Note updated successfully",
                });

            } catch (error) {
                console.log("[employees/notes/edit] Error:", error);
                socket.emit("employees/notes/edit-response", {
                    done: false,
                    message: error.message || "Internal server error",
                });
            }
        })
    );

    socket.on("employees/notes/get", async (payload) => {
        try {
            console.log("Heleloe");
            const { companyId, employeeId } = validateEmployeeAccess(socket);

            let filters = {};

            if (payload && typeof payload === "object") {
                // Validate tab
                if (payload.tab && VALID_TABS.includes(payload.tab)) {
                    filters.tab = payload.tab;
                }

                // Validate priority
                if (payload.priority && VALID_PRIORITY.includes(payload.priority)) {
                    filters.priority = payload.priority;
                }

                // Validate tags
                if (Array.isArray(payload.tags)) {
                    const validTags = payload.tags.filter(tag => VALID_TAGS.includes(tag));
                    if (validTags.length > 0) filters.tags = validTags;
                }

                // Validate sort (not sortBy)
                if (payload.sort && VALID_SORT.includes(payload.sort)) {
                    filters.sort = payload.sort;
                }
            }

            console.log("filters controllers ****", filters);

            const result = await notesServices.getNotes(companyId, employeeId, filters);
            socket.emit("employees/notes/get-response", result);

        } catch (error) {
            console.log("[employees/notes/get] Error:", error.message);
            socket.emit("employees/notes/get-response", {
                done: false,
                message: error.message || "Internal server error",
            });
        }
    });

    socket.on("employees/notes/trash",
        withRateLimit(async (payload) => {
            try {
                console.log("Hello1");

                const { companyId, employeeId } = validateEmployeeAccess(socket);
                console.log(payload);

                const { noteId } = payload;
                if (!noteId || typeof noteId !== "string" || noteId.trim() === "") {
                    throw new Error("Valid noteId string is required");
                }
                console.log("TCUYIHOI");

                const result = await notesServices.trashNote({ companyId, noteId, employeeId });

                if (!result.done) {
                    socket.emit("employees/notes/trash-response", {
                        done: false,
                        message: result.error || "Failed to move note to trash.",
                    });
                    return;
                }

                socket.emit("employees/notes/trash-response", {
                    done: true,
                    message: result.data || "Note moved to trash successfully.",
                });
            } catch (error) {
                console.log("[employees/notes/trash] Error:", error);
                socket.emit("employees/notes/trash-response", {
                    done: false,
                    message: error.message || "Internal server error",
                });
            }
        })
    );

    socket.on("employees/notes/restore-all",
        withRateLimit(async () => {
            try {
                const { companyId, employeeId } = validateEmployeeAccess(socket);

                const result = await notesServices.restoreAllNotes({ companyId, employeeId });

                if (!result.done) {
                    socket.emit("employees/notes/restore-all-response", {
                        done: false,
                        message: result.error || "Failed to restore notes.",
                    });
                    return;
                }

                socket.emit("employees/notes/restore-all-response", {
                    done: true,
                    message: result.data || "Notes restored successfully.",
                });
            } catch (error) {
                console.log("[employees/notes/restore-all] Error:", error);
                socket.emit("employees/notes/restore-all-response", {
                    done: false,
                    message: error.message || "Internal server error",
                });
            }
        })
    );

    socket.on("employees/notes/delete",
        withRateLimit(async (payload) => {
            try {
                const { companyId } = validateEmployeeAccess(socket);
                const { noteId } = payload;
                if (!noteId || typeof noteId !== "string" || noteId.trim() === "") {
                    throw new Error("Valid noteId string is required");
                }

                const result = await notesServices.deleteNote({ companyId, noteId });

                if (!result.done) {
                    socket.emit("employees/notes/delete-response", {
                        done: false,
                        message: result.error || "Failed to delete note.",
                    });
                    return;
                }

                socket.emit("employees/notes/delete-response", {
                    done: true,
                    message: result.data || "Note deleted successfully.",
                });
            } catch (error) {
                console.log("[employees/notes/delete] Error:", error);
                socket.emit("employees/notes/delete-response", {
                    done: false,
                    message: error.message || "Internal server error",
                });
            }
        })
    );

}
export default notesController;