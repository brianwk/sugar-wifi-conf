let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')
const wlan0 = wpa('wlan0')
const { timer, ReplaySubject } = require('rxjs')
const { distinct, map, toArray, first, takeUntil } = require('rxjs/operators')

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
    const size = bleno.mtu - 1;
    console.log('read networks', offset, size, this.buffer)

    if (offset > 0) {
        callback(this.RESULT_SUCCESS, this.buffer.slice(offset, offset + size))
        return
    }

    this.networks
        .pipe(
            distinct(({ ssid }) => ssid),
            map(({ ssid, frequency, signal }) => ({ ssid, signal, frequency })),
            takeUntil(timer(5000)),
            toArray(),
            first()
        )
        .subscribe((networks) => {
            const encoded = JSON.stringify(networks)
            this.buffer = Buffer.from(encoded, 'ascii')
            callback(this.RESULT_SUCCESS, this.buffer.slice(offset, size))
        })
}

module.exports = WifiNetworksCharacteristic
