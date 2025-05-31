const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = '51f556a15bb292a48d9a0a86b5566608991ec2a55044c19fbac12d6ed52afa2897ecd589e41a6883a30a6e7ffe1e92418a315851b36bcd22d2adf273a920607afa592bddc63a6a891f23996e62cfb52d04fdd7ba401b55538cb2687eb63de65b65c4efbb4eeb7259646d95adc81bdf319c00b9b56f8bd3e19868fe4484cdb7f4be4e7aa73b3d00a22968c142211b87be5ea7dea26d339d779ac3fcdbd714d35c57245466129df34a518ca3581b5c51a1275dd50778440a152b8958125f4acd65a6ce484f66323a06c03fe8bcc62c382101f66a1608e787e228b3a657ee63fbbe9a154747f39f7dcdf5e945cb1d342bbeb0da04f860c0a2f4ed67f45a778b19b5';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  console.log(name, email, password);
  const existingUser = await prisma.user.findUnique({ where: { email: email } });
  if (existingUser) {
    return res.status(400).json({ error: 'Użytkownik już istnieje' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  res.json({ message: 'Użytkownik utworzony' });
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: 'Nieprawidłowy email lub hasło' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: 'Nieprawidłowy email lub hasło' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ message: 'Zalogowano', token: token });
});

module.exports = router;