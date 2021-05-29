const low = require('lowdb')
const FileASync = require('lowdb/adapters/FileASync')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
module.exports = low(adapter)