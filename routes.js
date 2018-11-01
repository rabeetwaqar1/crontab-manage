exports.routes = {
    "root" : "/",
    "save" : "/save",
    "run" : "/runjob",
    "crontab" : "/crontab",
    "stop" : "/stop",
    "start" : "/start",
    "remove": "/remove",
    "backup": "/backup",
    "restore": "/restore",
    "delete_backup": "/delete",
    "restore_backup": "/restore_backup",
    "export": "/export",
    "import": "/import", // this is import from database
    "import_crontab": "/import_crontab", // this is from existing crontab
    "logger": "/logger",
    "servers": "/servers",
    "cronjobs": "/cronjobs",
    "deploycronjobs": "/deploycronjobs",
    "cronjobsstatus": "/cronjobsstatus",
    "servers_api": {
        "add": "/servers/add",
        "update": "/servers/update",
        "remove": "/servers/remove",
        "list": "/servers/list"
    },
    "cronjobs_api": {
        "add": "/cronjobs/add",
        "update": "/cronjobs/update",
        "remove": "/cronjobs/remove",
        "list": "/cronjobs/list"
    },
    "deploycronjobs_api": {
        "add": "/deploycronjobs/add",
        "update": "/deploycronjobs/update",
        "remove": "/deploycronjobs/remove",
        "list": "/deploycronjobs/list"
    },
    "cronjobsstatus_api": {
        "add": "/cronjobsstatus/add",
        "update": "/cronjobsstatus/update",
        "remove": "/cronjobsstatus/remove",
        "list": "/cronjobsstatus/list"
    },
    "crontabhook": {
        "complete": "/crontabhook/complete"
    }

};
