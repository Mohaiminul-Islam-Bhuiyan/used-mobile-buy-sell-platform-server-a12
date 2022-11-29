const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()

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