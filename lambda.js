const awsServerlessExpress = require('aws-serverless-express');
const app = require('./server'); // Import your Express app

const server = awsServerlessExpress.createServer(app);

exports.handler = (event, context) => {
    awsServerlessExpress.proxy(server, event, context);
};
