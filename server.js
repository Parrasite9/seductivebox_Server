const express = require('express'); // Import the Express framework
const cors = require('cors'); // Import the CORS middleware
const { Pool } = require('pg'); // Import the Pool class from the pg module

const app = express(); // Create an Express application
const port = process.env.PORT || 5000; // Set the port for the server

const bcrypt = require('bcrypt')
const saltRounds = 10;

app.use(cors()); // Enable CORS middleware for all routes
app.use(express.json()); // Enable parsing of JSON bodies in requests

// Create a new Pool instance to manage connections to the PostgreSQL database
const pool = new Pool({
  user: 'isaiah', // Your PostgreSQL username
  host: 'localhost', // Your PostgreSQL server host
  database: 'seductivebox', // Your PostgreSQL database name
  password: '264501', // Your PostgreSQL password
  port: 5432, // Your PostgreSQL port (default is 5432)
});

// Define a route for the root path ('/') that sends a simple response
app.get('/', (req, res) => {
    res.send('Hello, World!');
  });
  
  // Define the test-db route
  app.get('/test-db', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()');
      res.json({ currentTime: result.rows[0].now });
    } catch (error) {
      console.error('Error testing database connection:', error);
      res.status(500).send('Error testing database connection');
    }
  });

  // Endpoint to save questionnaire responses
  app.post('/questionnaire', async (req, res) => {
    try {
      const { size, coverage, styles } = req.body;
      const result = await pool.query(
        'INSERT INTO subscriptions (size, coverage, styles) VALUES ($1, $2, $3) RETURNING *',
        [size, coverage, styles]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error saving questionnaire responses:', error);
      res.status(500).send('Error saving questionnaire responses');
    }
  });
  
    
    // Endpoint to handle checkout and user account creation
    app.post('/checkout', async (req, res) => {
        try {
          const { name, email, password, address, city, state, zip, ccNumber, expDate, cvv, subscriptionId } = req.body;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
          const userResult = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [name, email, hashedPassword]
          );
          const userId = userResult.rows[0].id;
          await pool.query(
            'UPDATE subscriptions SET user_id = $1 WHERE id = $2',
            [userId, subscriptionId]
          );
          res.status(201).json(userResult.rows[0]);
        } catch (error) {
          console.error('Error during checkout:', error);
          res.status(500).send('Error during checkout');
        }
      });
      
  
  
  // Start the Express server on the specified port
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  