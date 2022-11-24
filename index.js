const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 7007;

// -------Middle-Ware-----
app.use(cors());
app.use(express.json());


// -------Database Connection-------
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.vvll70g.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// Database Connect Function
async function dbConnect() {
    try {
        await client.connect();
        console.log('Database Connected');

    } catch (error) {
        console.log(error.name, error.message);
    }
}
dbConnect();

//  Root API
app.get('/', (req, res) => {
    try {
        res.send({
            success: true,
            message: 'Recycled-Bikes Server is Running.....'
        });

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// Listen Server
app.listen(port, () => {
    console.log(`Server is Running on Port: ${port}`);
})