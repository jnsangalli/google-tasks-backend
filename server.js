import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({
  origin: "https://app.julianosangalli.com.br"
}));
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ================= LOGIN GOOGLE =================
app.get("/auth/google", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/tasks&access_type=offline&prompt=consent`;

  res.redirect(url);
});

// ================= CALLBACK =================
app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token } = response.data;

    res.send(`
      <h2>Autenticado</h2>
      <p>Copie o token:</p>
      <textarea rows="10" cols="80">${access_token}</textarea>
    `);
  } catch (err) {
    console.error(err);
    res.send("Erro ao autenticar");
  }
});

// ================= LISTAR TASKS =================
app.get("/tasks", async (req, res) => {
  const token = req.headers.authorization;

  try {
    const response = await axios.get(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao buscar tasks" });
  }
});

// ================= CRIAR TASK =================
app.post("/tasks", async (req, res) => {
  const token = req.headers.authorization;
  const { title } = req.body;

  try {
    const response = await axios.post(
      "https://tasks.googleapis.com/tasks/v1/lists/@default/tasks",
      { title },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao criar task" });
  }
});

// ================= DELETAR TASK =================
app.delete("/tasks/:id", async (req, res) => {
  const token = req.headers.authorization;
  const { id } = req.params;

  try {
    await axios.delete(
      `https://tasks.googleapis.com/tasks/v1/lists/@default/tasks/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ erro: "Erro ao deletar task" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
