const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET)

const port = process.env.PORT || 5000;

const app = express()

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.a0wgsnp.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const categoryCollection = client.db('mobileHaat').collection('categories')
        const productsCollection = client.db('mobileHaat').collection('products')
        const bookingsCollection = client.db('mobileHaat').collection('bookings')
        const usersCollection = client.db('mobileHaat').collection('users')
        const paymentsCollection = client.db('mobileHaat').collection('payments')

        app.get('/categories', async (req, res) => {
            const query = {}
            const cursor = categoryCollection.find(query)
            const categories = await cursor.toArray()
            res.send(categories)
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id
            // console.log(id);
            const query = {}
            // const query = { category_id: id }
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray()

            const matchedProducts = products.filter(n => n.category_id == id);
            res.send(matchedProducts);
        })

        app.get('/users', async (req, res) => {
            const query = {}
            const users = await usersCollection.find(query).toArray()
            res.send(users)
        })

        app.post('/users', async (req, res) => {
            const user = req.body
            console.log(user);
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
        })

        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user?.type === 'seller' })
        })

        app.put('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        app.get('/bookings', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const bookings = await bookingsCollection.find(query).toArray()
            res.send(bookings)
        })

        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const booking = await bookingsCollection.findOne(query)
            res.send(booking)
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const query = {
                ProductName: booking.ProductName,
                email: booking.email
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray()

            if (alreadyBooked.length) {
                const message = `you alredy have a booking`
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        })


        //for  insert products

        app.get('/productCategory', async (req, res) => {
            const query = {}
            const result = await categoryCollection.find(query).project({ category_id: 1 }).toArray()
            res.send(result)
        })

        app.post('/products', async (req, res) => {
            const product = req.body
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })

        app.get('/products', async (req, res) => {
            const query = {}
            const products = await productsCollection.find(query).toArray()
            res.send(products)
        })

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(filter)
            res.send(result)
        })


        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body
            const price = booking.price
            const amount = price * 100

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        app.post('/payments', async (req, res) => {
            const payment = req.body
            const result = await paymentsCollection.insertOne(payment)
            const id = payment.bookingId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })



    }
    finally {

    }
}
run()
    .catch(err => console.log(err))




app.get('/', async (req, res) => {
    res.send('server is running')
})

app.listen(port, () => console.log("server is running", port))