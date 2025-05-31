var express = require('express');
var router = express.Router();
const verifyToken = require('../middlewares/verifyToken')
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

var attacks = [
  {
    name: "Z butelki",
    dmg: 15,
    lower: false,
    higher: false,
    atk: false,
    def: false,
    speed: false,
    heal: 0
  },
  {
    name: "Wykitowanie",
    dmg: 5,
    lower: true,
    higher: false,
    atk: true,
    def: true,
    speed: false,
    heal: 5
  },
  {
    name: "Małpeczka",
    dmg: 0,
    lower: false,
    higher: true,
    atk: true,
    def: true,
    speed: true,
    heal: 15
  },
  {
    name: "Idziemy na jednego",
    dmg: 15,
    lower: true,
    higher: false,
    atk: false,
    def: false,
    speed: true,
    heal: 0
  }
]

function attack(move, player, dmgr) {
  player.hp -= Math.round((attacks[move].dmg * (dmgr.atk/10)) / (player.def/10) )

  if(attacks[move].lower){
    if(attacks[move].atk){
      player.atk -= 1
    }
    if(attacks[move].def){
      player.def -= 1
    }
    if(attacks[move].speed){
      player.speed -= 1
    }
  }

  return player
}

function heal(move, dmgr) {
  if(dmgr.hp < 100){
    dmgr.hp += attacks[move].heal
    if(dmgr.hp > 100){
      dmgr.hp = 100
    }
  }

  if(attacks[move].higher){
    if(attacks[move].atk){
      dmgr.atk += 1
    }
    if(attacks[move].def){
      dmgr.def += 1
    }
    if(attacks[move].speed){
      dmgr.speed += 1
    }
  }

  return dmgr
}

router.get('/game/initialize', verifyToken, async function (req, res) {
  const game = await prisma.gameHistory.create({
    data: {}
  });

  res.json({
    gameID: game.id,
    wasFirstFaster: (Math.floor(Math.random()*2138) === 2137), //special ecounter chance, but i just used this var on entrance to not change a name
    players: {
      player: {
        hp: 100,
        atk: 10,
        def: 10,
        speed: 10
      },
      bot: {
        hp: 100,
        atk: 10,
        def: 10,
        speed: 10
      }
    }
  });
})

router.post('/game/move', verifyToken, async function(req, res, next) {
  const { move } = req.body;
  const botMove = Math.floor(Math.random()*4)

  const game = await prisma.gameHistory.findFirst({
        where: {
          id: req.body.gameID,
          alreadyPlaying: true
        }
  })

  var beaten = false

  var player = {
    hp: game.hp1,
    atk: game.atk1,
    def: game.def1,
    speed: game.speed1
  }
  var bot = {
    hp: game.hp2,
    atk: game.atk2,
    def: game.def2,
    speed: game.speed2
  }

  if(player.speed < bot.speed){

    player = attack(botMove, player, bot);
    bot = heal(botMove, bot)
    if(player.hp > 0){
      bot = attack(move, bot, player)
      player = heal(move, player)
    }

  } else {

    bot = attack(move, bot, player)
    player = heal(move, player)
    if(bot.hp > 0) {
      player = attack(Math.floor(Math.random() * 4), player, bot)
      bot = heal(botMove, bot)
    }

  }

  if(player.hp <= 0 || bot.hp <= 0) beaten = true;

  const update = await prisma.gameHistory.update({
    where: {
      id: req.body.gameID,
      alreadyPlaying: true
    },
    data: {
      result: (beaten && player.hp <= 0),
      alreadyPlaying: !beaten,
      hp1: player.hp,
      hp2: bot.hp,
      atk1: player.atk,
      def1: player.def,
      speed1: player.speed,
      atk2: bot.atk,
      def2: bot.def,
      speed2: bot.speed,
    }
  })

  res.json( {
    gameID: req.body.gameID,
    wasFirstFaster: !(player.speed < bot.speed),
    players: {
      player,
      bot
    }
  });
});

router.get('/game/history', verifyToken, async function (req, res) {
  const data = await prisma.gameHistory.findMany()
  res.json(data)
})



module.exports = router;
