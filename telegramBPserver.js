const MongoClient = require('mongodb').MongoClient
const Telegraf = require('telegraf')
const env = require('./env.json')


var plotly = require('plotly')(env.plotly.username, env.plotly.token)
var fs = require('fs')

const app = new Telegraf(env.TOKEN)


//////// UTILITY FUNCTIONS

function storeBP(_id, _datetime, _sys, _dist) {
        MongoClient.connect('mongodb://localhost/bp', function (err, db) {

                if (err) throw err

                db.collection("data").insertOne({
			id: _id,
			datetime: _datetime,
			sys: _sys,
			dist: _dist
		})
        })
}

function validBP(sys, dist) {

  if (sys < 50 || sys > 300 || dist < 20 || dist > 150) {
    return false
  }

  return true
}

function getBPs(id, success, failure) {

   MongoClient.connect('mongodb://localhost/bp', function (err, db) {
      if (err) {
         failure()
         return
      }

      db.collection("data").find({id: id}).toArray((err, res) => {

      if (err) {
         failure()
         return
      }

      success(res)

     db.close()
     })
   })

}

///// COMMANDS AND RESPONSES

const hiEmojiArray = ['👏', '👌', '👋', '🙌', '✌️', '✋', '🖖', '🤗']
app.hears(/^hi$/i, (ctx) => ctx.reply('Hey there! ' + hiEmojiArray[ (Date.now()/1000) % hiEmojiArray.length]))


const getBP = /^[0-9.]+ [0-9.]+/i
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



app.command('/history', (ctx) => {

   getBPs(ctx.message.from.id,
   (res)=>{
      const strings = res.map((e) => e.datetime.toLocaleString('en-GB') + " " + e.sys + "/" + e.dist)

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

     plotly.getImage(figure, imgOpts, function (error, imageStream) {
        if (error) return console.log (error)
        const nameImg = ctx.message.from.id + "-" + Date.now() + ".png"

        ctx.replyWithPhoto({source: imageStream})

     })

   },
   () => {
      console.log("Error occurred")
   })


})


app.command('start', (ctx) => {
   ctx.reply("Hello. Thank you for joining. ☺️\n"+
   "You can send me new blood pressure readings directly as numbers.\n"+
   "For example, if you need to send 120 Systolic and 60 Diastolic, you can send:\n"+
   "120 60⏎\n\n"+
   "I will store that for you and eventually provide you with the history of your values as graph or list.\n"+
   "You can request these using the two buttons provided (/graph and /history).",
   Telegraf.Extra.markup((markup) => {return markup.keyboard(['/graph', '/history'])}))
})

app.on('sticker', (ctx) => ctx.reply('Thank you for the sticker 👍'))


app.startPolling()
