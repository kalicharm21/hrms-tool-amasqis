import * as pipelineService from "../../services/pipeline/pipeline.services.js";
import { getStages, addStage, updateStage, overwriteStages } from '../../services/pipeline/pipeline.services.js';

const pipelineController = (socket, io) => {
  // Helper to validate company access (pattern from admin.controller.js)
  const validateCompanyAccess = (socket) => {
    if (!socket.companyId) {
      console.error("[Pipeline] Company ID not found in user metadata", { user: socket.user?.sub });
      throw new Error("Company ID not found in user metadata");
    }
    const companyIdRegex = /^[a-zA-Z0-9_-]{3,50}$/;
    if (!companyIdRegex.test(socket.companyId)) {
      console.error(`[Pipeline] Invalid company ID format: ${socket.companyId}`);
      throw new Error("Invalid company ID format");
    }
    if (socket.userMetadata?.companyId !== socket.companyId) {
      console.error(`[Pipeline] Company ID mismatch: user metadata has ${socket.userMetadata?.companyId}, socket has ${socket.companyId}`);
      throw new Error("Unauthorized: Company ID mismatch");
    }
    return socket.companyId;
  };

  // Only allow admin
  const isAdmin = socket.userMetadata?.role === "admin";

  // CREATE pipeline
  socket.on("pipeline:create", async (data) => {
    try {
      console.log("[Pipeline] pipeline:create event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, data });
      if (!isAdmin) throw new Error("Unauthorized: Admins only");
      const companyId = validateCompanyAccess(socket);
      // Always include companyId in the pipeline data
      const result = await pipelineService.createPipeline(companyId, { ...data, companyId });
      if (!result.done) {
        console.error("[Pipeline] Failed to create pipeline", { error: result.error });
      }
      socket.emit("pipeline:create-response", result);
    } catch (error) {
      console.error("[Pipeline] Error in pipeline:create", { error: error.message });
      socket.emit("pipeline:create-response", { done: false, error: error.message });
    }
  });

  // GET all pipelines
  socket.on("pipeline:getAll", async (filters = {}) => {
    try {
      console.log("[Pipeline] pipeline:getAll event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, filters });
      const companyId = validateCompanyAccess(socket);
      const result = await pipelineService.getPipelines(companyId, filters);
      if (!result.done) {
        console.error("[Pipeline] Failed to get pipelines", { error: result.error });
      }
      socket.emit("pipeline:getAll-response", result);
    } catch (error) {
      console.error("[Pipeline] Error in pipeline:getAll", { error: error.message });
      socket.emit("pipeline:getAll-response", { done: false, error: error.message });
    }
  });

  // UPDATE pipeline
  socket.on("pipeline:update", async ({ pipelineId, update }) => {
    try {
      console.log("[Pipeline] pipeline:update event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, pipelineId, update });
      if (!isAdmin) throw new Error("Unauthorized: Admins only");
      const companyId = validateCompanyAccess(socket);
      const result = await pipelineService.updatePipeline(companyId, pipelineId, update);
      if (!result.done) {
        console.error("[Pipeline] Failed to update pipeline", { error: result.error });
      }
      socket.emit("pipeline:update-response", result);
    } catch (error) {
      console.error("[Pipeline] Error in pipeline:update", { error: error.message });
      socket.emit("pipeline:update-response", { done: false, error: error.message });
    }
  });

  // DELETE pipeline
  socket.on("pipeline:delete", async ({ pipelineId }) => {
    try {
      console.log("[Pipeline] pipeline:delete event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, pipelineId });
      if (!isAdmin) throw new Error("Unauthorized: Admins only");
      const companyId = validateCompanyAccess(socket);
      const result = await pipelineService.deletePipeline(companyId, pipelineId);
      if (!result.done) {
        console.error("[Pipeline] Failed to delete pipeline", { error: result.error });
      }
      socket.emit("pipeline:delete-response", result);
    } catch (error) {
      console.error("[Pipeline] Error in pipeline:delete", { error: error.message });
      socket.emit("pipeline:delete-response", { done: false, error: error.message });
    }
  });

  // Export pipelines as PDF
  socket.on("pipeline/export-pdf", async () => {
    try {
      console.log("Received export-pdf request");
      
      if (!socket.companyId) {
        throw new Error("Company ID not found in user metadata");
      }

      console.log("Generating PDF...");
      const result = await pipelineService.exportPipelinesPDF(socket.companyId);
      console.log("PDF generation result:", result);
      
      if (result.done) {
        console.log("Sending PDF URL to client:", result.data.pdfUrl);
        socket.emit("pipeline/export-pdf-response", {
          done: true,
          data: {
            pdfUrl: result.data.pdfUrl
          }
        });
        
        // Schedule cleanup after 1 hour
        setTimeout(() => {
          console.log("Cleaning up PDF file:", result.data.pdfPath);
          // Note: We could add a cleanup function similar to subscriptions if needed
        }, 60 * 60 * 1000);
      } else {
        console.error("PDF generation failed:", result.error);
        socket.emit("pipeline/export-pdf-response", {
          done: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Error in export-pdf handler:", error);
      socket.emit("pipeline/export-pdf-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Export pipelines as Excel
  socket.on("pipeline/export-excel", async () => {
    try {
      console.log("Received export-excel request");
      
      if (!socket.companyId) {
        throw new Error("Company ID not found in user metadata");
      }

      console.log("Generating Excel...");
      const result = await pipelineService.exportPipelinesExcel(socket.companyId);
      console.log("Excel generation result:", result);
      
      if (result.done) {
        console.log("Sending Excel URL to client:", result.data.excelUrl);
        socket.emit("pipeline/export-excel-response", {
          done: true,
          data: {
            excelUrl: result.data.excelUrl
          }
        });
        
        // Schedule cleanup after 1 hour
        setTimeout(() => {
          console.log("Cleaning up Excel file:", result.data.excelPath);
          // Note: We could add a cleanup function similar to subscriptions if needed
        }, 60 * 60 * 1000);
      } else {
        console.error("Excel generation failed:", result.error);
        socket.emit("pipeline/export-excel-response", {
          done: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error("Error in export-excel handler:", error);
      socket.emit("pipeline/export-excel-response", {
        done: false,
        error: error.message
      });
    }
  });

  // Get all stages for the company
  socket.on('stage:getAll', async () => {
    try {
      console.log("[Pipeline] stage:getAll event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId });
      const companyId = validateCompanyAccess(socket);
      const result = await getStages(companyId);
      if (!result.done) {
        console.error("[Pipeline] Failed to get stages", { error: result.error });
      }
      socket.emit('stage:getAll-response', result);
    } catch (error) {
      console.error("[Pipeline] Error in stage:getAll", { error: error.message });
      socket.emit('stage:getAll-response', { done: false, error: error.message });
    }
  });

  // Add a new stage for the company
  socket.on('stage:add', async ({ name }) => {
    try {
      console.log("[Pipeline] stage:add event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, name });
      if (!isAdmin) throw new Error("Unauthorized: Admins only");
      const companyId = validateCompanyAccess(socket);
      const result = await addStage(companyId, name);
      if (!result.done) {
        console.error("[Pipeline] Failed to add stage", { error: result.error });
      }
      socket.emit('stage:add-response', result);
    } catch (error) {
      console.error("[Pipeline] Error in stage:add", { error: error.message });
      socket.emit('stage:add-response', { done: false, error: error.message });
    }
  });

  // Update a stage for the company
  socket.on('stage:update', async ({ stageId, newName }) => {
    try {
      console.log("[Pipeline] stage:update event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, stageId, newName });
      if (!isAdmin) throw new Error("Unauthorized: Admins only");
      const companyId = validateCompanyAccess(socket);
      const result = await updateStage(companyId, stageId, newName);
      if (!result.done) {
        console.error("[Pipeline] Failed to update stage", { error: result.error });
      }
      socket.emit('stage:update-response', result);
    } catch (error) {
      console.error("[Pipeline] Error in stage:update", { error: error.message });
      socket.emit('stage:update-response', { done: false, error: error.message });
    }
  });

  // Overwrite all stages for the company
  socket.on('stage:overwrite', async ({ stages }) => {
    try {
      console.log("[Pipeline] stage:overwrite event", { user: socket.user?.sub, role: socket.userMetadata?.role, companyId: socket.companyId, stages });
      if (!isAdmin) throw new Error("Unauthorized: Admins only");
      const companyId = validateCompanyAccess(socket);
      const result = await overwriteStages(companyId, stages);
      if (!result.done) {
        console.error("[Pipeline] Failed to overwrite stages", { error: result.error });
      }
      socket.emit('stage:overwrite-response', result);
    } catch (error) {
      console.error("[Pipeline] Error in stage:overwrite", { error: error.message });
      socket.emit('stage:overwrite-response', { done: false, error: error.message });
    }
  });
};

export default pipelineController;