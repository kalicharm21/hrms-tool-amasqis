import { ObjectId } from 'mongodb';
import { getTenantCollections } from "../../config/db.js";

export const getNotes = async (companyId, employeeId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);

    console.log(filters);
    
    const pipeline = [];

    // Match employee
    pipeline.push({ $match: { employeeId } });

    // Status filter
    if (filters.tab === "important") {
      pipeline.push({ $match: { isStarred: true, isDeleted: false } });
    } else if (filters.tab === "trash") {
      pipeline.push({ $match: { isDeleted: true } });
    } else {
      pipeline.push({ $match: { isDeleted: false } }); // Default: active notes
    }

    // Priority filter
    if (filters.priority) {
      pipeline.push({ $match: { priority: filters.priority } });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      pipeline.push({ $match: { tag: { $in: filters.tags.map(tag => tag.toLowerCase()) } } });
    }

    // Sorting
    if (filters.sort === "Recent") {
      pipeline.push({ $sort: { createdAt: -1 } });
    } else if (filters.sort === "Last Modified") {
      pipeline.push({ $sort: { updatedAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } }); 
    }
console.log("Pipeline", pipeline);

    const notes = await collections.notes.aggregate(pipeline).toArray();

    return { done: true, data: notes };
  } catch (error) {
    return { done: false, message: error.message };
  }
};


export const addNote = async (companyId, employeeId, data) => {
  try {
    if (!companyId || !employeeId) {
      return { done: false, message: "Ids are required" };
    }
    if (!data) {
      return { done: false, message: "Data is required" };
    }

    const collections = getTenantCollections(companyId);

    let isStarred;
    if ((data.status == "star") || (data.status == "Star")) {
      isStarred = true;
    } else {
      isStarred = false;
    }

    // Construct note document with required fields
    const noteDoc = {
      employeeId: employeeId,
      title: data.title,
      isStarred: isStarred,
      tag: data.tag,
      priority: data.priority,
      dueDate: new Date(data.dueDate),
      description: data.description,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the note document in the notes collection
    const insertResult = await collections.notes.insertOne(noteDoc);

    if (!insertResult.acknowledged) {
      return { done: false, error: "Failed to insert note" };
    }

    return {
      done: true,
      insertedId: insertResult.insertedId,
      message: "Note successfully added",
    };
  } catch (error) {
    console.log("Error adding employee note:", error);
    return { done: false, error: error.message };
  }
};

export const editNote = async (companyId, employeeId, noteId, data) => {
  try {
    if (!companyId || !employeeId || !noteId) {
      return { done: false, error: "Ids are required" };
    }

    const collections = getTenantCollections(companyId);
    const updateFields = { ...data, updatedAt: new Date() };

    if (data.status) {
      if (data.status.toLowerCase() === "star") {
        updateFields.isStarred = true;
      } else {
        updateFields.isStarred = false;
      }
      delete updateFields.status;
    }

    const updateResult = await collections.notes.updateOne(
      { _id: new ObjectId(noteId), employeeId: employeeId },
      { $set: updateFields }
    );

    if (updateResult.matchedCount === 0) {
      return { done: false, error: "Note not found" };
    }

    return {
      done: true,
      message: "Note updated successfully",
    };
  } catch (error) {
    console.log("Error updating employee note:", error);
    return { done: false, error: error.message };
  }
};

// star api
// delete api
// update api

// star note or important note both are same
export const starNote = async (companyId, employeeId, noteData) => {
  try {
    const collections = getTenantCollections(companyId);

    const { noteId } = noteData;
    if (!noteId) {
      return { done: false, error: "noteId is required" };
    }

    const noteObjectId = new ObjectId(noteId);

    const note = await collections.notes.findOne({ _id: noteObjectId });
    if (!note) {
      return { done: false, error: "Note not found in this company." };
    }

    const updatedData = {
      isStarred: !note.isStarred,
      updatedAt: new Date(),
      updatedBy: employeeId,
    };

    const result = await collections.notes.updateOne(
      { _id: noteObjectId },
      { $set: updatedData }
    );

    if (result.modifiedCount > 0) {
      return { done: true, data: "Note star toggled successfully.", noteId };
    } else if (result.matchedCount > 0) {
      return { done: true, data: "No changes were made to the note.", noteId };
    } else {
      return { done: false, error: "Note not found for update." };
    }
  } catch (error) {
    return { done: false, error: error.message };
  }
};

// trash note
export const trashNote = async ({ companyId, noteId, employeeId }) => {
  try {
    const collections = getTenantCollections(companyId);
    const noteObjectId = new ObjectId(noteId);
    console.log("Heloo");

    const note = await collections.notes.findOne({ _id: noteObjectId });
    if (!note) {
      return { done: false, error: "Note not found." };
    }
    console.log("Hellllooooo");

    const result = await collections.notes.updateOne(
      { _id: noteObjectId },
      { $set: { isDeleted: true, updatedAt: new Date(), updatedBy: employeeId } }
    );
    console.log("result", result);

    if (result.modifiedCount > 0) {
      return { done: true, data: "Note moved to trash." };
    } else {
      return { done: false, error: "No changes made." };
    }
  } catch (error) {
    console.log(error);
    return { done: false, error: error.message };
  }
};

// restore note
export const restoreAllNotes = async ({ companyId, employeeId }) => {
  try {
    const collections = getTenantCollections(companyId);
    const result = await collections.notes.updateMany(
      { isDeleted: true },
      { $set: { isDeleted: false, updatedAt: new Date(), updatedBy: employeeId } }
    );

    return { done: true, data: `Restored ${result.modifiedCount} notes.` };
  } catch (error) {
    return { done: false, error: error.message };
  }
};