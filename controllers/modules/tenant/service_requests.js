const query = require("../utils/promise_connection");
const handle = require("../utils/handle");

module.exports = async (params) => {
  var [service_requests, error] = await handle(
    query(
      "select concat(Tenant.first_name,' ', Tenant.last_name) as fullname, Tenant.email_address, Listing.plot, Listing.location, Listing.ID as listing_id, ServiceRequest.* from ServiceRequest join ActiveTenant on ServiceRequest.ActiveTenantID = ActiveTenant.ID join Tenant on ActiveTenant.TenantID = Tenant.ID join Listing on ActiveTenant.ListingID = Listing.ID order by date_reported, status",
      []
    )
  );

  handle.throw(error);

  return { service_requests: service_requests };
};
