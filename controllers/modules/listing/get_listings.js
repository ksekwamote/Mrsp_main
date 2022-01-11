const promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {

        promise_query('select * from Listing where LandLordID = ?', [params.landlord_id])
        .then(listings => resolve({listings:listings}))
        .catch(error => reject(error));

    });
};
