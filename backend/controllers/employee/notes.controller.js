import { ObjectId } from "mongodb";
import * as notesServices from "../../services/employee/notes.services.js";

const notesController = (socket, io) => {
        const isDevelopment =
        process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production";

    const validateEmployeeAccess = (socket) => {
        console.log(socket);
        
        if (!socket.companyId) {
            console.error("[Employee] Company ID not found in user metadata", { user: socket.user?.sub });
            throw new Error("Company ID not found in user metadata");
        }
        const companyIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
        if (!companyIdRegex.test(socket.companyId)) {
            console.error(`[Employee] Invalid company ID format: ${socket.companyId}`);
            throw new Error("Invalid company ID format");
        }
        if (socket.userMetadata?.companyId !== socket.companyId) {
            console.error(
                `[Employee] Company ID mismatch: user metadata has ${socket.userMetadata?.companyId}, socket has ${socket.companyId}`
            );
            throw new Error("Unauthorized: Company ID mismatch");
        }
        if (socket.userMetadata?.role !== "employee") {
            console.error(`[Employee] Unauthorized role: ${socket.userMetadata?.role}, employee role required`);
            throw new Error("Unauthorized: Employee role required");
        }
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
                    error: "Rate limit exceeded. Please try again later.",
                });
                return;
            }
            return handler(...args);
        };
    };
socket.on( "employees/notes/add",           
            withRateLimit(async (payload) => {
                try {
                    console.log("******Hrlllo*****", payload);
                    
                    const {companyId, employeeId} = validateEmployeeAccess(socket);

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

                    const result = await notesServices.addEmployeeNote(companyId, employeeId, payload);

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
}
export default notesController;