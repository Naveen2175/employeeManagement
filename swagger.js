const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Employee API",
      version: "1.0.0",
      description: "A simple Express API with Swagger",
    },
    servers: [
      {
        url: "http://localhost:3001",
      },
    ],
  },
  apis: ["./employees.js"], // 👈 Make sure this is correct
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
