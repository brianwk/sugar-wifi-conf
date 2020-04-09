let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')
const wlan0 = wpa('wlan0')
const { ReplaySubject } = require('rxjs')
const { distinct, map, toArray, take } = require('rxjs/operators')

let BlenoCharacteristic = bleno.Characteristic

let WifiNetworksCharacteristic = function () {
    WifiNetworksCharacteristic.super_.call(this, {
        uuid: UUID.WIFI_NETWORKS,
        properties: ['read']
    })
    this.networks = new ReplaySubject()

    wlan0.on('ready', function () {
        console.log('scanning networks')
        wlan0.scan()
        this.interval = setInterval(wlan0.scan.bind(wlan0), 5000)
    }.bind(this))

    wlan0.on('update', function () {
        wlan0.networks.forEach((n) => {
            this.networks.next(n)
        })
    }.bind(this))
}

util.inherits(WifiNetworksCharacteristic, BlenoCharacteristic)

WifiNetworksCharacteristic.prototype.onReadRequest = function (offset, callback) {
    console.log('read networks request')
    this.networks
        .pipe(
            distinct(({ ssid }) => ssid),
            map(({ ssid, frequency, signal }) => ({ ssid, signal, frequency })),
            take(10),
            toArray()
        )
        .subscribe(
            (networks) => callback(this.RESULT_SUCCESS, new Buffer(JSON.stringify(networks)))
        )
}

module.exports = WifiNetworksCharacteristic
