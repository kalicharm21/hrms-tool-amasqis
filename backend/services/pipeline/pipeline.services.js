import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";

export const createPipeline = async (companyId, pipelineData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[PipelineService] createPipeline", { companyId, pipelineData });
    const result = await collections.pipelines.insertOne({
      ...pipelineData,
      createdDate: pipelineData.createdDate ? new Date(pipelineData.createdDate) : new Date(),
    });
    console.log("[PipelineService] insertOne result", { result });
    if (result.insertedId) {
      const inserted = await collections.pipelines.findOne({ _id: result.insertedId });
      console.log("[PipelineService] inserted pipeline", { inserted });
      return { done: true, data: inserted };
    } else {
      console.error("[PipelineService] Failed to insert pipeline");
      return { done: false, error: "Failed to insert pipeline" };
    }
  } catch (error) {
    console.error("[PipelineService] Error in createPipeline", { error: error.message });
    return { done: false, error: error.message };
  }
};

export const getPipelines = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[PipelineService] getPipelines", { companyId });
    const pipelines = await collections.pipelines.find({}).toArray();
    console.log("[PipelineService] found pipelines", { count: pipelines.length });
    return { done: true, data: pipelines };
  } catch (error) {
    console.error("[PipelineService] Error in getPipelines", { error: error.message });
    return { done: false, error: error.message };
  }
};

export const updatePipeline = async (companyId, pipelineId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[PipelineService] updatePipeline", { companyId, pipelineId, updateData });
    const result = await collections.pipelines.findOneAndUpdate(
      { _id: new ObjectId(pipelineId) },
      { $set: updateData },
      { returnDocument: "after" }
    );
    console.log("[PipelineService] update result", { result });
    if (!result.value) {
      console.error("[PipelineService] Pipeline not found for update", { pipelineId });
      return { done: false, error: "Pipeline not found" };
    }
    return { done: true, data: result.value };
  } catch (error) {
    console.error("[PipelineService] Error in updatePipeline", { error: error.message });
    return { done: false, error: error.message };
  }
};

export const deletePipeline = async (companyId, pipelineId) => {
  try {
    const collections = getTenantCollections(companyId);
    console.log("[PipelineService] deletePipeline", { companyId, pipelineId });
    const result = await collections.pipelines.findOneAndDelete({ _id: new ObjectId(pipelineId) });
    console.log("[PipelineService] delete result", { result });
    if (!result.value) {
      console.error("[PipelineService] Pipeline not found for delete", { pipelineId });
      return { done: false, error: "Pipeline not found" };
    }
    return { done: true, data: result.value };
  } catch (error) {
    console.error("[PipelineService] Error in deletePipeline", { error: error.message });
    return { done: false, error: error.message };
  }
};

