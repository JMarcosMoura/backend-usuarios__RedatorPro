const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const userRoutes = require('./routes/users');
const path = require('path');

const app = express();
const prisma = new PrismaClient();

const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

// Configuração do express-session
app.use(
  session({
    store: new pgSession({
      conString: process.env.DATABASE_URL, // URL do seu banco PostgreSQL no Render
    }),
    secret: 'sua_chave_secreta_aqui', // Substitua por uma chave segura
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      secure: false, // True se usar HTTPS
      httpOnly: true,
    },
  })
);


// Middleware para servir imagens estáticas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use('/users', userRoutes); // Rotas de usuários

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:3000`);
});
