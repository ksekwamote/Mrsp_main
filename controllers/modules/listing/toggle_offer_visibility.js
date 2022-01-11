const promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {

        promise_query('update Listing set show_offers = ? where ID = ?', [params.visible, params.listing_id])
        .then(result => resolve({url: '/listings/view_listing?id=' + params.listing_id}))
        .catch(error => reject(error));

    });
};
