const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const { MongoClient, ServerApiVersion, Collection } = require('mongodb');

const app = express();
const port = process.env.PORT || 7007;

// -------Middle-Ware-----
app.use(cors());
app.use(express.json());


// -------Database Connection-------
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.vvll70g.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// All Collection
const categoriesCollection = client.db('recycledBikes').collection('categories');
const usersCollection = client.db('recycledBikes').collection('users');


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

// Save All Users
app.put('/users/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
            $set: user
        }
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });

        res.send({ result, token });

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// Get All Categories 
app.get('/categories', async (req, res) => {
    try {
        const result = await categoriesCollection.find({}).toArray();
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// Save all Category
app.post('/categories/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const category = req.body;

        const result = await categoriesCollection.insertOne(category);
        res.send(result);

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