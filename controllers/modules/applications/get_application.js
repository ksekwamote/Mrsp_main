const promise_query = require("../utils/promise_connection");

module.exports = (params) => {
  var payload = {};
  return new Promise((resolve, reject) => {
    promise_query("select * from RentalApplication where ID = ?", [
      params.application_id,
    ])
      .then((application) => {
        payload["application"] = application[0];
        return promise_query("select * from Tenant where ID = ?", [
          payload.application.TenantID,
        ]);
      })
      .then((tenant) => {
        payload["tenant"] = tenant[0];
        return promise_query(
          "select * from Screening where RentalApplicationID = ?",
          [payload.application.ID]
        );
      })
      .then((screening) => {
        payload["screening"] = screening[0];
        return promise_query(
          "select Tenant.first_name, RentalApplication.ID as application_id, RentalApplication.monthly_rent, RentalApplication.security_deposit, RentalApplication.lease_term, RentalApplication.tentative_move_in from RentalApplication join Tenant on RentalApplication.TenantID = Tenant.ID where RentalApplication.ListingID = ? and RentalApplication.TenantID != ?",
          [payload.application.ListingID, payload.application.TenantID]
        );
      })
      .then((offers) => {
        payload["offers"] = offers;
        return promise_query(
          "select * from RentalPreset where LandLordID IN(select LandLordID from Listing where ID = ?)",
          [payload.application.ListingID]
        );
      })
      .then((rental_presets) => {
        payload["rental_presets"] = rental_presets;

        return promise_query(
          "select Listing.ID, Listing.plot, RentalPreset.monthly_rent, RentalPreset.security_deposit from  Listing join RentalPreset on Listing.RentalPresetID = RentalPreset.ID where Listing.ID = ?",
          [payload.application.ListingID]
        );
      })
      .then((listing) => {
        payload["listing"] = listing[0];
        console.log(payload);
        return resolve(payload);
      })
      .catch((error) => reject(error));
  });
};
