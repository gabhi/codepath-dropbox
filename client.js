let fs = require('fs')
let path = require('path')
let nssocket = require('nssocket')
let mkdirp = require('mkdirp')
let rimraf = require('rimraf')
let args = require('yargs').argv
require('songbird')

let outbound = new nssocket.NsSocket()
let ROOT_DIR = args.dir ? path.resolve(args.dir) : path.resolve(process.cwd())


outbound.data(['dropbox', 'clients', 'create/update'], (data) => {
    let dirPath = data.type === 'dir' ? data.path : path.dirname(data.path)
    dirPath = path.resolve(path.join(ROOT_DIR, dirPath))
    let filename = path.resolve(path.join(ROOT_DIR, data.path))
    async() => {
        await mkdirp.promise(dirPath)
        if (data.type === 'dir') {
            return
        }
        if (data.action === 'update') {
            await fs.promise.truncate(filename, 0)
        }
        await fs.promise.writeFile(filename, data.contents)
    }()
})
outbound.data(['dropbox', 'clients', 'delete'], (data) => {
    let dirPath = data.type === 'dir' ? data.path : path.dirname(data.path)
    dirPath = path.resolve(path.join(ROOT_DIR, dirPath))
    let filename = path.resolve(path.join(ROOT_DIR, data.path))
    async() => {
        if (data.type === 'dir') {
            await rimraf.promise(dirPath)
            return
        }
        await fs.promise.unlink(filename)
    }()
})

outbound.connect(6785)