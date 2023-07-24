This is a demo node app, dubbed rms3, that provides a simple express
API to SELECT data from tables in an SQL Server database.

The spec for the app is here:

```
https://github.com/pmarx/PublicSafetyResources/tree/main/data_services
```

The URL endpoint syntax defined by the above document is mostly
adhered to by the afdr/ endpoint with notable exceptions.  The
/crimes endpoint still uses a denegrated syntax which I will
adjust soon.

The URL uses a so-called flag parameter named count.  The syntax used
by this app is:

https://[base_url]/api/data_source_name?[count &][parameters]

The count flag is just a token with no value.  It
means to return a count of rows instead of the rows of data.

The parameters are any of:

location="address"            (you must include the quote characters)
location=[latitude,longitude] (you must include the square brakets)

centroiddistance=number (e.g. 3.5 means 3.5 kilometers)
starttime  (YYYY-MM-DD HH:MM:SS)
endtime    (YYYY-MM-DD HH:MM:SS)
rownum     positive integer
numrows    positive integer

See the example URLs further below and copy and paste them into a
browser.

The app accesses different databases.  For the moment there is one
express route per database.  Currently there are two routes: /afdr and
/crimes.

The config info for all databases is in file db.js which makes use
of environment varibles defined in .env (see .env-SAMPLE).

The /afdr route accesses the narcs database running on SQL Server on
pdw-db1.lapd.online (the AFDR and FI "databases", but actually tables
in the same narcs database).

