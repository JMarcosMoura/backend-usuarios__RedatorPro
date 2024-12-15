const express = require('express');
const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Rota para obter um usuário por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params; // Obtém o ID da URL

  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }, // Filtra o usuário com o ID
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user); // Retorna o usuário encontrado
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configuração do Multer para armazenar as imagens na pasta "uploads"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Diretório onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Extensão do arquivo
    cb(null, Date.now() + ext); // Nome único para cada arquivo
  },
});

// Filtrando o tipo de arquivo (apenas imagens)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'), false);
  }
};

// Middleware Multer
const upload = multer({
  storage,
  fileFilter,
});

// Rota para criar um usuário com foto de perfil e outros campos
router.post('/', upload.single('profilePhoto'), async (req, res) => {
  const { name, email, password, description, specialty, likes, reviews, stars } = req.body;
  const profilePhoto = req.file ? req.file.filename : null;

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        description,
        specialty,
        profilePhoto,
        likes: parseInt(likes) || 0,      // Garante que seja um número
        reviews: parseInt(reviews) || 0,  // Garante que seja um número
        stars: parseFloat(stars) || 0.0,  // Aceita números decimais
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Rota para criar múltiplos usuários
router.post('/bulk', async (req, res) => {
  const users = req.body; // Espera-se um array de usuários no corpo da requisição

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'É necessário enviar um array de usuários' });
  }

  try {
    const formattedUsers = users.map(user => ({
      ...user,
      likes: parseInt(user.likes) || 0,
      reviews: parseInt(user.reviews) || 0,
      stars: parseFloat(user.stars) || 0.0,
    }));

    const createdUsers = await prisma.user.createMany({
      data: formattedUsers,
    });

    res.status(201).json({ message: `${createdUsers.count} usuários criados` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// Rota para atualizar um único usuário
router.put('/:id', upload.single('profilePhoto'), async (req, res) => {
  const { id } = req.params;
  const { name, email, password, description, specialty, likes, reviews, stars } = req.body;
  const profilePhoto = req.file ? req.file.filename : null;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        password,
        description,
        specialty,
        profilePhoto,
        likes: parseInt(likes) || 0,
        reviews: parseInt(reviews) || 0,
        stars: parseFloat(stars) || 0.0,
      },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Rota PUT para atualizar parcialmente múltiplos usuários (Bulk)
router.put('/bulk', async (req, res) => {
  const usersToUpdate = req.body; // Espera um array de usuários

  if (!Array.isArray(usersToUpdate)) {
    return res.status(400).json({ error: 'A entrada deve ser um array de usuários' });
  }

  try {
    const updatedUsers = [];

    for (const user of usersToUpdate) {
      const { id, name, email, password, description, specialty, likes, reviews, stars } = user;

      // Garantir que o ID é passado, mas outros campos são opcionais
      if (!id) {
        return res.status(400).json({ error: 'Faltando campo obrigatório: id' });
      }

      const dataToUpdate = {};

      // Só adiciona os campos que são enviados na requisição
      if (name !== undefined) dataToUpdate.name = name;
      if (email !== undefined) dataToUpdate.email = email;
      if (password !== undefined) dataToUpdate.password = password;
      if (description !== undefined) dataToUpdate.description = description;
      if (specialty !== undefined) dataToUpdate.specialty = specialty;
      if (likes !== undefined) dataToUpdate.likes = likes;
      if (reviews !== undefined) dataToUpdate.reviews = reviews;
      if (stars !== undefined) dataToUpdate.stars = stars;

      // Atualiza apenas os campos fornecidos
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: dataToUpdate, // Somente os campos que precisam ser atualizados
      });

      updatedUsers.push(updatedUser);
    }

    res.json(updatedUsers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});





// Rota para excluir um usuário por ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params; // Obtém o ID da URL

  // Verifica se o ID é um número válido
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    // Tenta excluir o usuário com o ID fornecido
    const user = await prisma.user.delete({
      where: { id: parseInt(id) }, // Exclusão pelo ID
    });

    // Retorna uma mensagem de sucesso
    res.json({ message: `Usuário com ID ${id} excluído com sucesso!`, user });
  } catch (error) {
    if (error.code === 'P2025') {
      // Caso o usuário não exista
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: error.message });
  }
});


// Rota para obter todos os usuários (com a foto de perfil)
router.get('/', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});


module.exports = router;
