const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios").default
const { MongoClient } = require("mongodb")
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 5000
const app = express()

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

let key = "cf2cea44a7c04ff1b8aa86d7b309d748";
let endpoint = "https://api.cognitive.microsofttranslator.com/";
let uri = process.env.MONGO_URI || "mongodb://babelbridge-db:CTyjmMzkY786hHFwbvRuhQjRjenNT2k9Eat0k8g6CaIq2XhtvJQqFPLnv746jhujAoZhjf6qdyISACDbfuXH3Q==@babelbridge-db.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&maxIdleTimeMS=120000&appName=@babelbridge-db@"
let location = "eastus";
let client = new MongoClient(uri);

// Middleware



// location, also known as region.
// required if you're using a multi-service or regional (not global) resource. It can be found in the Azure portal on the Keys and Endpoint page.

(async () => {
    try {

        await client.connect()
        console.log("Database connected!")
       
        let db = client.db("test")
        
        let col = db.collection("translation") 

        app.get("/all", async (req, res) => {
            let result = await col.find().toArray()
            res.json(result)
        })

        app.post('/translate', async (req, res) => {
            try {
                console.log(req.body)

                let result = await axios({
                    baseURL: endpoint,
                    url: '/translate',
                    method: 'post',
                    headers: {
                        'Ocp-Apim-Subscription-Key': key,
                        // location required if you're using a multi-service or regional (not global) resource.
                        'Ocp-Apim-Subscription-Region': location,
                        'Content-type': 'application/json',
                        'X-ClientTraceId': uuidv4().toString()
                    },
                    params: {
                        'api-version': '3.0',
                        'from': 'en',
                        'to': req.body.langCode
                    },
                    data: [{
                        'text': req.body.orgText
                    }],
                })

                let transText = result.data[0].translations[0].text
                let langCode = result.data[0].translations[0].to

                let feedback = await col.insertOne({
                    orgText: req.body.orgText,
                    transText,
                    langCode
                })

                console.log("feedback", feedback)

                console.log(result.data[0].translations[0].text)

                res.json({ result: result.data })
            } catch (e) {
                console.log("Error Occured : ", e)
            }
        })

        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`)
        })

    } catch (e) {
        console.log("Error Occured : ", e)
    }
})()

