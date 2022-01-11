var promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {
        promise_query('delete from PendingTenant where ID = ?', [params.pending_tenant_id])
        .then(result => promise_query('delete from ActiveTenant where rental_code = ? ', [params.rental_code]))
        .then(result => resolve({url: '/listings/view_listing?id=' + params.listing_id}))
        .catch(error => reject(error));
    });
};
