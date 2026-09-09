import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { predictFootball } from "./predictionEngine.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const footballApi = axios.create({
  baseURL: "https://v3.football.api-sports.io",
  headers: {
    "x-apisports-key": process.env.FOOTBALL_API_KEY || ""
  }
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function demoMatches() {
  return [
    {
      id: "demo-1",
      league: "Démonstration",
      date: new Date().toISOString(),
      home: { name: "Paris", logo: "" },
      away: { name: "Marseille", logo: "" },
      demo: true
    },
    {
      id: "demo-2",
      league: "Démonstration",
      date: new Date().toISOString(),
      home: { name: "Real Madrid", logo: "" },
      away: { name: "Barcelona", logo: "" },
      demo: true
    }
  ];
}

app.get("/api/status", (req, res) => {
  res.json({
    application: "Prono Divin",
    status: "online",
    footballApiConfigured: Boolean(process.env.FOOTBALL_API_KEY)
  });
});

app.get("/api/football/matches", async (req, res) => {
  if (!process.env.FOOTBALL_API_KEY) {
    return res.json(demoMatches());
  }

  try {
    const date = req.query.date || today();
    const response = await footballApi.get("/fixtures", { params: { date } });

    const matches = response.data.response.map((fixture) => ({
      id: String(fixture.fixture.id),
      league: fixture.league.name,
      date: fixture.fixture.date,
      home: {
        name: fixture.teams.home.name,
        logo: fixture.teams.home.logo
      },
      away: {
        name: fixture.teams.away.name,
        logo: fixture.teams.away.logo
      }
    }));

    res.json(matches);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Impossible de récupérer les matchs." });
  }
});

app.get("/api/football/prediction/:fixtureId", async (req, res) => {
  const fixtureId = req.params.fixtureId;

  // Démonstration si aucune clé API n'est configurée.
  if (!process.env.FOOTBALL_API_KEY || fixtureId.startsWith("demo-")) {
    const prediction = predictFootball(
      { form: 82, attack: 86, defense: 78, ranking: 84, h2h: 60 },
      { form: 72, attack: 76, defense: 74, ranking: 76, h2h: 40 }
    );
    return res.json({ fixtureId, prediction, source: "Prono Divin (démo)" });
  }

  try {
    const response = await footballApi.get("/predictions", {
      params: { fixture: fixtureId }
    });

    const data = response.data.response?.[0];
    if (!data?.predictions?.percent) {
      return res.status(404).json({ error: "Aucune prédiction disponible." });
    }

    const percent = data.predictions.percent;
    const prediction = {
      home: Number(String(percent.home).replace("%", "")),
      draw: Number(String(percent.draw).replace("%", "")),
      away: Number(String(percent.away).replace("%", ""))
    };

    prediction.confidence = Math.max(
      prediction.home,
      prediction.draw,
      prediction.away
    );

    res.json({ fixtureId, prediction, source: "API-Football" });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Impossible de récupérer le pronostic." });
  }
});

app.get("/api/tennis/matches", (req, res) => {
  res.json([
    {
      id: "tennis-demo-1",
      tournament: "Démonstration Tennis",
      player1: "Joueur A",
      player2: "Joueur B",
      prediction: { player1: 58, player2: 42, confidence: 58 }
    },
    {
      id: "tennis-demo-2",
      tournament: "Démonstration Tennis",
      player1: "Joueur C",
      player2: "Joueur D",
      prediction: { player1: 47, player2: 53, confidence: 53 }
    }
  ]);
});

app.listen(PORT, () => {
  console.log(`⚡ PRONO DIVIN lancé : http://localhost:${PORT}`);
});