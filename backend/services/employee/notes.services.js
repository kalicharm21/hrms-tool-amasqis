import { ObjectId } from "mongodb";
export const addEmployeeNote = async (companyId, employeeId, data) => {
    try {
        if (!companyId || !employeeId) {
            return { done: false, message: "Missing companyId or employeeId" };
        }

        const employee = await collections.employees.findOne({ _id: new ObjectId(employeeId) });
        if (!employee) {
            return { done: false, error: 'Employee not found in this company' };
        }

        const { title, status, tag, priority, dueDate, description } = data;

        if (!title || !status || !tag || !priority || !dueDate) {
            return { done: false, message: "Missing required note fields" };
        }

        const collections = getTenantCollections(companyId);
        const noteDoc = {
            employeeId: new ObjectId(employeeId),
            title,
            status,
            tag,
            priority,
            dueDate: new Date(dueDate),
            description,
            createdAt: new Date(),
        };

        const insertResult = await collections.notes.insertOne(noteDoc);

        if (insertResult.insertedId) {
            return { done: true, insertedId: insertResult.insertedId, message: "Internal server error" };
        }

        return { done: false, message: "Failed to insert note" };
    } catch (error) {
        console.error("addEmployeeNote error:", error);
        return { done: false, message: "Internal server error" };
    }
};