let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')

let BlenoCharacteristic = bleno.Characteristic

let WifiNetworksCharacteristic = function () {
    WifiNetworksCharacteristic.super_.call(this, {
        uuid: UUID.WIFI_NETWORKS,
        properties: ['notify']
    })
}

util.inherits(WifiNetworksCharacteristic, BlenoCharacteristic)

WifiNetworksCharacteristic.prototype.onSubscribe = function (maxValueSize, callback) {
    this.interface = wpa('wlan0')
    this.interface.on('ready', function () {
        this.interface.scan()
    }.bind(this))

    this.interface.on('update', function () {
        // var cur = wifi.currentNetwork
        callback(this.RESULT_SUCCESS, JSON.stringify(wifi.networks))
    }.bind(this))

    // @todo example JSON data which represents workout IDs
}

WifiNetworksCharacteristic.prototype.onUnsubscribe = function () {
    this.interface.off('ready')
    this.interface.off('update')
}

module.exports = WifiNetworksCharacteristic