BEGIN TLDR;

    The /crimes route accesses a database installed in a container.  The
    container image consists of a recent Ubuntu Linux with SQL Server
    pre-installed by Microsoft.  I imported data to the container image from:

        https://data.lacity.org/browse?category=Public+Safety

    I imported three data sets:

    https://data.lacity.org/Public-Safety/Traffic-Collision-Data-from-2010-to-Present/d5tf-ez2w
    https://data.lacity.org/Public-Safety/Arrest-Data-from-2010-to-2019/yru6-6re4
    https://data.lacity.org/Public-Safety/Crime-Data-from-2020-to-Present/2nrs-mtv8

    The /crimes endpoint accesses the Crime-Data-from-2020-to-Present database.

    You can run the SQL Server database container on a Docker engine via this command:

    ```
    docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=RMS0foobar" -p 1433:1433 -d dennisallard/ssms:version06-rms0
    ```

    ***** BEGIN HISTORICAL NOTES *****

    I derived my above container starting with the following Microsoft image:

    ```
    docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=********" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
    ```

    WARNING: I suspect that Microsoft image has evolved and we may not be able to recreate my container from it anymore.

    That's OK since I pushed my derived container image to my Docker hub dennisallard/ssms as shown above.


    ALSO See:
    https://hub.docker.com/_/microsoft-mssql-server

    ***** END HISTORICAL NOTES *****

    You need to have a Docker Engine running on your computer.  Windows
    10/11 have a built-in Docker Engine that you start by running the
    Docker Desktop app.  (Wait about 20 seconds for it to kick in and then
    do commands such as the above docker run command and things like
    docker images, docker ps, etc.

END TLDR;


You can connect to the above databases from SSMS (SQL Server
Management Studio) using the following settings:

Data Source Name   Server Address          Database(if any)  user/password   Table(s)
crimes             localhost               RMS0              sa/RMS0foobar   Crime_Data_from_2020_to_Present
AFDR               pdw-db1.lapd.online     narcs             readonly        vwAFDRData, vwAFDRT2{Ppl,Stats,Stop}
FI                 pdw-db1.lapd.online     narcs             readonly        vwFIData


In the database RMS0 will you see three tables:
    dbo.Arrest_Data_from_2010_to_2019
    dbo.Traffic_Collision_Data_from_2010_to_Present
    dbo.Crime_Data_from_2020_to_Present

The crimes/ endpoint only accesses Crime_Data_from_2020_to_Present


=====================================================================
HOW TO INSTALL AND RUN THIS APP
=====================================================================


Build the express app in the standard node way:

    npm install

You need to create a top level file

    .env

Copy file .env-SAMPLE to .env and edit .env to set the SQL_PASSWORD to RMS0foobar.

Run the express app via:

    npm run start


Once the app is running you should be able to fetch from the api
endpoints illustrated below.


=====================================================================
EXAMPLE API USAGE (URLs entered into a browser):
=====================================================================


Here is an example call to the afdr/ endpoint that returns two rows of
output:

URL:
localhost:3002/api/afdr/?location=[34.0483016967773,-118.26309967041]&centroiddistance=3.0&starttime=2020-01-04 00:00&endtime=2022-01-03 00:00

RAW OUTPUT:
{ "afdr": [{"row_num":"1","idx":32214636,"EditOn":"2021-01-04T12:44:06.717Z","EditBy":"31278","stat":"C","flags":"CON,INS","StopDate":"2021-01-04T00:00:00.000Z","StopTime":"10:10","Duration":4,"Officer1":"36593","Officer2":null,"SvcCall":"N","Wellness":"N","AsgntType":"1","Assignment":"24MQ55","Addr":"808 Francisco St, Los Angeles, Ca 90017, Usa (Approx Loc)","K12":"","SchoolName":null,"SchoolCode":"","Area":"CTD","Division":"24","RD":"0161","Watch":"W2","StopType":"VEH","StopTypeCode":1,"SOW":"2021-01-04 06:00","EOW":"2021-01-04 16:00","RptDay":"MON","IncNo":"21010400001438","Latitude":34.0482,"Longitude":-118.2632,"Bureau":"TRFG","ver":1},{"row_num":"2","idx":32467459,"EditOn":"2021-08-13T10:44:49.820Z","EditBy":"39841","stat":"C","flags":"CON,INS","StopDate":"2021-08-11T00:00:00.000Z","StopTime":"14:23","Duration":223,"Officer1":"30425","Officer2":"43132","SvcCall":"N","Wellness":"N","AsgntType":"1","Assignment":"3A63","Addr":"814 Francisco St","K12":"","SchoolName":null,"SchoolCode":"","Area":"SW","Division":"03","RD":"0161","Watch":"W2","StopType":"PED","StopTypeCode":3,"SOW":"2021-08-11 06:15","EOW":"2021-08-11 18:15","RptDay":"WED","IncNo":"21081100002764","Latitude":34.0486,"Longitude":-118.2628,"Bureau":"SB","ver":1}], "count": 2} 


Here is an example URL using the count flag to return just the number
of rows that would be returned (33 in this case, as of this writing):

URL:
localhost:3002/api/afdr/?count&location="808 Francisco St, Los Angeles, Ca 90017"&centroiddistance=3.0&starttime=2020-01-04 00:00&endtime=2022-01-03 00:00

RAW OUTPUT:
{ "afdr": 33} 


Here is the same URL without the count flag, with the raw output below
showing just the first three and the last rows of the JSON output:

URL:
localhost:3002/api/afdr/?location="808 Francisco St, Los Angeles, Ca 90017"&centroiddistance=3.0&starttime=2020-01-04 00:00&endtime=2022-01-03 00:00

raw output:
{ "afdr": [{"row_num":"1","idx":31789259,"EditOn":"2020-01-23T23:29:57.763Z","EditBy":"27217","stat":"C","flags":",INS","StopDate":"2020-01-23T00:00:00.000Z","StopTime":"08:05","Duration":5,"Officer1":"34370","Officer2":null,"SvcCall":"N","Wellness":"N","AsgntType":"1","Assignment":"31MQ63","Addr":"W 8th St & Francisco St, Los Angeles 90017","K12":"","SchoolName":null,"SchoolCode":"","Area":"STD","Division":"25","RD":"0161","Watch":"W2","StopType":"VEH","StopTypeCode":1,"SOW":"2020-01-23 05:00","EOW":"2020-01-23 14:00","RptDay":"THU","IncNo":"20012300001196","Latitude":34.0487,"Longitude":-118.2627,"Bureau":"TRFG","ver":1},{"row_num":"2","idx":31810366,"EditOn":"2020-02-04T15:09:57.900Z","EditBy":"38401","stat":"C","flags":"COS,INS","StopDate":"2020-02-03T00:00:00.000Z","StopTime":"16:52","Duration":30,"Officer1":"43442","Officer2":"43444","SvcCall":"Y","Wellness":"N","AsgntType":"1","Assignment":"1X26","Addr":"945 W 8Th St","K12":"","SchoolName":null,"SchoolCode":"","Area":"CENT","Division":"01","RD":"0161","Watch":"W4","StopType":"PED","StopTypeCode":3,"SOW":"2020-02-03 10:00","EOW":"2020-02-03 22:00","RptDay":"MON","IncNo":"20020300004227","Latitude":34.0485,"Longitude":-118.2624,"Bureau":"CB","ver":1},{"row_num":"3","idx":31822918,"EditOn":"2020-02-11T05:51:13.830Z","EditBy":"27840","stat":"C","flags":"COS,INS","StopDate":"2020-02-10T00:00:00.000Z","StopTime":"15:07","Duration":30,"Officer1":"42186","Officer2":"41461","SvcCall":"Y","Wellness":"N","AsgntType":"1","Assignment":"1a61","Addr":"945 W 8Th St","K12":"","SchoolName":null,"SchoolCode":"","Area":"CENT","Division":"01","RD":"0161","Watch":"W2","StopType":"PED","StopTypeCode":3,"SOW":"2020-02-10 06:15","EOW":"2020-02-10 18:15","RptDay":"MON","IncNo":"20021000003440","Latitude":34.0485,"Longitude":-118.2624,"Bureau":"CB","ver":1}, o o o ],
"count": 33} 


You should experiment with varying the location and start/endtime parameters.

There are example HTML client pages in the client/ folder.  You can
use this HTML and javascript to see how to do a fetch call from a
client by inspecting the javascript.  The URLs for the examples are:

file:///C:/<Path_to_your_repo_root>/rms3-mssql-express/client/testSimple.html
file:///C:/<Path_to_your_repo_root>/rms3-mssql-express/client/testChunks.html
file:///C:/<Path_to_your_repo_root>/rms3-mssql-express/client/testScroll.html

All of above URLs display HTML forms have a text field named "API
input".  All of them output some useful information in the browser's
inspector console output.  The javascript in the HTML files is pretty
easy to understand and references are cited.


Here are a couple of example inputs (usable as the API input in any of the above).

afdr/?count&location="808 Francisco St, Los Angeles, Ca 90017"&centroiddistance=4.0&starttime=2020-01-04 00:00&endtime=2022-01-03 00:00

afdr/?location="808 Francisco St, Los Angeles, Ca 90017"&centroiddistance=3.0&starttime=2020-01-04 00:00&endtime=2022-01-03 00:00

Shaistha, please use the testScroll.html page to see a demo of
javascript you can apply in your GUI to do pagination.  I recommend
you always do a fetch with the count flag first then do fetches
without the count flag to see different pages of data.


-end-



=====================================================================
Legacy crimes (local container database) endpoint examples:
=====================================================================

http://localhost:3002/api/crimes/?dr=1970-01-01T20:06:04.061Z

    Returns a few columns from the record in the Crimes dataset having a given DR

http://localhost:3002/api/crimes/?location=PACIFIC COAST&geo=[33.7905, -118.2750, 0.5]&daterange=[2020-02-01, 2021-01-31]

    Returns all records in the Crimes dataset having partial match
    with "PACIFIC COAST", within 0.5 Kilometers of the specified lat
    long, and within the date range.




There are three HTML files you can use as file URLs to enter queries.  The URLs are of the form:

file:///C:/<PATH TO THIS REPO>/client/testSimple.html
file:///C:/<PATH TO THIS REPO>/client/testChunks.html
file:///C:/<PATH TO THIS REPO>/client/testScrikk.html

The  javascript code in each of these files serves as a simple example of how to use javascript fetch() to make API calls to the server.

They all provide an API input field for you to enter an endpoint string that begins with "crimes/?".

For now api/crimes/ is the only endpoint.  It takes the following parameters:

location=any string
geo=[lat,long,distance]
daterange=[<start date>, <end date>]

Examples that can be entered into input fields of the above HTML or in localhost URLs shown above.

EXAMPLES:

crimes/?location=PACIFIC COAST&daterange=[2020-02-03,2020-02-06]

crimes/?geo=[34.0483016967773,-118.26309967041,0.05]&daterange=[2020-01-02,2020-01-02]


There is one special URL  parameter:

count -- this is a flag, it has no value, putting it in the URL causes
the API to return a count of how many rows would be returned instead
of the rows themselves. So this URL:

crimes/?count&location=PACIFIC COAST&daterange=[2020-02-03,2020-02-06]

returns a count of how many rows woule be retured from this URL:

crimes/?location=PACIFIC COAST&daterange=[2020-02-03,2020-02-06]

To provide for paginated and limited amounts of output two other
special parameters are available:

rownum=<starting row number>
numrows=<number of rows to return>

These parameters enable a client to scroll forward or backward showing
small numbers of rows at a time.


client/testSimple.html does a simple fetch and pretty prints the returned JSON.
client/testChunks.html reads the response stream in chunks and provides an abort controller.
client/testScroll.html provides provides pagination via URL args rownum and numrows.

All of them output some useful information in the browser's inspector console output.

The javascript in the HTML files is pretty easy to understand and references are cited.


=====================================================================
REFERENCES
=====================================================================


https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16

https://tediousjs.github.io/node-mssql/


testChunks.html derived some code from the "Example async reader" section per:
https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams


Well written overview of fetch API:
https://rapidapi.com/guides/fetch-api-async-await


=====================================================================
APPENDIX - LEGACY EXAMPLE URLS
=====================================================================

inputs for the client forms:

crimes/?location=FIG&geo=[33.7905,-118.2750,50]&daterange=[ 2020-02-03, 2020-03-03 ]
crimes/?count&daterange=[ 2010-02-03, 2020-03-03 ]
crimes/?daterange=[ 2010-02-03, 2020-03-03 ]
etc. (unadvisable to use testSimple.html for very large outputs such as the large date range ones above)

http://localhost:3002/api/crimes/?geo=[34.0483016967773,-118.26309967041,0.05]&daterange=[2020-01-04,2022-01-02]&location=FIGUEROA

http://localhost:3002/api/afdr/?location=[34.0483016967773,-118.26309967041]&centroiddistance=0.05&starttime=2020-01-04 00:00&endtime=2022-01-03 00:00
