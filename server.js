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
    console.log(req.body);
    try {
      const { name, email, password, address, city, state, zip, ccNumber, expDate, cvv, subscriptionId } = req.body;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      let userResult;

      // Check if the user already exists
      const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (existingUser.rows.length > 0) {
        // User exists, update the record with additional information
        userResult = await pool.query(
          'UPDATE users SET address = $1, city = $2, state = $3, zip = $4, cc_number = $5, exp_date = $6, cvv = $7 WHERE email = $8 RETURNING *',
          [address, city, state, zip, ccNumber, expDate, cvv, email]
        );
      } else {
        // User does not exist, create a new record
        userResult = await pool.query(
          'INSERT INTO users (username, email, password, address, city, state, zip, cc_number, exp_date, cvv) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
          [name, email, hashedPassword, address, city, state, zip, ccNumber, expDate, cvv]
        );
      }

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

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username, email: user.email } });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login');
    }
});


      
  
  
  // Start the Express server on the specified port
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  