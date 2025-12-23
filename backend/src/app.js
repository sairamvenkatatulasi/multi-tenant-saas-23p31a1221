require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

app.get('/api/health', async (req, res) => {
  res.json({ status: "ok", database: "connected" });
});

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
