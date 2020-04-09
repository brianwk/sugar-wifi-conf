let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')
const wlan0 = wpa('wlan0')

let BlenoCharacteristic = bleno.Characteristic

let WifiNetworksCharacteristic = function () {
    WifiNetworksCharacteristic.super_.call(this, {
        uuid: UUID.WIFI_NETWORKS,
        properties: ['read']
    })
}

util.inherits(WifiNetworksCharacteristic, BlenoCharacteristic)

WifiNetworksCharacteristic.prototype.onReadRequest = function (offset, callback) {
    console.log('read networks request')
    wlan0.on('ready', function () {
        console.log('scanning networks')
        wlan0.scan()
    })

    wlan0.on('update', function () {
        console.log('update state from dbus')
        // var cur = wifi.currentNetwork
        const networks = wlan0.networks.map(({ ssid, signal, frequency }) => {
            return { ssid, signal, frequency }
        })
        callback(this.RESULT_SUCCESS, JSON.stringify(networks))
    }.bind(this))
}

module.exports = WifiNetworksCharacteristic
