const promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {
        promise_query('select * from ActiveTenant where RentalPresetID = ? ', [params.rental_preset_id])
        .then(result => {
            if(result.length > 0) return reject({message: 'The Rental Preset has Active Tenants associated with it and cannot be Deleted. Terminating an Active Tenants Account will delete this preset as well.'})

            return promise_query('select * from Listing where RentalPresetID = ?', [params.rental_preset_id]);
        })
        .then(result => {
            if(result.length > 0) return reject({message: 'This Rental Preset is the Default Preset on one or more listings. Apply a new Default and try again.'});

            return promise_query('delete from RentalPreset where ID = ? ', [params.rental_preset_id]);
        })
        .then(result => resolve({url: '/listings/view_listing?id=' + params.listing_id}))
        .catch(error => reject(error));
    });
};
