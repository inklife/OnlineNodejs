const os = require('os')
const fs = require('fs')
const path = require('path')
const express = require('express')
const app = express()

const { exec } = require('child_process')
const TEMPDIR = os.tmpdir()

app.use(express.static(path.join(__dirname, 'static')))

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/api/run/nodejs', function (req, res) {
  const t = Date.now().toString() + Math.random()
  const cmdFilename = path.join(TEMPDIR, t) + '.js'
  let cmdSuccess, timeOut = false
  fs.writeFile(cmdFilename, req.query.code, 'utf8', err => {
    if (err) {
      console.log(err)
      return res.send('Error execution.')
    }
    exec(`docker run --rm --name '${t}' --user 'nobody' --network 'none' -v ${cmdFilename}:/data/t.js nodejs:v8.9.4 node /data/t.js`, (error, stdout, stderr) => {
      cmdSuccess = true
      fs.unlink(cmdFilename, err => {
        err && console.log(err)
      })
      if (error) {
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
