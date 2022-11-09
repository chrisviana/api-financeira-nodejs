const { request, response } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(express.json());
const customers = [];

// Middlewere
function verifyExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(400).json({ error: "Cliente não existe" });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
 */
app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Cliente já cadastrado " });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

app.get("/statement/", verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;
  return response.json(customer.statement);
});

app.post("/deposit", verifyExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    create_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);
  if (balance < amount) {
    return response.status(400).json({ error: "Dinheiro insuficiente" });
  }

  const statementOperation = {
    amount,
    create_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);
  return response.status(201).send();
});

app.get("/statement/date", verifyExistsAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date +" 00:00");
  const statements = customer.statement.filter(
    (statement) =>
      statement.create_at.toDateString() === new Date(dateFormat).toDateString()
  );
  
  return response.json(statements);
});


app.put("/account", verifyExistsAccountCPF, (request, response) => {
  const { name } = request.body
  const { customer } = request;

  customer.name = name;
  console.log(customer.name)
  return response.status(201).send()
})

app.get("/account", verifyExistsAccountCPF , (request, response) => {
  const { customer } = request;
  return response.json(customer)
})

app.listen(3333);
