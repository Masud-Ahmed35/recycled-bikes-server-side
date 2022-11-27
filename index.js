const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const { MongoClient, ServerApiVersion, Collection, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
const productsCollection = client.db('recycledBikes').collection('products');
const advertiseCollection = client.db('recycledBikes').collection('advertise');
const ordersCollection = client.db('recycledBikes').collection('orders');
const paymentsCollection = client.db('recycledBikes').collection('payments');


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

//Create Payment Intent 
app.post('/create-payment-intent', async (req, res) => {
    try {
        const order = req.body;
        const price = order.resalePrice;
        const amount = parseFloat(parseFloat(price) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'usd',
            amount: amount,
            "payment_method_types": ["card"],
        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        });

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
app.post('/payments', async (req, res) => {
    try {
        const payment = req.body;
        const result = await paymentsCollection.insertOne(payment);

        const id = payment.bookingId;
        const filter = { _id: ObjectId(id) };
        const updatedDoc = {
            $set: {
                availability: 'paid',
                transactionId: payment.transactionId
            }
        }
        const updatedResult = await productsCollection.updateOne(filter, updatedDoc)

        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})


app.get('/users/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const result = await usersCollection.findOne({ email: email });
        res.send(result);

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

// get product by category id 
app.get('/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { categoryId: id };
        const result = await productsCollection.find(query).toArray();
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// get product by bookingId
app.get('/products/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const query = { _id: bookingId };
        const result = await productsCollection.findOne(query)
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Reported Products
app.get('/reportedProducts', async (req, res) => {
    try {
        const query = { report: 'reported' }
        const result = await productsCollection.find(query).toArray();
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// get product by seller email
app.get('/sellerProducts/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const query = { sellerEmail: email };
        const result = await productsCollection.find(query).toArray();
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// Save all Products 
app.put('/products', async (req, res) => {
    try {
        const product = req.body;

        const result = await productsCollection.insertOne(product);
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Report to admin api
app.patch('/products/:id', async (req, res) => {
    try {
        const id = req.params.id
        const data = req.body;
        const query = { _id: ObjectId(id) }
        const result = await productsCollection.updateOne(query, { $set: data });
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

app.delete('/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await productsCollection.deleteOne({ _id: ObjectId(id) });
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// get advertise...............
app.get('/advertise', async (req, res) => {
    try {
        const result = await advertiseCollection.find({}).toArray();
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// post Advertise................
app.post('/advertise', async (req, res) => {
    try {
        const product = req.body;
        const result = await advertiseCollection.insertOne(product);
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// get all seller 
app.get('/allSeller', async (req, res) => {
    try {
        const query = { role: 'seller' }
        const result = await usersCollection.find(query).toArray();
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Verify a seller 
app.patch('/allSeller/:id', async (req, res) => {
    try {
        const id = req.params.id
        const data = req.body;
        const query = { _id: ObjectId(id) }
        const result = await usersCollection.updateOne(query, { $set: data });
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// delete seller 
app.delete('/allSeller/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await usersCollection.deleteOne({ _id: ObjectId(id) });
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// get all buyer 
app.get('/allBuyer', async (req, res) => {
    try {
        const query = { role: 'buyer' }
        const result = await usersCollection.find(query).toArray();
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// delete seller 
app.delete('/allBuyer/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await usersCollection.deleteOne({ _id: ObjectId(id) });
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// orders collection-----------------
app.post('/orders', async (req, res) => {
    try {
        const order = req.body;
        const result = await ordersCollection.insertOne(order);
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

app.get('/paymentOrders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await ordersCollection.findOne(query);
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

app.get('/orders/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const query = { buyerEmail: email };
        const result = await ordersCollection.find(query).toArray();
        res.send(result);

    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

app.delete('/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await ordersCollection.deleteOne(query);
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