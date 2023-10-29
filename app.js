const express = require("express");
const path = require("path");
const { format, isValid, parseISO } = require("date-fns");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("connected");
    });
  } catch (e) {
    console.log("catch error");
    process.exit();
  }
};

initializeDBAndServer();
const formatDate = (dueDate) => {
  const parsedDate = parseISO(dueDate);
  return isValid(parsedDate) ? format(parsedDate, "yyyy-MM-dd") : null;
};
//get
const ChangeTOJson = (item) => {
  return {
    id: item["id"],
    todo: item["todo"],
    priority: item["priority"],
    status: item["status"],
    category: item["category"],
    dueDate: item["due_date"],
  };
};
const requestToJson = (result) => {
  if (result) {
    return result.map((item) => ChangeTOJson(item));
  } else {
    // Handle the case where there are no results
    return [];
  }
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;
  let getQuery = "";
  let result;

  if (category !== undefined && priority !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getQuery = `select * from todo where category='${category}' and priority='${priority}';`;
        result = await db.all(getQuery);
      } else {
        response.status(400).send("Invalid Todo Priority");
      }
    } else {
      response.status(400).send("Invalid Todo Category");
    }
  } else if (category !== undefined && status !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getQuery = `select * from todo where category='${category}' and status='${status}';`;
        result = await db.all(getQuery);
      } else {
        response.status(400).send("Invalid Todo Status");
      }
    } else {
      response.status(400).send("Invalid Todo Category");
    }
  } else if (priority !== undefined && status !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getQuery = `select * from todo where priority='${priority}' and status='${status}';`;
        result = await db.all(getQuery);
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    } else {
      response.status(400).send("Invalid Todo Priority");
    }
  } else if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      getQuery = `select * from todo where status='${status}';`;
      result = await db.all(getQuery);
    } else {
      response.status(400).send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      getQuery = `select * from todo where priority='${priority}';`;
      result = await db.all(getQuery);
    } else {
      response.status(400).send("Invalid Todo Priority");
    }
  } else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      getQuery = `select * from todo where category='${category}';`;
      result = await db.all(getQuery);
    } else {
      response.status(400).send("Invalid Todo Category");
    }
  } else if (search_q !== undefined) {
    getQuery = `select * from todo where todo like '%${search_q}%';`;
    result = await db.all(getQuery);
  }
  let final = requestToJson(result);
  response.send(final);
});
//api 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getOne = `select * from todo where id=${todoId};`;
  const result = await db.get(getOne);
  response.send({
    id: result["id"],
    todo: result["todo"],
    priority: result["priority"],
    status: result["status"],
    category: result["category"],
    dueDate: result["due_date"],
  });
});
//api3
const ChangeTOJson1 = (item) => {
  return {
    id: item["id"],
    todo: item["todo"],
    priority: item["priority"],
    status: item["status"],
    category: item["category"],
    dueDate: item["due_date"],
  };
};
const requestToJson1 = (result) => {
  return result.map((item) => ChangeTOJson1(item));
};
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const updateDate = formatDate(date);
  const getDateResult = `select * from todo where due_date='${updateDate}';`;
  const result = await db.all(getDateResult);
  response.send(result);
  const final = requestToJson1(result);
  response.send(final);
});
//post
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (!["WORK", "HOME", "LEARNING"].includes(category)) {
    response.status(400);
    response.send("Invalid Todo category");
  }
  if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
    response.status(400);
    response.send("Invalid Todo priority");
  }
  if (!["TO DO", "IN PROGRESS", "DONE"].includes(status)) {
    response.status(400);
    response.send("Invalid Todo status");
  } else {
    const updateDate = formatDate(dueDate);
    const insertQuery = `insert into todo (id,todo,priority,status,category,due_date) values (${id},'${todo}','${priority}','${status}','${category}','${updateDate}');`;
    await db.run(insertQuery);
    response.send("Todo Successfully Added");
  }
});
//update
app.put("/todos/:todoId/", async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;

  const { todoId } = request.params;
  let updateQuery = "";
  let result;
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      updateQuery = `update todo set status='${status}' where id=${todoId};`;
      result = await db.run(updateQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo status");
    }
  }
  if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      updateQuery = `update todo set priority='${priority}' where id=${todoId};`;
      result = await db.run(updateQuery);
      response.send("priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo priority");
    }
  }
  if (todo !== undefined) {
    updateQuery = `update todo set todo='${todo}' where id=${todoId};`;
    result = await db.run(updateQuery);
    response.send("todo Updated");
  }
  if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      updateQuery = `update todo set category='${category}' where id=${todoId};`;
      result = await db.run(updateQuery);
      response.send("category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo category");
    }
  }
  if (dueDate !== undefined) {
    const updateDate = formatDate(dueDate);
    updateQuery = `update todo set due_date='${updateDate}' where id=${todoId};`;
    result = await db.run(updateQuery);
    response.send("Due Date Updated");
  }
});
//delete
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `delete from todo where id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
