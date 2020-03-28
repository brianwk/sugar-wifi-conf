const execSync = require('child_process').execSync
let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let config = require('../config')
const fs = require('fs')
const path = require('path')
const conf_path = '/etc/wpa_supplicant/wpa_supplicant.conf'
const iface_path = '/etc/network/interfaces'
const concatTag = '%&%'
const endTag = '&#&'

const pug = require('pug')
const configTemplate = pug.compileFile(path.resolve(__dirname, '../conf/wpa_supplicant.conf.pug'))

let argv = process.argv
if (argv.length > 2) config.key = process.argv[2]

let BlenoCharacteristic = bleno.Characteristic
let message = ''
let messageTimestamp = 0

// Input

let InputCharacteristic = function() {
  InputCharacteristic.super_.call(this, {
    uuid: UUID.INPUT,
    properties: ['write', 'writeWithoutResponse']
  })
}

util.inherits(InputCharacteristic, BlenoCharacteristic)

InputCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  console.log('InputCharacteristic write request: ' + data.toString() + ' ' + offset + ' ' + withoutResponse)
  let inputArray = data.toString().split(concatTag)
  if (inputArray && inputArray.length < 3) {
    console.log('Wrong input syntax.')
    setMessage('Wrong input syntax.')
    callback(this.RESULT_SUCCESS)
    return
  }
  if (inputArray[0] !== config.key){
    console.log('Wrong input key.')
    setMessage('Wrong input key.')
    callback(this.RESULT_SUCCESS)
    return
  }
  let ssid = inputArray[1]
  let password = inputArray[2]
  let result = setWifi(ssid, password)
  callback(this.RESULT_SUCCESS)
}


// Input android

let separateInputString = ''
let separateInputStringCopy = ''
let lastChangeTime = 0
let clearTime = 5000

setInterval(function () {
  if (separateInputStringCopy !== separateInputString) {
    separateInputStringCopy = separateInputString
    lastChangeTime = new Date().getTime()
  } else if (new Date().getTime() - lastChangeTime > clearTime && separateInputString !== '') {
    lastChangeTime = new Date().getTime()
    separateInputStringCopy = ''
    separateInputString = ''
    console.log('clear separateInputString')
  }
}, 1000)

let InputCharacteristicSep = function() {
  InputCharacteristicSep.super_.call(this, {
    uuid: UUID.INPUT_SEP,
    properties: ['write', 'writeWithoutResponse']
  })
}

util.inherits(InputCharacteristicSep, BlenoCharacteristic)

InputCharacteristicSep.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  console.log('InputCharacteristicSep write request: ' + data.toString() + ' ' + offset + ' ' + withoutResponse)
  separateInputString += data.toString()
  let isLast = separateInputString.indexOf(endTag) >= 0
  if (isLast) {
    separateInputString = separateInputString.replace(endTag, '')
    let inputArray = separateInputString.split(concatTag)
    lastChangeTime = new Date().getTime()
    separateInputStringCopy = ''
    separateInputString = ''
    if (inputArray && inputArray.length < 3) {
      console.log('Invalid syntax.')
      setMessage('Invalid syntax.')
      callback(this.RESULT_SUCCESS)
      return
    }
    if (inputArray[0] !== config.key){
      console.log('Invalid key.')
      setMessage('Invalid key.')
      callback(this.RESULT_SUCCESS)
      return
    }
    let ssid = inputArray[1]
    let password = inputArray[2]
    let result = setWifi(ssid, password)
  }
  callback(this.RESULT_SUCCESS)
}


// NotifyMassage

let NotifyMassageCharacteristic = function() {
  NotifyMassageCharacteristic.super_.call(this, {
    uuid: UUID.NOTIFY_MESSAGE,
    properties: ['notify']
  })
}

util.inherits(NotifyMassageCharacteristic, BlenoCharacteristic)

NotifyMassageCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('NotifyMassageCharacteristic subscribe')
  this.timeStamp = messageTimestamp
  this.changeInterval = setInterval(function() {
    if (this.timeStamp === messageTimestamp) return
    let data = new Buffer(message)
    console.log('NotifyMassageCharacteristic update value: ' + message)
    updateValueCallback(data)
    this.timeStamp = messageTimestamp
  }.bind(this), 100)
}

NotifyMassageCharacteristic.prototype.onUnsubscribe = function() {
  console.log('NotifyMassageCharacteristic unsubscribe')

  if (this.changeInterval) {
    clearInterval(this.changeInterval)
    this.changeInterval = null
  }
}

NotifyMassageCharacteristic.prototype.onNotify = function() {
  console.log('NotifyMassageCharacteristic on notify')
}

async function setWifi (input_ssid, input_password) {
  /**
   * Use a pug template to configure wpa_supplicant.conf
   * Save the previous config as wpa_supplicant.conf.previous
   */
  let config = configTemplate({
    ssid: input_ssid,
    psk: input_password,
    country: 'US' /** @todo hardcoded */
  })
  const suffix = '.previous'
  fs.renameSync(conf_path, conf_path + suffix)
  fs.writeFileSync(conf_path, config)

  /** @todo start block to refactor to use dbus */
  // check if wlan0 available, otherwise let reboot
  if (!isWlan0Ok()) {
    /** @todo if there is an error, should we automatically reboot here? */
    setMessage('OK. Please reboot.')
    return
  }
  /** @todo this logic needs to verify connectivity
   */
  let result = restartWpaSupplicant()
  if (result.error) {
    fs.renameSync(conf_path + suffix, conf_path)
    let result = restartWpaSupplicant()
  }

  setMessage(result.msg)
  /** @todo end block to refactor to use dbus */
}

function restartWpaSupplicant() {
  let error = false
  try {
    let msg = execSync('systemctl restart wpa_supplicant')
  } catch (e) {
    error = true
    msg = 'Error: ' + e.toString()
  }
  return { error, msg }
}

function isWlan0Ok() {
  /** @todo refactor this function to use dbus */
  let data = fs.readFileSync(iface_path, 'utf8')
  let rawContent = data.split('\n')
  let foundWlan0 = false
  let isOk = true
  for (const i in rawContent) {
    let line = rawContent[i].trim()
    if (foundWlan0 && line.indexOf('interface ') >=0 && line.indexOf('#') !== 0) {
      foundWlan0 = false
    }
    if (line.indexOf('interface wlan0') >=0 && line.indexOf('#') !== 0) {
      foundWlan0 = true
    }
    if (foundWlan0 && line.indexOf('nohook wpa_supplicant') >=0 && line.indexOf('#') !== 0) {
      isOk = false
    }
  }
  console.log('Is wlan0 Ok ? ' + isOk)
  return isOk
}


function sleep (sec) {
  console.log('wait for a moment...')
  return new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve(true)
    }, sec*1000)
  })
}

function setMessage (msg) {
  message = msg
  messageTimestamp = new Date().getTime()
}

module.exports = {
  InputCharacteristic,
  InputCharacteristicSep,
  NotifyMassageCharacteristic
}
