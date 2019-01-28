<?php

$distribution = strtolower(shell_exec("python -c 'import platform;print(platform.platform())'"));
$dis = "centos";
$log_path = "/var/log/";
if(strpos($distribution, "ubuntu")){
    $dis = "ubuntu";
}
$fh = fopen('/opt/cron_watcher.txt','r');
$cron_errors = array();
$hostname = shell_exec("hostname -I | cut -d' ' -f1");
if(empty($hostname)) {
    $hostname = shell_exec("hostname -s");
}

function cleanSpecialChars($string) {
    $string = str_replace(' ', '-', $string); // Replaces all spaces with hyphens.
    return preg_replace('/[^A-Za-z0-9\-]/', '', $string); // Removes special chars.
}

while ($line = fgets($fh)) {
    if(!empty($line) && isset($line)) {
        $cron_id = trim($line);
        $cmd = "tail -3 ".$log_path."".$cron_id.".log | grep 'CronRun @ Error' -A2";
        $output = shell_exec($cmd);
        $output = trim($output);
        if(!empty($output) && isset($output)) {
            $spl = explode("\n", $output);
            $spl[2] = cleanSpecialChars($spl[2]);
            $obj = new stdClass();
            $obj->cron_id = $cron_id;
            $obj->distribution = $dis;
            $obj->hostname = $hostname;
            $obj->output = $spl;
            $cron_errors[] = $obj;
        }
    }
}

fclose($fh);

if(count($cron_errors) > 0) {
    $json = json_encode($cron_errors);
    $domain = "http://35.157.227.228:9000";
    $path = "/api/cronjobsstatus/listener";
    $cmd = "echo '" . $json . "' | curl --header 'Content-Type: application/json' -d @- $domain" . $path;
    $response = shell_exec($cmd);
}

?>
