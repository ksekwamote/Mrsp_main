

$('#service_request_modal').on('show.bs.modal', (event) => {

    var button = $(event.relatedTarget);

    if(button.data('service_request')){

        var request = button.data('service_request');
        document.getElementById('status').innerHTML = request.status;
        document.getElementById('date').innerHTML = "<b>Date Reported: </b>" + request.date_reported;
        document.getElementById('title').innerHTML = request.title;
        //document.getElementById('urgency').innerHTML = "<b>Urgency:</b> " + request.urgency;
        document.getElementById('date_available').innerHTML = "<b>Available for Service:</b> " + request.date_available;
        document.getElementById('authorized_rep_name').innerHTML = "<b>Authorized Rep:</b> " + request.authorized_rep_name;
        document.getElementById('authorized_rep_number').innerHTML = "<b>Rep Contact: </b>" + request.authorized_rep_number;
        document.getElementById('description').innerHTML = request.description;
        if (request.status !== 'pending') {
          document.getElementById('assigned_respondent').innerHTML =  "<b>Assigned Respondent: </b>" + request.assigned_respondent;
          document.getElementById('respondent_contact').innerHTML =  "<b>Respondent Contact: </b>" +request.respondent_contact;
        }

        document.getElementById('resolve_button').onclick = (event) => {
            $.ajax({
                method: "post",
                url: "/tenants/resolve_incident",
                data: {
                    service_request_id: request.ID,
                    listing_id: request.listing_id,
                    email: request.email_address,
                    title: request.title,
                    active_tenant_id: request.ActiveTenantID,
                    labour_cost: document.getElementById('labour_cost').value,
                    supply_cost: document.getElementById('supply_cost').value,
                    vat: document.getElementById('vat').value,
                    date: new Date().toISOString().split('T')[0]
                },

                success: function(data){
                    $('#service_request_modal').modal('hide');
                },

                error: function(error){
                    console.log(error.message);
                }

            });
        };

        document.getElementById('assign_btn').onclick = (event) => {

          var name = document.getElementById('assigned_respondent_a').value;
          var contact = document.getElementById('respondent_contact_a').value;
          if(name.length > 0 && contact.length > 0){
            $.ajax({
              method:'post',
              url: '/tenants/assign_respondent',
              data: {
                assigned_respondent: name,
                respondent_contact: contact,
                service_request_id: request.ID,
                email_address: request.email_address,
                date: new Date().toDateString()
              },

              success: function(data){
                document.getElementById('assigned_respondent').innerHTML =  "<b>Assigned Respondent: </b>" + name
                document.getElementById('respondent_contact').innerHTML =  "<b>Respondent Contact: </b>" + contact;
                document.getElementById('date_assigned').innerHTML =  "<b>Assigned: </b>" + new Date().toDateString();
                document.getElementById('assigned_respondent_a').value = '';
                document.getElementById('respondent_contact_a').value = '';

              },

              error: function(error){
                  console.log(error.message);
              }
            });
          }

        };

        if(request.status === 'resolved'){
            document.getElementById('resolve_button').style = "display: none;";
        }

    }

});
function post_to_noticeboard(listing_id, active_tenant_id){
    $.ajax({
        method: "post",
        url: "/tenants/post_notice",
        data: {
            all: document.getElementById('all').checked,
            listing_id: listing_id,
            active_tenant_id: active_tenant_id,
            message: document.getElementById('message').value,
            date: new Date().toDateString(),
            email: document.getElementById('email_address').innerHTML

        },

        success: function(data){
            $('#noticeboard_modal').modal('hide');
        },

        error: function(error){
            console.log(error.message);
        }

    });

}
