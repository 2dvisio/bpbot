const MongoClient = require('mongodb').MongoClient
const Telegraf = require('telegraf')
const env = require('./env.json')
const moment = require('moment')

require("moment/min/locales.min")

//Name of the database
const __dbname = 'bp'

var plotly = require('plotly')(env.plotly)
var fs = require('fs')


const app = new Telegraf(env.TOKEN)

const url='mongodb://localhost:27017'
const clientmongo = new MongoClient(url)

// UTILITY FUNCTIONS
//
function storeBP(_id, _datetime, _sys, _dist) {
  clientmongo.connect(function(err) {
    const db = clientmongo.db(__dbname)

    if (db) {
        db.collection("data").insertOne({
        id: _id,
        datetime: _datetime,
        sys: _sys,
        dist: _dist
      })
    }
  })
}


function storeHR(_id, _datetime, _hr) {
  clientmongo.connect(function(err) {
    const db = clientmongo.db(__dbname)

    if (db) {
        db.collection("hr").insertOne({
        id: _id,
        datetime: _datetime,
        hr: _hr
      })
    }
  })
}


function storeSPO2(_id, _datetime, _SPO2) {
  clientmongo.connect(function(err) {
    const db = clientmongo.db(__dbname)

    if (db) {
        db.collection("spo2").insertOne({
        id: _id,
        datetime: _datetime,
        spo2: _SPO2
      })
    }
  })
}


function validBP(sys, dist) {
  if (sys < 50 || sys > 300 || dist < 20 || dist > 150) {
    return false
  }

  return true
}

function validHR(hr) {
  if (hr < 10 || hr > 300) {
    return false
  }

  return true
}

function validSPO2(spo2) {
  if (spo2 < 65 || spo2 > 100) {
    return false
  }

  return true
}



// Always return in ascending order
function getBPs(id, success, failure) {
  clientmongo.connect(function(err) {
    const db = clientmongo.db(__dbname)

    db.collection("data").find({id: id}).sort( { datetime: 1 } ).toArray((err, res) => {
      if (err) {
        failure()
        return
      }

      success(res)

    })
  })
}


// Always return in ascending order
function getHRs(id, success, failure) {
  clientmongo.connect(function(err) {
    const db = clientmongo.db(__dbname)
    db.collection("hr").find({id: id}).sort( { datetime: 1 } ).toArray((err, res) => {
      if (err) {
        failure()
        return
      }
     success(res)
    })
  })
}


// Always return in ascending order
function getSPO2s(id, success, failure) {
  clientmongo.connect(function(err) {
    const db = clientmongo.db(__dbname)
    db.collection("spo2").find({id: id}).sort( { datetime: 1 } ).toArray((err, res) => {
      if (err) {
        failure()
        return
      }
      success(res)
    })
  })
}


// COMMANDS AND RESPONSES

// HI
const hiEmojiArray = ["👏", "👌", "👋", "🙌", "✌️", "✋", "🖖", "🤗"]
app.hears(/^hi$/i, (ctx) => ctx.reply("Hey there! " + hiEmojiArray[parseInt((Date.now()/1000) % hiEmojiArray.length)] ))


// RULE BP ALONE (ASSUMES DATE AND TIME)
const getBP = /^[0-9]+ [0-9]+$/i

// LISTEN BP
app.hears(getBP, ctx => {

  console.log(ctx.message)

  const tokens = ctx.message.text.split(/\s+/)

  var sys = parseFloat(tokens[0])
  var dist = parseFloat(tokens[1])
  var datetime = new Date(parseInt(ctx.message.date) * 1000)
  var id = ctx.message.from.id

  if (sys < dist) {
    var temp = sys
    sys = dist
    dist = temp
  }

  if (validBP(sys, dist)) {
    ctx.reply('Thank you for providing your BP readings')
    ctx.reply('You have entered ' + sys + '/' + dist)
    storeBP(id, datetime, sys, dist)
  } else {
    ctx.reply('It seems like you have entered an invalid BP reading. Try again.')
  }
})


// RULE BP WITH DATE
const getBP_date = /^[0-9]+ [0-9]+ [0-9]+\/[0-9]+\/[0-9]+$/i

// LISTEN BP WITH DATE
app.hears(getBP_date, ctx => {

  console.log(ctx.message)

  const tokens = ctx.message.text.split(/\s+/)

  var sys = parseFloat(tokens[0])
  var dist = parseFloat(tokens[1])
  var datetime = moment(tokens[2].split("/").reverse().join("-")).toDate()
  var id = ctx.message.from.id

  if (sys < dist) {
    var temp = sys
    sys = dist
    dist = temp
  }

  if (validBP(sys, dist)) {
    ctx.reply('Thank you for providing your BP readings')
    ctx.reply('You have entered ' + sys + '/' + dist)
    storeBP(id, datetime, sys, dist)
  } else {
    ctx.reply('It seems like you have entered an invalid BP reading. Try again.')
  }
})


// RULE BP WITH DATE
const getBP_date_time = /^[0-9]+ [0-9]+ [0-9]+\/[0-9]+\/[0-9]+ [0-9]+:+[0-9]+$/i

