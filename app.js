// Import the express module
import express from 'express';

//Create an instance of an
//express
const app = express();

//define a port number for
//our server to listen on
const PORT = 3000;

// Enable static file serving 
app.use(express.static('public'));

// Define a default route ("/")
app.get('/', (req, res) => {
    res.sendFile(`${import.meta.dirname}/views/home.html`);
});

//start the server on the designated port
app.listen(PORT, () => {
    console.log(`Server is running at 
    http://localhost:${PORT}`);
});