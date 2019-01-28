
function removeAll() {
    messageBox("<p> Type 'DELETE' to delete!  </p><br><input id='input_delete' type='text' class='form-control'>", "Confirm remove", null, null, function(){
        if($('#input_delete').val() === 'DELETE') {
            ajx(routes.cronjobsstatus, 'delete', {}, function (response) {
                if (response.resCode === 400) {
                    toastr.error(JSON.stringify(response.error));
                } else {
                    location.reload();
                }
            });
        }
    });
}