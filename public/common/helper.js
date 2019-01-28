function ajx(route, method, params, callback){
    loader(true);
    $.ajax({
        method: method,
        url: '/api' + route,
        dataType:'json',
        data: params,
        success: function (response) {
            loader(false);
            return callback(response);
        },
        error: function (err) {
            loader(false);
            return callback(err);
        }
    })
}

function validateFields(fields){
    let error = false;
    for(let i = 0; i < fields.length; i++){
        let field = fields[i];
        if($('#'+field).val() === '' || $('#'+field).val() === 'null'){
            error = true;
            break;
        }
    }
    return error;
}

function loader(bool) {
    return (bool === true ? $('.loader').css('display', 'block') : $('.loader').css('display', 'none'));
}

/*********** MessageBox ****************/
// simply show info.  Only close button
function infoMessageBox(message, title){
    $("#info-body").html(message);
    $("#info-title").html(title);
    $("#info-popup").modal('show');
}

// like info, but for errors.
function errorMessageBox(message) {
    let msg =
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

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


