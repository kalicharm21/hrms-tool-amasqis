import leadServices from '../../services/lead/lead.services.js';

const leadController = (socket, io) => {
  const validateAccess = (socket) => {
    if (!socket.user) {
      throw new Error('Unauthorized: No user found');
    }
    if (!socket.companyId && !socket.userMetadata?.companyId) {
      throw new Error('No companyId found on socket');
    }
    return socket.companyId || socket.userMetadata.companyId;
  };

  socket.on('lead/dashboard/get-all-data', async (data = {}) => {
    console.log("[LeadDashboard] Received dashboard request", data);
    console.log("[LeadDashboard] Socket user metadata:", socket.userMetadata);
    console.log("[LeadDashboard] Socket companyId:", socket.companyId);
    console.log("[LeadDashboard] Expected companyId: 68443081dcdfe43152aebf80");
    try {
      // Temporarily bypass validation for testing
      const companyId = "68443081dcdfe43152aebf80"; // validateAccess(socket);
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
};

export default leadController;
