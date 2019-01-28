# crontab-manage
Manage crontab from centralized master server.  

Deploy cronjobs to crontab using ansible to any server and get logs real time to the master dashboard
  
You can add/edit/update/delete servers, crons and even deployed crons
  
Your footprint will be revoked if you will remove the server

# note
Cron watcher which will be deployed to servers is written in php and will expect `PHP` and `CURL` to be installed on servers
    
Make your ansible hosts file writtable which will be present inside `/etc/ansible/hosts`  


# setup
$ `sudo npm install`  
$ `sudo npm install -g pm2`  
$ `sudo apt install ansible`  
$ `sudo apt install ssh-keyscan`  
$ `sudo chmod 777 /etc/ansible/hosts`

# generate ssh-key
Generate ssh-key which will be placed to servers for accessing
  
$ `ssh-keygen`

By default it will create id_rsa.pub inside ~/.ssh/ folder

# config
Change your domain name inside **scripts** folder
cron_watcher.php
replace **mydomain.com** to your domain name where your app will be hosted

**All the global constants are placed in app.js file, change them as you desired**

# run server
pm2 start app.js
