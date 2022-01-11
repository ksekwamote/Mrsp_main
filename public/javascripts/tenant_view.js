

function create_payment(active_tenant_id){

    var payload = {
        active_tenant_id:active_tenant_id,
        description: document.getElementById('payment_description').value,
        amount: document.getElementById('payment_amount').value,
        due_date: document.getElementById('payment_due_date').value,
        status: 'due',
        email: document.getElementById('email_address').innerHTML
    };

    $.ajax({
        method: "post",
        url: "/tenants/create_payment",
        data:payload,
        success: function(data){
            $('#create_payment_modal').modal('hide');

            var row = document.createElement('tr');

            var index = document.createElement('td');
            var description = document.createElement('td');
            var amount = document.createElement('td');
            var status = document.createElement('td');
            var due_date = document.createElement('td');

            description.innerHTML = payload.description;
            amount.innerHTML = payload.amount;
            due_date.innerHTML = payload.due_date;
            status.innerHTML = payload.status;

            row.appendChild(index);
            row.appendChild(description);
            row.appendChild(amount);
            row.appendChild(due_date);
            row.appendChild(status);

            document.getElementById('payments_table').appendChild(row);

        },

        error: function(error){
            console.log(error.message);
        }

    });

}
