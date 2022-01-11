const promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {
        promise_query('select * from Screening where ScreeningPresetID = ? ', [params.screening_preset_id])
        .then(result => {
            if(result.length > 0) return reject({message: 'This Screening Preset cannot be deleted because there are Applicant Screenings associated with it.'})

            return promise_query('select * from Listing where ScreeningPresetID = ?', [params.screening_preset_id]);
        })
        .then(result => {
            if(result.length > 0) return reject({message: 'This Screening Preset is the Default Preset on one or more listings. Apply a new Default and try again.'});

            return promise_query('delete from ScreeningPreset where ID = ? ', [params.screening_preset_id]);
        })
        .then(result => resolve({url: '/listings/view_listing?id=' + params.listing_id}))
        .catch(error => reject(error));
    });
};
