const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");
const app = express();
const path = require("path");
app.use(express.json());
const dataBasePath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database ERROR : ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertingDbObjectIntoStatesOutput = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertingDbObjectIntoDistrictOutput = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
//GET METHOD
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state ;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertingDbObjectIntoStatesOutput(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * 
    FROM state 
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertingDbObjectIntoStatesOutput(state));
});
//Districts

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictQuery = `
    INSERT INTO 
    district(district_name,state_id,cases,cured,active,deaths) 
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    )`;

  const dbResponse = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district
    WHERE district_id = ${districtId}`;
  const district = await db.get(getDistrictQuery);
  response.send(convertingDbObjectIntoDistrictOutput(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `DELETE FROM district
    WHERE district_id = ${districtId}`;
  const district = await db.run(getDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const postDistrictQuery = `
    UPDATE  
    district
    SET 
        district_name = '${districtName}',
       state_id =  ${stateId},
       cases= ${cases},
       cured =  ${cured},
       active= ${active},
       deaths =  ${deaths}
    WHERE district_id = ${districtId}
    ;`;

  const dbResponse = await db.run(postDistrictQuery);
  response.send("District Details Updated");
});
// /states/:stateId/stats/

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
      SUM(cases),SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM 
      district 
    WHERE 
       state_id = ${stateId};`;
  const stats = await db.get(getStateQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await db.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
