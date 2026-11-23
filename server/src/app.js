import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Palvelimen terveystarkistus
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Urheilukaupan API toimii!",
  });
});

export default app;
