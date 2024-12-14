const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const userRoutes = require('./routes/users');
const path = require('path');

const app = express();
const prisma = new PrismaClient();

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
