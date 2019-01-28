function newSlack(){

    $("#add_slack").modal("show");

    $("#slack-channel").val("");
    $("#slack-token").val("");


    $("#slack-save").unbind("click"); // remove existing events attached to this
    $("#slack-save").click(function(){

        let fields = ['slack-channel', 'slack-token'];
        let errors = validateFields(fields);

        let channel = $("#slack-channel").val();
        let token = $("#slack-token").val();

        if(errors){
            toastr.error("Please fill the form");
            return false;
        }

        let params = {channel: channel, token: token};

        ajx(routes.slack, 'post', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });

    });
}

function editSlack(_id){
    var slack = null;
    slacks.forEach(function(slk){
        if(slk._id === _id)
            slack = slk;
    });
    if(slack) {

        $("#add_slack").modal("show");

        $("#slack-channel").val(slack.channel);
        $("#slack-token").val(slack.token);
    }

    $("#slack-save").unbind("click"); // remove existing events attached to this
    $("#slack-save").click(function(){

        let fields = ['slack-channel', 'slack-token'];
        let errors = validateFields(fields);

        let channel = $("#slack-channel").val();
        let token = $("#slack-token").val();


        if(errors){
            toastr.error("Please fill the form");
            return false;
        }

        let params = {channel: channel, token: token, _id: slack._id};

        ajx(routes.slack, 'put', params, function(response){
            if(response.resCode === 400){ toastr.error(JSON.stringify(response.error)); } else { location.reload(); }
        });

    });
}

function deleteSlack(_id){
    messageBox("<p> Do you want to delete this slack job? </p><br><input id='input_delete' type='text' class='form-control'>", "Confirm delete", null, null, function(){
        if($('#input_delete').val() === 'DELETE') {
            ajx(routes.slack, 'delete', {_id: _id}, function (response) {
                if (response.resCode === 400) {
                    toastr.error(JSON.stringify(response.error));
                } else {
                    location.reload();
                }
            });
        }
    });
}