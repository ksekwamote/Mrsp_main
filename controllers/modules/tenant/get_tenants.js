const promise_query = require("../utils/promise_connection");

module.exports = (params) => {
  return new Promise((resolve, reject) => {
    promise_query(
      "select ActiveTenant.ID, Listing.location, Listing.plot, Tenant.first_name, ActiveTenant.tenancy_period from ActiveTenant join Tenant on ActiveTenant.TenantID = Tenant.ID join Listing on ActiveTenant.ListingID = Listing.ID where ActiveTenant.ListingID IN (select ID from Listing where Listing.LandLordID = ?)",
      [params.landlord_id]
    )
      .then((result) => {
        resolve({ tenants: result });
      })
      .catch((error) => reject(error));
  });
};
