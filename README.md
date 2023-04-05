This is a demo node app that provides a simple express api to SELECT data from tables in a version of SQL Server I run in a container.  The container image consists of a recent Ubuntu Linux with SQL Server pre-installed.  The tables are from datasets found here:


Home page: https://data.lacity.org/browse?category=Public+Safety

Two data sets I have imported into SQL Server:

https://data.lacity.org/Public-Safety/Traffic-Collision-Data-from-2010-to-Present/d5tf-ez2w

https://data.lacity.org/Public-Safety/Arrest-Data-from-2010-to-2019/yru6-6re4


This is a node app that connects to a SQL Server database running in a container.

You can run the container on a Docker engine via this command:


```
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=RMS0foobar" -p 1433:1433 -d dennisallard/ssms:version04-rms0
```


Example query:

```
http://localhost:3002/api/crimes/?location=PACIFIC%20COAST&geo=33.7905&geo=-118.2750&geo=0.5&daterange=2020-02-03&daterange=2020-02-06
```
