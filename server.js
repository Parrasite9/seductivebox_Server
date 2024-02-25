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

app.get('/user-data', async (req, res) => {
    try {
        const email = req.query.email;
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length > 0) {
            const userData = userResult.rows[0];

            // Example logic to determine if the user has completed checkout
            // This might involve checking another table or field in your database
            const hasCompletedCheckout = userData.checkout_completed; // Adjust this based on your database

            res.json({
                name: userData.username,
                address: userData.address,
                city: userData.city,
                state: userData.state,
                zip: userData.zip,
                ccNumber: userData.cc_number,
                hasCompletedCheckout: hasCompletedCheckout
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Error fetching user data');
    }
});









  
  // Endpoint to update user address
  app.post('/update-address', async (req, res) => {
    try {
      const { userId, address, city, state, zip } = req.body;
      await pool.query(
        'UPDATE users SET address = $1, city = $2, state = $3, zip = $4 WHERE id = $5',
        [address, city, state, zip, userId]
      );
      res.json({ message: 'Address updated successfully' });
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).send('Error updating address');
    }
  });
  
  // Endpoint to update user credit card
  app.post('/update-credit-card', async (req, res) => {
    try {
      const { userId, ccNumber, expDate, cvv } = req.body;
      await pool.query(
        'UPDATE users SET cc_number = $1, exp_date = $2, cvv = $3 WHERE id = $4',
        [ccNumber, expDate, cvv, userId]
      );
      res.json({ message: 'Credit card updated successfully' });
    } catch (error) {
      console.error('Error updating credit card:', error);
      res.status(500).send('Error updating credit card');
    }
  });
  

      
  
  
  // Start the Express server on the specified port
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  