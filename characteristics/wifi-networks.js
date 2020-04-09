let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')

let BlenoCharacteristic = bleno.Characteristic

let WifiNetworksCharacteristic = function () {
    WifiNetworksCharacteristic.super_.call(this, {
        uuid: UUID.WIFI_NETWORKS,
        properties: ['read']
    })
}

util.inherits(WifiNetworksCharacteristic, BlenoCharacteristic)

WifiNetworksCharacteristic.prototype.onReadRequest = function (offset, callback) {
    this.interface = wpa('wlan0')
    this.interface.on('ready', function () {
        try {
            this.interface.scan()
        } catch (e) {
            console.log('interface scan error', e)
        }
    }.bind(this))

    this.interface.on('update', function () {
        // var cur = wifi.currentNetwork
        const networks = this.interface.networks.map(({ ssid, signal, frequency }) => {
            return { ssid, signal, frequency }
        })
        callback(this.RESULT_SUCCESS, JSON.stringify(networks))
    }.bind(this))

    // @todo example JSON data which represents workout IDs
}

module.exports = WifiNetworksCharacteristic
