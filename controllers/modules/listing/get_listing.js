var promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {
        var payload = {};

        promise_query('select * from Listing where ID = ?', [params.listing_id])
        .then((listing) => {
            payload['listing'] = listing[0];
            return promise_query('select * from RentalPreset where LandLordID = ?', [payload.listing.LandLordID]);
        })
        .then((rental_presets) => {
            payload['rental_presets'] = rental_presets;
            return promise_query('select * from ScreeningPreset where LandLordID = ?', [payload.listing.LandLordID]);
        })
        .then((screening_presets) => {
            payload['screening_presets'] = screening_presets;
            return promise_query('select PendingTenant.ID, PendingTenant.email_address, PendingTenant.phone_number, ActiveTenant.rental_code from PendingTenant join ActiveTenant on PendingTenant.ActiveTenantID = ActiveTenant.ID where ActiveTenant.ListingID = ?', [params.listing_id]);
        })
        .then(pending_tenants => {
            payload['pending_tenants'] = pending_tenants;
            return promise_query('select ActiveTenant.ID, Tenant.first_name, Tenant.email_address, ActiveTenant.move_in_date, ActiveTenant.rental_code,  ActiveTenant.tenancy_period from Tenant join ActiveTenant on Tenant.ID = ActiveTenant.TenantID where ActiveTenant.ListingID = ? and ActiveTenant.TenantID != ?', [params.listing_id, 0]);
        })
        .then(active_tenants => {
            payload['active_tenants'] = active_tenants;
            return promise_query('select company_name as fullname from LandLord where ID IN(select LandLordID from Listing where ID = ?)',[params.listing_id]);
        })
        .then(landlord => {
            payload['landlord_name'] = landlord[0].fullname;
            return resolve(payload);
        })
        .catch(error => reject(error));
    });
};
