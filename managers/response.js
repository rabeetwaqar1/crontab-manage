exports.response = {
    success: function (data = [], message = 'SUCCESS') {
        return {
            resCode: 200,
            message: message,
            data: data
        }
    },
    failure: function (error = null, message = 'FAILURE') {
        return {
            resCode: 400,
            message: message,
            error: error
        }
    },
    forbidden: function () {
        return {
            resCode: 401,
            message: 'UNAUTHORIZED'
        }
    }
};