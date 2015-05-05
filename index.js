let path = require('path')
let fs = require('fs')
let express = require('express')
let nodeify = require('bluebird-nodeify')
let mime = require('mime-types')
let rimraf = require('rimraf')
let mkdirp = require('mkdirp')
let moment = require('moment')
let args = require('yargs').argv
let nssocket = require('nssocket')
let bodyParser = require('body-parser')
let events = require('events')
let eventEmitter = new events.EventEmitter()

require('songbird')

function setFileMeta(req, res, next) {
    let filePath = path.resolve(path.join(ROOT_DIR, req.url))
    if (filePath.indexOf(ROOT_DIR) !== 0) {
        return res.status(400).send('invalid path')
    }
    req.filePath = filePath
    fs.promise.stat(filePath)
        .then(
            stat => req.stat = stat, () => {
                req.stat = null
            }
    )
        .nodeify(next)
}

function sendHeaders(req, res, next) {

    nodeify(
        async() => {
            if (req.stat) {
                if (req.stat.isDirectory()) {
                    let files = await fs.promise.readdir(req.filePath)
                    res.body = JSON.stringify(files)
                    res.setHeader('Content-Length', res.body.length)
                    res.setHeader('Content-Type', 'application/json')
                    return
                } else {
                    let contentType = mime.contentType(path.extname(req.filePath))
                    res.setHeader('Content-Length', req.stat.size)
                    res.setHeader('Content-Type', contentType)
                }
            }
        }(), next)
}

const PORT = process.env.PORT || 8000

let ROOT_DIR = args.dir ? path.resolve(args.dir) : path.resolve(process.cwd())


let tcpServer = nssocket.createServer(function(socket) {
    eventEmitter.on('create/update', function(data) {
        socket.send(['dropbox', 'clients', 'create/update'], data)
    })
    eventEmitter.on('delete', function(data) {
        socket.send(['dropbox', 'clients', 'delete'], data)
    })
})
tcpServer.listen(6785)
console.log('TCP Server LISTENING http://localhost:', '6785')


let app = express()
app.listen(PORT, () => console.log(`CRUD Server LISTENING http://localhost:${PORT}`))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

app.get('*', setFileMeta, sendHeaders, (req, res) => {
    if (req.stat && req.stat.isDirectory()) {
        return res.json(res.body)
    }
    fs.createReadStream(req.filePath).pipe(res)
})

app.head('*', setFileMeta, sendHeaders, (req, res) => {
    res.end()
})


app.delete('*', setFileMeta, (req, res, next) => {
    async() => {
        if (!req.stat) return res.status(400).send('invalid path')
        if (req.stat.isDirectory()) {
            await rimraf.promise(req.filePath)
        } else {
            await fs.promise.unlink(req.filePath)
        }
        eventEmitter.emit('delete', {
            action: 'delete',
            path: req.filePath.replace(ROOT_DIR, ''),
            type: req.stat.isDirectory() ? "dir" : "file",
            timestamp: moment().utc()
        })
        return res.end()
    }().catch(next)
})

app.put('*', setFileMeta, (req, res, next) => {
    let filePath = req.filePath
    let isEndWithSlash = req.filePath.charAt(filePath.length - 1) === path.sep
    let isFile = path.extname(req.filePath) !== ''
    let isDirectory = isEndWithSlash || !isFile
    let dirPath = isDirectory ? req.filePath : path.dirname(filePath)
    let content = Object.keys(req.body)[0]
    async() => {
        await mkdirp.promise(dirPath)
        if (!isDirectory) {
            if (req.stat) {
                await fs.promise.truncate(req.filePath, 0)
            }
            await fs.promise.writeFile(filePath, content)
        }
        res.end()

        eventEmitter.emit('create/update', {
            action: req.stat ? 'update' : 'create',
            path: req.filePath.replace(ROOT_DIR, ''),
            type: isDirectory ? "dir" : "file",
            contents: isDirectory ? null : content,
            timestamp: moment().utc()
        })
    }().catch(next)
})




