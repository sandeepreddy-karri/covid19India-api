const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
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

const convertStatsDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

const convertStatsStatsDbObjectToResponseObject = (dbObject) => {
  return {
    totalCases: dbObject.totalCases,
    totalCured: dbObject.totalCured,
    totalActive: dbObject.totalActive,
    totalDeaths: dbObject.totalDeaths,
  };
};

/// GET STATES

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state
    ORDER BY
      state_id;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDbObjectToResponseObject(eachState))
  );
});

/// GET STATE BY STATE ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id = ${stateId};`;
  const stateArray = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(stateArray));
});

/// POST DISTRICT

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  insert into 
  district(district_name, state_id, cases, cured, active, deaths)
  values(
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
      );`;
  const district = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

/// GET DISTRICT BASED ON ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    select *
    from district
    where
    district_id = ${districtId};`;
  const districtArray = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(districtArray));
});

/// DELETE DISTRICT

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  delete from district
  where
  district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

/// Update district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  update district
  set 
      district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths=${deaths}
    where
    district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

/// GET STATE STATS

app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    select sum(cases) as totalCases,
    sum(cured) as totalCured,
    sum(active) as totalActive,
    sum(deaths) as totalDeaths
    from district
    where state_id = ${stateId};`;
  const stateStatsArray = await db.get(getStateStatsQuery);
  response.send(convertStatsStatsDbObjectToResponseObject(stateStatsArray));
});

/// GET DISTRICT STATE

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getStateDistrictQuery = `
    select state.state_name
    from state left join district
    on state.state_id = district.state_id
    where district.district_id = ${districtId};`;
  const stateDistrictArray = await db.get(getStateDistrictQuery);
  response.send(
    convertStatsDistrictDbObjectToResponseObject(stateDistrictArray)
  );
});

module.exports = app;