// LISTEN BP WITH DATE
app.hears(getBP_date_time, ctx => {

  console.log(ctx.message)

  const tokens = ctx.message.text.split(/\s+/)

  var sys = parseFloat(tokens[0])
  var dist = parseFloat(tokens[1])
  var datetime = moment(tokens[2].split("/").reverse().join("-") + " " + tokens[3]).toDate()
  var id = ctx.message.from.id

  if (sys < dist) {
    var temp = sys
    sys = dist
    dist = temp
  }

  if (validBP(sys, dist)) {
    ctx.reply('Thank you for providing your BP readings')
    ctx.reply('You have entered ' + sys + '/' + dist)
    storeBP(id, datetime, sys, dist)
  } else {
    ctx.reply('It seems like you have entered an invalid BP reading. Try again.')
  }
})


// RULE HR ALONE (ASSUMES DATE AND TIME)
const getHR = /^hr [0-9]+$/i

// LISTEN HR
app.hears(getHR, ctx => {

  console.log(ctx.message)

  const tokens = ctx.message.text.split(/\s+/)

  var hr = parseFloat(tokens[1])
  var datetime = new Date(parseInt(ctx.message.date) * 1000)
  var id = ctx.message.from.id

  if (validHR(hr)) {
    ctx.reply('Thank you for providing your HR')
    ctx.reply('You have entered ' + hr)
    storeHR(id, datetime, hr)
  } else {
    ctx.reply('It seems like you have entered an invalid HR reading. Try again.')
  }
})


// RULE SPO2 ALONE (ASSUMES DATE AND TIME)
const getSPO2 = /^ox [0-9]+$/i
// LISTEN SPO2
app.hears(getSPO2, ctx => {

  console.log(ctx.message)

  const tokens = ctx.message.text.split(/\s+/)

  var spo2 = parseFloat(tokens[1])
  var datetime = new Date(parseInt(ctx.message.date) * 1000)
  var id = ctx.message.from.id

  if (validSPO2(spo2)) {
    ctx.reply('Thank you for providing your SPO2')
    ctx.reply('You have entered ' + spo2)
    storeSPO2(id, datetime, spo2)
  } else {
    ctx.reply('It seems like you have entered an invalid SPO2 reading. Try again.')
  }
})



// HISTORY
app.command('/history', (ctx) => {

  getBPs(ctx.message.from.id,
  (res)=>{
      const strings = res.map((e) => moment(e.datetime).locale(ctx.message.from.language_code).format('LLL') + " " + e.sys + "/" + e.dist)

      if (typeof(strings) == 'Object') {
        ctx.reply(strings)
      } else {
        console.log(strings)
        const stringList = strings.join("\n")
        ctx.reply(stringList)
      }
  },
  () => {
      console.log("Error occurred")
  })
})


// GRAPH
app.command('/graph', (ctx) => {

  getBPs(ctx.message.from.id,
  (res)=>{
      const x = res.map((e) => e.datetime)
      const sys = res.map((e) => e.sys)
      const dist = res.map((e) => e.dist)

      var trace1 = {
          x: x,
          y: sys,
          type: "scatter",
          name: "Systolic"
      }

      var trace2 = {
          x: x,
          y: dist,
          type: "scatter",
          name: "Diastolic"
      }

      var layout = {
        title: "Blood pressure values",
        xaxis: {title: "Date"},
        yaxis: {title: "BP [mmHg]"}
      }

      var figure = { data: [trace1, trace2], layout: layout }

      var imgOpts = {
          format: 'png',
          width: 1000,
          height: 500
      }

      console.log(x.length)

    plotly.getImage(figure, imgOpts, function (error, imageStream) {
        if (error) return console.log ("An Error Occurred: " + error)
        const nameImg = ctx.message.from.id + "-" + Date.now() + ".png"

        ctx.replyWithPhoto({source: imageStream})

    })

  },
  () => {
      console.log("Error occurred")
  })
})


// START COMMAND
app.command('start', (ctx) => {
  ctx.reply("Hello. Thank you for joining. ☺️\n"+
  "You can send me new blood pressure readings directly as numbers.\n"+
  "For example, if you need to send 120 Systolic and 60 Diastolic, you can send:\n"+
  "120 60⏎\n\n"+
  "I will store that for you and eventually provide you with the history of your values as graph or list.\n"+
  "You can request these using the two buttons provided (/graph and /history).",
  Telegraf.Extra.markup((markup) => {return markup.keyboard(['/graph', '/history'])}))
})


// HELP COMMAND
const seekHelp = '/help'
app.hears(seekHelp, (ctx) => {
  ctx.reply("Hello, here is some help:\n"+
  "You can send me new blood pressure readings directly as numbers.\n"+
  "For example, if you need to send 120 Systolic and 60 Diastolic, you can send:\n"+
  "120 60⏎\n\n"+
  "I will store that for you and eventually provide you with the history of your values as graph or list.\n"+
  "You can request these using the two buttons provided (/graph and /history).",
  Telegraf.Extra.markup((markup) => {return markup.keyboard(['/graph', '/history'])}))
})

// IN CASE OF STICKERS
app.on('sticker', (ctx) => ctx.reply('Thank you for the sticker ' + hiEmojiArray[parseInt((Date.now()/1000) % hiEmojiArray.length)] ))

// STARTING THE APP
app.startPolling()
