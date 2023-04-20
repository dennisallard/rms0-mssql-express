This is a demo node app that provides a simple express api to SELECT data from tables in a version of SQL Server I run in a container.  The container image consists of a recent Ubuntu Linux with SQL Server pre-installed.  The tables are from datasets found here:


Home page: https://data.lacity.org/browse?category=Public+Safety

Three data sets I have imported into SQL Server:

https://data.lacity.org/Public-Safety/Traffic-Collision-Data-from-2010-to-Present/d5tf-ez2w

https://data.lacity.org/Public-Safety/Arrest-Data-from-2010-to-2019/yru6-6re4

https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8


This is a node app that connects to a SQL Server database running in a container.

You can run the container on a Docker engine via this command:


```
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=RMS0foobar" -p 1433:1433 -d dennisallard/ssms:version05-rms0
```

You need to have a Docker Engine running on your computer.  Windows 10/11 have a built-in Docker Engine that you start by running the Docker Desktop app.  (Wait about 20 seconds for it to kick in and then do commands such as  the above docker run command and things like docker images, docker ps, etc.

Once you have the above image running, you can connect to it from MS SQL Server Management Studio (SSMS).

After you install and docker run the above container on your localhost, you may admin the database using SSMS. Install SSMS then login to it using the following login inputs:

    Server type: Database Engine
    Server name: localhost
    Authentication: SQL Server Authentication
        Login: SA
        Password: RMS0foobar

That will connect SSMS to the SQL Server database running in the above container.

In the Object Explorer you will see a database named RMS0.

In the database RMS0 will you see three tables:
    dbo.Arrest_Data_from_2010_to_2019
    dbo.Traffic_Collision_Data_from_2010_to_Present
    dbo.Crime_Data_from_2020_to_Present


That is the database this express app will be connecting to per settings in .env (see .env-SAMPLE)

The current very preliminary version of this app accesses only the Crime data table.

Build the express app in the standard node way:

    npm install

Copy top level file .env-SAMPLE to .env and edit .env to set the SQL_PASSWORD (I indicated the password offlline from here).

Run the express app via:

    npm run start


Once the app is running you should be able to fetch from the api endpoint illustrated below.

Example queries:

```
http://localhost:3002/api/crimes/?dr=1970-01-01T20:06:04.061Z
```

    Returns a few columns from the record in the Crimes dataset having a given DR

```
http://localhost:3002/api/crimes/?location=PACIFIC%20COAST&geo=33.7905&geo=-118.2750&geo=0.5&daterange=2020-02-03&daterange=2020-02-06
```

    Returns all records in the Crimes dataset having partial match with "PACIFIC COAST", within 0.5 Kilometers of the specified lat long, and within the date range.



References:

https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16

https://tediousjs.github.io/node-mssql/

