import "dotenv/config";
import express from "express";
import cors from "cors";
import adminDataRoutes from "./routes/adminDataRoutes.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/admin/data", adminDataRoutes);

// Palvelimen terveystarkistus
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Urheilukaupan API toimii!",
  });
});

export default app;
