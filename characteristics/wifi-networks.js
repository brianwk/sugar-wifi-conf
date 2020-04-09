let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')
const wlan0 = wpa('wlan0')
const { of, timer, ReplaySubject } = require('rxjs')
const { delay, distinct, map, toArray, first, takeUntil } = require('rxjs/operators')

let BlenoCharacteristic = bleno.Characteristic

let WifiNetworksCharacteristic = function () {
    WifiNetworksCharacteristic.super_.call(this, {
        uuid: UUID.WIFI_NETWORKS,
        properties: ['notify']
    })
    this.networks = new ReplaySubject()

    wlan0.on('ready', function () {
        console.log('scanning networks')
        wlan0.scan()
    }.bind(this))

    console.log(wlan0.eventNames())
}

util.inherits(WifiNetworksCharacteristic, BlenoCharacteristic)

WifiNetworksCharacteristic.prototype.onNetworkUpdate = function () {

}

WifiNetworksCharacteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
    const next = (network) => {
        const encoded = JSON.stringify(network)
        buffer = Buffer.from(encoded, 'ascii')
        updateValueCallback(buffer)
    }

    this.subscription = wlan0.on(
        'update',
        function () {
            of(wlan0.networks)
                .pipe(
                    delay(5000),
                    distinct(({ ssid }) => ssid),
                    map(({ ssid, signal }) => ({ ssid, signal })),
                    takeUntil(timer(10000)),
                )
                .subscribe({ next })
        }.bind(this)
    )
}

WifiNetworksCharacteristic.prototype.onNotify = function () {
    wlan0.scan()
}

WifiNetworksCharacteristic.prototype.onUnsubscribe = function () {
    wlan0.removeListener('update')
}

module.exports = WifiNetworksCharacteristic
