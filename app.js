// Import the express module
import express from 'express';
import mysqul2 from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Create an instance of an
// express application
const app = express();

const pool = mysqul2.createPool({
    // These values come from the .env file
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT

}).promise();

// Define a port number for
// our server to listen on
const PORT = 3000;

// Create an array to store orders
const orders = [];

// Enable static file serving
app.use(express.static('public'));

// Add "middleware" to allow the app to parse form data
// Access form data through req.body
app.use(express.urlencoded({ extended: true }));

// Set my view engine to EJS
app.set('view engine', 'ejs');

// Define a default route ("/")
app.get('/', (req, res) => {
    res.render('home');
});

// Add a contact route to display a contact view page
app.get('/contact-us', (req, res) => {
    res.render('contact');
});

/*// Add an order confirmation route
app.get('/confirm-order', (req, res) => {
    res.render('confirm');
});*/


// Add admin route
app.get('/admin', async(req, res) => {
      try {
        // Fetch all orders from the database, newest first
        const orders =  await pool.query('SELECT * FROM orders ORDER BY timestamp DESC');
	  console.log(orders[0]);


        // Render the admin page with the orders
        res.render('admin', { orders: orders[0] });


    } catch(err) {


        console.error('Database error:', err);
        res.status(500).send('Database error: ' + err.message);
    }

});

//Database test route
// Database test - http://localhost:3000/db-test to test this route
app.get('/db-test', async(req, res) => {


    /* 
     * 'async' tells JavaScript that this function will do asynchronous work
     * Asynchronous means "it takes time to complete" (like waiting for
     * database). By marking it 'async', we can use 'await' inside it
     * 
     * 'await' keyword means "pause here and wait for the database to respond"
     * pool.query() returns a Promise ("I'll get back to you!")
     * 'await' waits for the Promise to complete before moving on
     * 
     * pool.query() returns an ARRAY with 2 items:
     *   [0] = the actual data rows from the database
     *   [1] = metadata about the query (field names, types, etc.)
     * So 'orders[0]' contains just the data rows, like:
     * [ {id: 1, customer: 'John', pizza: 'Pepperoni'}, 
     *   {id: 2, customer: 'Jane', pizza: 'Veggie'} ]
     */


    // try/catch block for error handling
    try {


        const orders = await pool.query('SELECT * FROM orders');


        // Send the orders data back to the browser as JSON
        res.send(orders[0]);


    } catch(err) {


        // If ANY error happened in the 'try' block, this code runs
        // Log the error to the server console (for developers to see)
        console.error('Database error:', err);


        // Send an error response to the browser
        // status(500) means "Internal Server Error"
        res.status(500).send('Database error: ' + err.message);
    }
});

app.post('/submit-order', async(req, res) => {


    // Wrap everything in try/catch to handle potential database errors
    try {


        // Get the order data from the form submission
        // req.body contains all the form fields (fname, lname, email, etc.)
        const order = req.body;
        order['timestamp'] = new Date();


        // Convert the toppings array into a comma-separated string
        // HTML checkboxes submit as an array, but MySQL stores as TEXT
        order.toppings = Array.isArray(order.toppings) ? 
	  order.toppings.join(", ") : "";


        // Log the order to the server console (helpful for debugging)
        console.log('New order received:', order);


        // Define an SQL INSERT query
        // The ? are PLACEHOLDERS that will be replaced with actual values
        // This prevents SQL injection (a common security vulnerability)



        const sql = `INSERT INTO orders 
                     (fname, lname, email, size, method, toppings, comment) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;


        // Create an array of parameters for each ? placeholder in order
        const params = [
            order.fname,
            order.lname,
            order.email,
            order.size,
            order.method,
            order.toppings,
            order.comment
        ];


        // Execute the query with the parameters
        const [result] = await pool.execute(sql, params);


        // Optional: You can access the newly inserted row's ID
        console.log('Order inserted with ID:', result.insertId);


        // Pass the order data to the confirmation page 
        res.render('confirm', { order: order });


    } catch(err) {


        // If ANYTHING goes wrong, this runs
        console.error('Error inserting order:', err);


        // Check if it's a duplicate email error
        if (err.code === 'ER_DUP_ENTRY') {


            res.status(409).send('An order with this email already exists.');


        } else {


            // Generic error message for other issues
            res.status(500).send('Sorry, there was an error processing your order. Please try again.');
        }
    }
});


// Start the server on the designated port
app.listen(PORT, () => {
    console.log(`Server is running at 
        http://localhost:${PORT}`);
});