# Group 19 Software Development Project
### Members: Jake Sinclair, Ewan Mchale, Euan Grierson, Aadit Singhal, Rohan Raj
### Manager: Marta Romeo

# Tracfit
## 
BACKEND SETUP INSTRUCTIONS
Requirements:
- Docker Desktop installed
- Node.js (LTS version) installed

1) Start the MySQL Database

From the project root directory run the following commands:

    cd server
    docker compose up

This will:
- Download MySQL (first time only)
- Create the database: healthappdb
- Automatically import all tables from healthappdb.sql
- Run MySQL on port 3306

Leave this terminal running.

To stop the database later:
    Ctrl + C

2) Install Backend Dependencies

Open a new terminal window and enter the following commands:
    
    cd server
    npm install

This installs:
- mysql2
- dotenv
- express (framework/routing)
- bcrypt (hashing)
- express-session (session mdiddleware)

3) Create Environment File

Inside the /server folder, create a file called:

    .env

Add the following inside:

    DB_HOST=localhost
    DB_USER=root
    DB_PASS=rootpassword
    DB_NAME=healthappdb
    SESSION_SECRET= anyrandomstring

IMPORTANT:
- Do NOT commit the .env file
- It is ignored by Git
- It stores local configuration only

4) Start the Backend Server

Run:

    npm start

If successful, you should see:

    Connected to MySQL database
    Server running at http://127.0.0.1:8081/