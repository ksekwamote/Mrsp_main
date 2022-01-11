const promise_query = require("../utils/promise_connection");

module.exports = (params) => {
  return new Promise((resolve, reject) => {
    promise_query(
      "select RentalApplication.ID as rental_application_id, Listing.ID as listing_id, Listing.plot, Listing.location, RentalApplication.date, Screening.viewing_slot,Tenant.first_name from RentalApplication join Listing on RentalApplication.ListingID = Listing.ID join Screening on Screening.RentalApplicationID = RentalApplication.ID  join Tenant on RentalApplication.TenantID = Tenant.ID where Listing.LandLordID = " +
        params.landlord_id +
        " and  RentalApplication.status = 0",
      []
    )
      .then((results) => resolve({ applications: results }))
      .catch((error) => reject(error));
  });
};
