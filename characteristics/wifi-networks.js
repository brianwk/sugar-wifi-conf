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
    console.log('read networks request')
    this.interface = wpa('wlan0')
    this.interface.on('ready', function () {
        console.log('scanning networks')
        this.interface.scan()
    }.bind(this))

    this.interface.on('update', function () {
        console.log('update state from dbus')
        // var cur = wifi.currentNetwork
        const networks = this.interface.networks.map((n) => {
            let ssid = n.ssid,
                signal = n.signal,
                frequency = n.frequency

            return { ssid, signal, frequency }
        })
        callback(this.RESULT_SUCCESS, JSON.stringify(networks))
    }.bind(this))

    // @todo example JSON data which represents workout IDs
}

module.exports = WifiNetworksCharacteristic
