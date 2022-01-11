const promise_query = require('../utils/promise_connection');

module.exports = (params) => {
    return new Promise((resolve, reject) => {

        var listing_id = params.listing_id;
        console.log(listing_id);
        if(params.update === 'true'){

            promise_query('update ScreeningPreset set name =?, questions=?, required_documents=?, viewing_slots=? where ID = ?',
            [params.name, params.questions, params.required_documents, params.viewing_slots, params.screening_preset_id])
            .then(result => resolve({url: '/listings/view_listing?id=' + listing_id}))
            .catch(error => reject(error));

        }else{
            delete params['listing_id'];
            delete params['screening_preset_id'];
            delete params['update'];

            promise_query('insert into ScreeningPreset set ?' , [params])
            .then(result => resolve({url: '/listings/view_listing?id=' + listing_id}))
            .catch(error => reject(error));
        }

    });
};
