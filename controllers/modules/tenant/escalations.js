const query = require("../utils/promise_connection");
const handle = require("../utils/handle");

module.exports = async (params) => {
  var [result, error] = await handle(
    query(
      "select ScheduledEscalation.*, concat(Tenant.first_name,' ', Tenant.last_name) as fullname, Listing.plot, Listing.location, Listing.ID as listing_id from ScheduledEscalation join ActiveTenant on ScheduledEscalation.ActiveTenantID = ActiveTenant.ID join Listing on ActiveTenant.ListingID = Listing.ID join Tenant on ActiveTenant.TenantID = Tenant.ID order by ScheduledEscalation.effective_date desc",
      []
    )
  );

  return { escalations: result };
};
