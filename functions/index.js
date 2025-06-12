require("dotenv").config();
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Configurare OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Ruta pentru întrebări
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: question }],
    });

    res.status(200).send({
      answer: completion.data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Eroare OpenAI:", error);
    res.status(500).send({ error: "Eroare la generarea răspunsului." });
  }
});

exports.api = functions.https.onRequest(app);
