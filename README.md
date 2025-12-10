sudo==============================================================================
PROJECT NAME: SLU Bid and Swap
TEAM NAME:    312Team-BidOps
DATE:         December 2025
==============================================================================

PREREQUISITES
- Virtual Box
- Ubuntu Server ISO (LTS 24.04.3)

1. SYSTEM OVERVIEW
------------------------------------------------------------------------------
This web application is a hybrid system built for an Ubuntu Server environment 
hosted on VirtualBox. It integrates:
1. PHP Module (User/Client Side) - Hosted on Apache (Port 80)
2. NodeJS Module (Admin Side)    - Hosted on Express (Port 3000)
3. Database                      - MySQL Server

2. VIRTUALBOX ENVIRONMENT SETUP
------------------------------------------------------------------------------
To replicate the development environment, please configure your Virtual Machine 
as follows:

A. VM Configuration
   - OS: Ubuntu Server (LTS 24.04.3)
   - RAM: 2048 MB (Minimum)
   - Network Adapter: NAT (Recommended)

B. Port Forwarding Rules (Crucial for Access) --  We'll be using bridged tho so this will be modified
   Since the VM uses NAT, you must set up Port Forwarding to access the site 
   from your Windows/Host browser.
   
   1. Go to Devices > Network > Network Settings...
   2. Ensure "Attached to" is set to NAT.
   3. Click Advanced > Port Forwarding.
   4. Add the following two rules:

   | Name      | Protocol | Host Port | Guest Port |
   |-----------|----------|-----------|------------|
   | Apache    | TCP      | 80        | 80         |
   | NodeAdmin | TCP      | 3000      | 3000       |
C. Account 
	username : user
	password : user
3. SOFTWARE INSTALLATION (Inside Ubuntu)
------------------------------------------------------------------------------
Run the following commands to install Apache, MySQL, PHP, and Node.js:

1. Update System:
   $ sudo apt update

2. Install the Stack:
   $ sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql php-mysqli git -y

3. Install Node.js and NPM:
   $ sudo apt install nodejs npm -y


4. DEPLOYMENT GUIDE
------------------------------------------------------------------------------
Follow these steps to deploy the application code and database.



STEP 1: DEPLOY CODE TO APACHE PHP (USER MODULE)
   clone the repo first -- $ git clone -b finals https://github.com/miztaro/BidOps.git
   1. Create the project directory:
      $ sudo mkdir -p /var/www/html/BidOps
   2. Move the project files (from your unzipped folder or git clone):
      $ sudo cp -r BidOps/* /var/www/html/BidOps/
   3. Set Permissions (Crucial for file uploads):
      $ sudo chown -R www-data:www-data /var/www/html/BidOps
      $ sudo chmod -R 755 /var/www/html/BidOps
      $ sudo chmod -R 777 /var/www/html/BidOps/server/item/uploads

STEP 2: START THE NODE.JS SERVER (ADMIN MODULE) //we dont have nodejs yet so ignore 
   1. Navigate to the project folder:
      $ cd /var/www/html/BidOps
   2. Install Dependencies:
      $ sudo npm install
   3. Start the Server:
      $ node app.js
      (Keep this terminal open to keep the Admin site running).
      
STEP 3: DATABASE SETUP
   1. Start MySQL and enable it:
      $ sudo systemctl start mysql
      $ sudo systemctl enable mysql
   2. Create the Database and Import Data:
      $ sudo mysql -u root < BidOps/database/bidops.sql
      (Note: Ensure your PHP config matches your MySQL root password).
6. TESTING GUIDE
------------------------------------------------------------------------------
Open your browser on the Host Machine (Windows) and use the following URLs.

TEST SCENARIO A: USER MODULE (PHP)
   1. URL: http://localhost:8080/BidOps/client/login.html or http://localhost/BidOps/client/login.html
   2. Action: Log in using Standard User credentials.
   3. Verification: Ensure you can browse items and view the profile.

TEST SCENARIO B: ADMIN MODULE (NodeJS) //not yet implemented
   1. URL: http://localhost:3000/
   2. Action: Log in using Admin credentials.
   3. Verification: Check that the dashboard loads and data matches the database.

6. CREDENTIALS
------------------------------------------------------------------------------
[ STANDARD USER ]
- Username:    John
- Password: pass123

[ ADMINISTRATOR ]
- Username:    
- Password: 

7. TROUBLESHOOTING
------------------------------------------------------------------------------
- 404 Not Found: Ensure the folder is named `/var/www/html/BidOps`.
- 500 Internal Server Error: Check `/var/log/apache2/error.log`. Usually indicates
  a database password mismatch in `server/config/database.php`.
- Connection Refused: Ensure Port Forwarding is set correctly (80->80) and 
  Apache is running (`sudo systemctl restart apache2`).

==============================================================================
END OF README
==============================================================================