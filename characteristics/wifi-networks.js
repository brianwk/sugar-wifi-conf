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
}

util.inherits(WifiNetworksCharacteristic, BlenoCharacteristic)

WifiNetworksCharacteristic.prototype.onNetworkUpdate = function () {
    console.log('calling onNetworkUpdate')

    const { updateValueCallback } = this
    const next = (network) => {
        const encoded = JSON.stringify(network)
        const buffer = Buffer.from(encoded, 'ascii')
        updateValueCallback(buffer)
    }

    of(wlan0.networks)
        .pipe(
            delay(5000),
            distinct(({ ssid }) => ssid),
            map(({ ssid, signal }) => {
                console.log('got network', { ssid, signal })
                return { ssid, signal }
            }),
            takeUntil(timer(10000))
        )
        .subscribe({ next })
}

WifiNetworksCharacteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
    console.log('subscribe to WifiNetworksCharacteristic')

    wlan0.on('ready', wlan0.scan)

    this.updateValueCallback = updateValueCallback
    wlan0.on(
        'update',
        this.onNetworkUpdate.bind(this)
    )
}

WifiNetworksCharacteristic.prototype.onNotify = function () {
    wlan0.scan()
}

WifiNetworksCharacteristic.prototype.onUnsubscribe = function () {
    wlan0.removeAllListeners()
}

module.exports = WifiNetworksCharacteristic
