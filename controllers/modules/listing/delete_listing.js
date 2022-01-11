const promise_query = require('../utils/promise_connection');


module.exports = (params) => {
    return new Promise((resolve, reject) => {
        promise_query('delete from ActiveTenant where ListingID = ?', [params.listing_id])
        .then(result => promise_query('delete from Listing where ID = ?', [params.listing_id]))
        .then(result => resolve({url: '/listings/'}))
        .catch(error => reject(error));

    });
};
