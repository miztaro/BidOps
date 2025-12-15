==============================================================================
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
   - Network Adapter: BRIDGED ADAPTER (Crucial)
     * Select the specific network card your Host PC is using for internet (WiFi/LAN).

B. Finding Your IP Address
   Since we are using Bridged Adapter, the VM will get its own IP address.
   1. Login to Ubuntu.
   2. Run command: $ ip a
   3. Look for the IP address (e.g., 192.168.1.xxx) under `enp0s3` or similar.
   4. Note this IP. You will use it to access the site.

3. SOFTWARE INSTALLATION (Inside Ubuntu)
------------------------------------------------------------------------------
Run the following commands to install Apache, MySQL, PHP, and Node.js.

1. Update System:
   $ sudo apt update

2. Install the PHP/Apache Stack:
   $ sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql php-mysqli git unzip -y

3. Install Node.js and NPM:
   $ sudo apt install nodejs npm -y
   
   *Verify installation:*
   $ node -v
   $ npm -v

4. DEPLOYMENT GUIDE
------------------------------------------------------------------------------
Follow these steps to deploy the application code and database.

STEP 1: DEPLOY CODE TO APACHE PHP (USER MODULE)
   1. Create the project directory:
      $ sudo mkdir -p /var/www/html/
      
   2. Go to the project directory:
      $ cd /var/www/html/
   3. Clone the repo (or copy files):
      $ sudo git clone -b finals https://github.com/miztaro/BidOps.git   

   3. Set Permissions (Crucial for file uploads):
      $ sudo chown -R $USER:$USER /var/www/html/BidOps
      $ sudo chown -R www-data:www-data /var/www/html/BidOps
      $ sudo chmod -R 755 /var/www/html/BidOps
      $ sudo chmod -R 777 /var/www/html/BidOps/server/item/uploads


STEP 2: DATABASE SETUP
   1. Start MySQL and enable it:
      $ sudo systemctl start mysql
      $ sudo systemctl enable mysql

   2. Create the Database and Import Data:
      $ sudo mysql -u root < /var/www/html/BidOps/database/bidops.sql

   3. Configure Database Password (If needed):
      Ensure /var/www/html/BidOps/server/config/database.php matches your 
      Ubuntu MySQL credentials (default is often no password or 'root').

STEP 3: START THE NODE.JS SERVER (ADMIN MODULE)
   *Note: This must be done in the 'admin-server' folder where package.json exists.*

   1. Navigate to the Admin Server folder:
      $ cd /var/www/html/BidOps/admin-server

   2. Install Dependencies (Installs Express, MySQL2, etc.):
      $ sudo npm install
      $ sudo npm install -g nodemon

      (This might take a moment. If it hangs, ensure VM has internet).

   3. Open the Firewall for Port 3000:
      $ sudo ufw allow 3000/tcp
      $ sudo ufw reload

   4. Start the Server:
      $ node server.js 
      or
      $ nodemon server.js 
      
   (Keep this terminal open, or use 'nohup node server.js &' to run in background).

4. TESTING GUIDE
------------------------------------------------------------------------------
Use your Host Machine (Windows) or Phone connected to the same WiFi.
Replace <UBUNTU_IP> with the address found using `ip a`.

TEST SCENARIO A: USER MODULE (PHP)
   1. URL: http://<UBUNTU_IP>/BidOps/client/login.html
   2. Action: Log in using Standard User credentials.
   3. Verification: Ensure you can browse items.

TEST SCENARIO B: ADMIN MODULE (NodeJS)
   1. URL: http://<UBUNTU_IP>:3000/homepage.html
   2. Action: Log in (or access directly via PHP redirect).
   3. Verification: Check that the dashboard loads.

5. CREDENTIALS
------------------------------------------------------------------------------
[ STANDARD USER ]
- Username:    John
- Password:    pass123

[ ADMINISTRATOR ]
- Username:    superadmin  
- Password:    adminpass (Update based on your DB)

6. TROUBLESHOOTING
------------------------------------------------------------------------------
- "Cannot GET /": Check if you are accessing port 3000.
- Node Modules Missing: Run `npm install` specifically inside the `admin-server` folder.
- Connection Timed Out: Check Firewall ($ sudo ufw status) and ensure Ports 80 and 3000 are ALLOWED.

==============================================================================
END OF README
==============================================================================