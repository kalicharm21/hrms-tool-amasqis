import leadServices from '../../services/lead/lead.services.js';

const leadController = (socket, io) => {
  const validateAccess = (socket) => {
    if (!socket.user) {
      throw new Error('Unauthorized: No user found');
    }
    if (!socket.companyId) {
      throw new Error('Unauthorized: Company ID missing');
    }
    // Ensure the user belongs to the same company
    if (socket.userMetadata?.companyId !== socket.companyId) {
      throw new Error('Unauthorized: Company ID mismatch');
    }
    // Allow specific roles to access leads dashboard
    const allowedRoles = ['admin', 'hr', 'leads'];
    if (!allowedRoles.includes(socket.role)) {
      throw new Error('Forbidden: Insufficient role to access leads dashboard');
    }
    return socket.companyId;
  };

  socket.on('lead/dashboard/get-all-data', async (data = {}) => {
    console.log("[LeadDashboard] Received dashboard request", data);
    console.log("[LeadDashboard] Socket user metadata:", socket.userMetadata);
    console.log("[LeadDashboard] Socket companyId:", socket.companyId);
    try {
      const companyId = validateAccess(socket);
      const filter = data.filter || 'week';
      const dateRange = data.dateRange || null;
      const newLeadsFilter = data.newLeadsFilter || 'week';
      const newLeadsDashboardFilter = data.newLeadsDashboardFilter || 'week';
      const pipelineYear = data.pipelineYear || null;
      const lostLeadsReasonFilter = data.lostLeadsReasonFilter || 'thisMonth';
      const leadsByCompaniesFilter = data.leadsByCompaniesFilter || 'thisMonth';
      const leadsBySourceFilter = data.leadsBySourceFilter || 'thisMonth';
      const topCountriesFilter = data.topCountriesFilter || 'thisMonth';
      console.log(`[LeadDashboard] Fetching for companyId=${companyId}, filter=${filter}, dateRange=`, dateRange, `newLeadsFilter=${newLeadsFilter}, newLeadsDashboardFilter=${newLeadsDashboardFilter}, pipelineYear=${pipelineYear}`);
      
      console.log("[LeadDashboard] Calling leadServices.getDashboardData...");
      const dashboardData = await leadServices.getDashboardData(
        companyId, filter, dateRange, newLeadsFilter, newLeadsDashboardFilter, pipelineYear, lostLeadsReasonFilter, leadsByCompaniesFilter, leadsBySourceFilter, topCountriesFilter
      );
      console.log("[LeadDashboard] Service returned data:", dashboardData);
      
      if (!dashboardData) {
        throw new Error('No dashboard data returned');
      }
      
      console.log("[LeadDashboard] Emitting response to client...");
      socket.emit('lead/dashboard/get-all-data-response', { done: true, data: dashboardData });
      console.log("[LeadDashboard] Response emitted successfully");
    } catch (error) {
      console.error('[LeadDashboard] Controller error:', error);
      socket.emit('lead/dashboard/get-all-data-response', { done: false, error: error.message });
    }
  });

  // Handle leads list data request
  socket.on('lead/list/get-data', async (data = {}) => {
    console.log("[LeadsList] Received leads list request", data);
    try {
      const companyId = validateAccess(socket);
      const filters = data.filters || {};
      
      console.log("[LeadsList] Fetching for companyId:", companyId, "filters:", filters);
      
      const leadsListData = await leadServices.getLeadsListData(companyId, filters);
      console.log("[LeadsList] Service returned data:", leadsListData);
      
      socket.emit('lead/list/get-data-response', { done: true, data: leadsListData });
      console.log("[LeadsList] Response emitted successfully");
    } catch (error) {
      console.error('[LeadsList] Controller error:', error);
      socket.emit('lead/list/get-data-response', { done: false, error: error.message });
    }
  });

  // Handle leads grid data request
  socket.on('lead/grid/get-data', async (data = {}) => {
    console.log("[LeadsGrid] Received leads grid request", data);
    try {
      const companyId = validateAccess(socket);
      const filters = data.filters || {};
      
      console.log("[LeadsGrid] Fetching for companyId:", companyId, "filters:", filters);
      
      const leadsGridData = await leadServices.getLeadsGridData(companyId, filters);
      console.log("[LeadsGrid] Service returned data:", leadsGridData);
      
      socket.emit('lead/grid/get-data-response', { done: true, data: leadsGridData });
      console.log("[LeadsGrid] Response emitted successfully");
    } catch (error) {
      console.error('[LeadsGrid] Controller error:', error);
      socket.emit('lead/grid/get-data-response', { done: false, error: error.message });
    }
  });

  // Handle lead details request
  socket.on('lead/details/get-data', async (data = {}) => {
    console.log("[LeadDetails] Received lead details request", data);
    try {
      const companyId = validateAccess(socket);
      const leadId = data.leadId;
      
      if (!leadId) {
        throw new Error('Lead ID is required');
      }
      
      console.log("[LeadDetails] Fetching for companyId:", companyId, "leadId:", leadId);
      
      const leadDetails = await leadServices.getLeadDetails(companyId, leadId);
      console.log("[LeadDetails] Service returned data:", leadDetails);
      
      socket.emit('lead/details/get-data-response', { done: true, data: leadDetails });
      console.log("[LeadDetails] Response emitted successfully");
    } catch (error) {
      console.error('[LeadDetails] Controller error:', error);
      socket.emit('lead/details/get-data-response', { done: false, error: error.message });
    }
  });

  // Handle lead update request
  socket.on('lead/update', async (data = {}) => {
    console.log("[UpdateLead] Received lead update request", data);
    try {
      const companyId = validateAccess(socket);
      const { leadId, updateData } = data;
      
      if (!leadId) {
        throw new Error('Lead ID is required');
      }
      
      if (!updateData || typeof updateData !== 'object') {
        throw new Error('Update data is required');
      }
      
      console.log("[UpdateLead] Updating for companyId:", companyId, "leadId:", leadId, "updateData:", updateData);
      
      const updateResult = await leadServices.updateLead(companyId, leadId, updateData);
      console.log("[UpdateLead] Service returned data:", updateResult);
      
      socket.emit('lead/update-response', updateResult);
      console.log("[UpdateLead] Response emitted successfully");
    } catch (error) {
      console.error('[UpdateLead] Controller error:', error);
      socket.emit('lead/update-response', { done: false, error: error.message });
    }
  });

  // Handle lead creation request
  socket.on('lead/create', async (data = {}) => {
    console.log("[CreateLead] Received lead creation request", data);
    try {
      const companyId = validateAccess(socket);
      const leadData = data;
      
      if (!leadData || typeof leadData !== 'object') {
        throw new Error('Lead data is required');
      }
      
      console.log("[CreateLead] Creating for companyId:", companyId, "leadData:", leadData);
      
      const createResult = await leadServices.createLead(companyId, leadData);
      console.log("[CreateLead] Service returned data:", createResult);
      
      socket.emit('lead/create-response', createResult);
      console.log("[CreateLead] Response emitted successfully");
    } catch (error) {
      console.error('[CreateLead] Controller error:', error);
      socket.emit('lead/create-response', { done: false, error: error.message });
    }
  });

  // Handle lead deletion request
  socket.on('lead/delete', async (data = {}) => {
    console.log("[DeleteLead] Received lead deletion request", data);
    try {
      const companyId = validateAccess(socket);
      const { leadId } = data;
      
      if (!leadId) {
        throw new Error('Lead ID is required');
      }
      
      console.log("[DeleteLead] Deleting for companyId:", companyId, "leadId:", leadId);
      
      const deleteResult = await leadServices.deleteLead(companyId, leadId);
      console.log("[DeleteLead] Service returned data:", deleteResult);
      
      socket.emit('lead/delete-response', deleteResult);
      console.log("[DeleteLead] Response emitted successfully");
    } catch (error) {
      console.error('[DeleteLead] Controller error:', error);
      socket.emit('lead/delete-response', { done: false, error: error.message });
    }
  });
};

export default leadController;

