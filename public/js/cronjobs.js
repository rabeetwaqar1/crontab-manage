/*jshint esversion: 6 */
/*********** MessageBox ****************/
// simply show info.  Only close button
function infoMessageBox(message, title){
    $("#info-body").html(message);
    $("#info-title").html(title);
    $("#info-popup").modal('show');
}
// like info, but for errors.
function errorMessageBox(message) {
    var msg =
        "Operation failed: " + message + ". " +
        "Please see error log for details.";
    infoMessageBox(msg, "Error");
}
// modal with full control
function messageBox(body, title, ok_text, close_text, callback){
    $("#modal-body").html(body);
    $("#modal-title").html(title);
    if (ok_text) $("#modal-button").html(ok_text);
    if(close_text) $("#modal-close-button").html(close_text);
    $("#modal-button").unbind("click"); // remove existing events attached to this
    $("#modal-button").click(callback);
    $("#popup").modal("show");
}


function newCronJob(){

    $("#add_cronjob").modal("show");

    $("#cronjob-name").val("");
    $("#cronjob-schedule").val("");
    $("#cronjob").val("");

    $("#cronjob-save").unbind("click"); // remove existing events attached to this
    $("#cronjob-save").click(function(){

        let fields = ['cronjob-name', 'cronjob'];
        let errors = validateFields(fields);

        let name = $("#cronjob-name").val();
        let job = $("#cronjob").val();
        let schedule = $("#cronjob-schedule").val();
        var data = {name: name, job: job, schedule: schedule};

        if(errors){
            alert("Please fill the form");
            return false;
        }
        loader('show');

        $.post(routes.cronjobs_api.add, data, function(response){
            location.reload();
        });
    });
}

function editJob(_id){
    var cronjob = null;
    cronjobs.forEach(function(cron){
        if(cron._id === _id)
            cronjob = cron;
    });
    if(cronjob) {

        $("#add_cronjob").modal("show");
        $("#cronjob-name").val(cronjob.name);
        $("#cronjob-schedule").val(cronjob.schedule);
        $("#cronjob").val(cronjob.job);
    }

    $("#cronjob-save").unbind("click"); // remove existing events attached to this
    $("#cronjob-save").click(function(){

        let fields = ['cronjob-name', 'cronjob', 'cronjob-schedule'];
        let errors = validateFields(fields);

        let name = $("#cronjob-name").val();
        let job = $("#cronjob").val();
        let schedule = $("#cronjob-schedule").val();

        var data = {_id: cronjob._id, name: name, job: job, schedule: schedule};

        if(errors){
            alert("Please fill the form");
            return false;
        }
        loader('show');
        $.post(routes.cronjobs_api.update, data, function(response){
            location.reload();
        });
    });
}

function deleteJob(_id){
    // TODO fix this. pass callback properly
    messageBox("<p> Do you want to delete this job? </p>", "Confirm delete", null, null, function(){
        loader('show');
        $.post(routes.cronjobs_api.remove, {_id: _id}, function(){
            location.reload();
        });
    });
}

function validateFields(fields){
    let error = false;
    for(var i = 0; i < fields.length; i++){
        let field = fields[i];
        if($('#'+field).val() === ''){
            error = true;
            break;
        }
    }
    return error;
}

function loader(bool) {
    if(bool === 'show'){
        $('.loader').css('display', 'block');
    }else{
        $('.loader').css('display', 'none');
    }

}