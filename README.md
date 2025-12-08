# BidOps
How to set up BidOps Server and Client
PC 1: Server
1. Run WAMP
2. Configure the ff files:
	a. httpd.conf
		- Change 'Require local' to 'Require all granted'
	b. httpd-vhosts.conf
		- Change 'Require local' to 'Require all granted'
	c. my.ini
		- Add 'bind-address = 0.0.0.0' in the '[mysqld]' section
3. Configure windows firewall:
	Option 1: The usual turning off of firewalls through windows settings
	Option 2: Run cmd as admin
		- to allow Apache (http): netsh advfirewall firewall add rule name="Apache HTTP" dir=in action=allow protocol=TCP localport=80
		- to allow Apache (https): netsh advfirewall firewall add rule name="Apache HTTPS" dir=in action=allow protocol=TCP localport=443
		- to allow MySQL: netsh advfirewall firewall add rule name="MySQL" dir=in action=allow protocol=TCP localport=3306
4. Restart all services in WampServer
5. ipconfig PC 1 to get ip address
!! Notes !!
	- Make sure that bidops file is located in wamp64/www (C:/wamp64/www/bidops)
	- Alice is the default user so there is no need to log in
PC 2: User
In the browser, access http://<PC1-ip>/bidops/client/login.html, this should take the login page


Tailwind config
1.  npm init -y
2.  npm install -D @tailwindcss/postcss
2. 	npm install -D tailwindcss postcss autoprefixer
3.  npx tailwindcss init
4. 	create tailwind.config.js
5. 	create src/input.css
6. 	npm install --save-dev live-server
6. 	npm install --save-dev concurrently
6. 	npm run dev
6. 	npm run tailwind

Tailwind Config (New)
1. npm install
2. npm run dev
