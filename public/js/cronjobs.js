function newCronJob(){

    $("#add_cronjob").modal("show");

    $("#cronjob-name").val("");
    $("#cronjob-schedule").val("");
    $("#cronjob").val("");
    $("#cronjob-commented").prop('checked', false);

    $("#cronjob-save").unbind("click"); // remove existing events attached to this
    $("#cronjob-save").click(function(){


        let fields = ['cronjob-name', 'cronjob'];
        let errors = validateFields(fields);

        let name = $("#cronjob-name").val();
        let job = $("#cronjob").val();
        let schedule = $("#cronjob-schedule").val();
        let commented = $('#cronjob-commented').prop('checked');


        if(errors){
            toastr.error("Please fill the form");
            return false;
        }

        let params = {name: name, job: job, schedule: schedule, commented: commented};

        ajx(routes.cronjobs, 'post', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });
    });
}

function editJob(_id){
    let cronjob = null;
    cronjobs.forEach(function(cron){
        if(cron._id === _id)
            cronjob = cron;
    });
    if(cronjob) {

        $("#add_cronjob").modal("show");
        $("#cronjob-name").val(cronjob.name);
        $("#cronjob-schedule").val(cronjob.schedule);
        $("#cronjob").val(cronjob.job);
        $("#cronjob-commented").prop('checked', JSON.parse(cronjob.commented));

    }

    $("#cronjob-save").unbind("click"); // remove existing events attached to this
    $("#cronjob-save").click(function(){

        let fields = ['cronjob-name', 'cronjob', 'cronjob-schedule'];
        let errors = validateFields(fields);

        let name = $("#cronjob-name").val();
        let job = $("#cronjob").val();
        let schedule = $("#cronjob-schedule").val();
        let commented = $('#cronjob-commented').prop('checked');

        if(errors){
            toastr.error("Please fill the form");
            return false;
        }

        let params = {_id: cronjob._id, name: name, job: job, schedule: schedule, commented: commented};

        ajx(routes.cronjobs, 'put', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });
    });
}

function deleteJob(_id){
    messageBox("<p> Type 'DELETE' to delete! </p><br><input id='input_delete' type='text' class='form-control'>", "Confirm delete", null, null, function(){
        if($('#input_delete').val() === 'DELETE') {
            ajx(routes.cronjobs, 'delete', {_id: _id}, function (response) {
                if (response.resCode === 400) {
                    toastr.error(JSON.stringify(response.error));
                } else {
                    location.reload();
                }
            });
        }
    });
}
