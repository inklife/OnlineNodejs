const fs = require('fs')
const express = require('express')
const app = express()

const { exec } = require('child_process')

app.use(express.static(__dirname))

//允许跨域
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/test', function (req, res) {
  const t = Date.now().toString() + Math.random()
  let cmdSuccess, timeOut = false
  fs.writeFile(`/tmp/${t}.js`, req.query.code, 'utf8', err => {
    err && console.log(err)
    exec(`docker run --rm --name '${t}' --user 'nobody' --network 'none' -v /tmp/${t}.js:/data/t.js nodejs:v6.11.5 node /data/t.js`, (error, stdout, stderr) => {
      cmdSuccess = true
      fs.unlink(`/tmp/${t}.js`, err => {
        err && console.log(err)
      })
      if (error && error.code !== 1) {
        fs.appendFile('log.txt', `${new Date()}\r\n${JSON.stringify(error)}\r\n`, 'utf8', err => {
          err && console.log(err)
        })
      }
      if (timeOut)
        return res.send('Execution Timed Out.')
      if (stderr === '')
        return res.send(stdout === '' ? 'No output.' : stdout)
      else
        return res.send(stderr)
    })

    setTimeout(() => {
      if (!cmdSuccess) {
        timeOut = true
        exec(`docker stop -t 3 ${t}`, error => {
          error && console.error(error)
        })
      }
    }, 3000)

  })
})

app.listen(8899, '127.0.0.1')