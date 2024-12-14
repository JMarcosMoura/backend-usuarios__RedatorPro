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

// Rota para criar um usuário com foto de perfil
router.post('/', upload.single('profilePhoto'), async (req, res) => {
  const { name, email, password, description, specialty } = req.body;
  const profilePhoto = req.file ? req.file.filename : null; // Verifica se a imagem foi enviada

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        description,
        specialty,
        profilePhoto, // Armazena o nome do arquivo da foto
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para atualizar todos os dados de um usuário (exceto o id)
router.put('/:id', async (req, res) => {
  const { id } = req.params; // Obtém o ID da URL
  const { name, email, password, description, specialty, profilePhoto } = req.body; // Obtém os dados do corpo da requisição

  // Verifica se o ID é um número válido
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  // Verifica se pelo menos um campo foi enviado para atualização
  if (!name && !email && !password && !description && !specialty && !profilePhoto) {
    return res.status(400).json({ error: 'Pelo menos um campo deve ser enviado para atualização' });
  }

  try {
    // Atualiza os dados do usuário no banco de dados
    const user = await prisma.user.update({
      where: { id: parseInt(id) }, // Encontra o usuário pelo ID
      data: { // Atualiza os campos
        name,
        email,
        password,
        description,
        specialty,
        profilePhoto,
      },
    });

    res.json(user); // Retorna o usuário atualizado
  } catch (error) {
    if (error.code === 'P2025') {
      // Caso o usuário não exista
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: error.message });
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
