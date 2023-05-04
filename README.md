This is a demo node app that provides a simple express api to SELECT data from tables in a version of SQL Server I run in a container.  The container image consists of a recent Ubuntu Linux with SQL Server pre-installed.  The tables are from datasets found here:


Home page: https://data.lacity.org/browse?category=Public+Safety

Three data sets I have imported into SQL Server:

https://data.lacity.org/Public-Safety/Traffic-Collision-Data-from-2010-to-Present/d5tf-ez2w

https://data.lacity.org/Public-Safety/Arrest-Data-from-2010-to-2019/yru6-6re4

https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8


This is a node app that connects to a SQL Server database running in a container.

You can run the container on a Docker engine via this command:


```
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=RMS0foobar" -p 1433:1433 -d dennisallard/ssms:version06-rms0
```

BEGIN HISTORICAL NOTES
I derived my above container starting with:
```
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=********" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```
ALSO See:
https://hub.docker.com/_/microsoft-mssql-server

END HISTORICAL NOTES

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
http://localhost:3002/api/d
```

    Returns a few columns from the record in the Crimes dataset having a given DR

```
http://localhost:3002/api/crimes/?location=PACIFIC%20COAST&geo=33.7905&geo=-118.2750&geo=0.5&daterange=2020-02-03&daterange=2020-02-06
```

    Returns all records in the Crimes dataset having partial match with "PACIFIC COAST", within 0.5 Kilometers of the specified lat long, and within the date range.



There are two HTML files you can use as file URLs to enter queries.  The URLs are of the form:

file:///C:/<PATH TO THIS REPO>/client/testSimple.html
file:///C:/<PATH TO THIS REPO>/client/testChunks.html

For both in the API input you enter an endpoint string that begins with "crimes/".

Examples:

crimes/?location=PACIFIC COAST&daterange=2020-02-03&daterange=2020-02-06

crimes/?geo=34.0483016967773&geo=-118.26309967041&geo=0.05&daterange=2020-01-02&daterange=2020-01-02

testSimple.html does a simple fetch and pretty prints the returned JSON.
testChunks.html reads the response stream in chunks and provides an abort controller.

Both output some useful information in the browser's inspector console output.

The javascript in the HTML files is pretty easy to understand and references are cited.


References:

https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16

https://tediousjs.github.io/node-mssql/


testChunks.html derived some code from the "Example async reader" section per:
https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams


Well written overview of fetch API:
https://rapidapi.com/guides/fetch-api-async-await