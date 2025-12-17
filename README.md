==============================================================================
PROJECT NAME: SLU Swap and Bid (BidOps)
TEAM NAME:    312Team-BidOps
DATE:         December 2025
==============================================================================

1. SYSTEM OVERVIEW
------------------------------------------------------------------------------
This is a Hybrid Web Application running on an Ubuntu Server (VirtualBox).
It consists of three parts:
1. CLIENT SIDE (PHP/Apache):    Port 80   (http://<IP>/BidOps/client)
2. ADMIN SIDE (Node.js/Express): Port 3000 (http://<IP>:3000)
3. DATABASE (MySQL):            Port 3306

2. PREREQUISITES
------------------------------------------------------------------------------
- VirtualBox installed on Host Machine.
- Ubuntu Server 24.04 LTS ISO.
- Internet connection on the VM (Bridged Adapter recommended).

3. SOFTWARE INSTALLATION (Run inside Ubuntu)
------------------------------------------------------------------------------
Update the system and install required packages:

$ sudo apt update
$ sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql php-mysqli git unzip nodejs npm -y

Verify versions:
$ node -v  (Should be v12+)
$ npm -v
$ php -v

4. PROJECT DEPLOYMENT
------------------------------------------------------------------------------
STEP 1: SETUP WEB DIRECTORY
   1. Create directory and set permissions:
      $ sudo mkdir -p /var/www/html/BidOps
      $ sudo chown -R $USER:$USER /var/www/html/BidOps

   2. Move your project files into this folder. 
      (You can use Git Clone or FTP to transfer files from Windows).
      Target Path: /var/www/html/BidOps/

   3. Set permissions for File Uploads:
      $ sudo chmod -R 777 /var/www/html/BidOps/server/item/uploads

STEP 2: DATABASE CONFIGURATION (Crucial)
   1. Start MySQL:
      $ sudo systemctl start mysql

   2. Configure Root Password to 'root':
      $ sudo mysql
      
      (Run these SQL commands inside MySQL):
      ------------------------------------------------------------------
      ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';
      FLUSH PRIVILEGES;
      EXIT;
      ------------------------------------------------------------------

   3. Import the Database:
      $ sudo mysql -u root -p bidops < /var/www/html/BidOps/database/bidops.sql
      (Enter password 'root' when prompted).

STEP 3: TAILWIND CSS SETUP (Styling)
   If the CSS is missing or you need to recompile styles:

   1. Navigate to the Client folder (where tailwind.config.js is located):
      $ cd /var/www/html/BidOps/client

   2. Install Node Dependencies for Tailwind:
      $ npm install

   3. Build the CSS file:
      $ npx tailwindcss -i ./styles/input.css -o ./styles/output.css
   
   (Note: Ensure your HTML files link to the generated 'output.css').

STEP 4: START THE ADMIN SERVER (Node.js)
   1. Navigate to the Admin Server folder:
      $ cd /var/www/html/BidOps/admin-server

   2. Install Dependencies:
      $ npm install
      $ sudo npm install -g nodemon

   3. Allow Port 3000 through Firewall:
      $ sudo ufw allow 3000/tcp
      $ sudo ufw reload

   4. Start the Server:
      $ node server.js
      
   (Keep this terminal open to keep the Admin Panel running).

5. CONFIGURATION FILES CHECKLIST
------------------------------------------------------------------------------
Ensure your code connects using the password 'root'.

1. PHP Config: /server/config/database.php
   ---------------------------------------
   private $username = "root";
   private $password = "root"; 
   ---------------------------------------

2. Node Config: /admin-server/database.js
   ---------------------------------------
   user: 'root',
   password: 'root',
   ---------------------------------------

6. HOW TO ACCESS (TESTING)
------------------------------------------------------------------------------
1. Find your Ubuntu IP Address:
   $ ip a
   (Look for 'inet' under enp0s3, e.g., 192.168.1.15).

2. Access Client (PHP) on Windows Browser:
   http://192.168.1.15/BidOps/client/login.html

3. Access Admin (Node) on Windows Browser:
   http://192.168.1.15/BidOps/client/login.html
   (Login as Admin -> System will redirect to Port 3000 Dashboard).

7. CREDENTIALS
------------------------------------------------------------------------------
[ STANDARD USER ]
Username: John
Password: pass123

[ ADMIN USER ]
Username: superadmin
Password: adminpass

8. TROUBLESHOOTING
------------------------------------------------------------------------------
- "Connection Refused": 
  Check if variables in database.js match the SQL command in Step 2.
  
- "Styles not loading": 
  Run the Tailwind build command in Step 3.

- "Images not showing":
  Check if /server/item/uploads has 777 permissions.

==============================================================================