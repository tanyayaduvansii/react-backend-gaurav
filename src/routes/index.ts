import express from 'express';
const Route = express.Router();
const admin = require('./admin');
const client = require('./client');

for (const property in admin) {
  Route.use('/admin', admin[property]);
}

for (const property in client) {
  Route.use('/client', client[property]);
}

export default Route;