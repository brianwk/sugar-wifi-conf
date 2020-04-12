let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')
const wlan0 = wpa('wlan0')
const { Observable, timer, ReplaySubject } = require('rxjs')
const { delay, distinct, map, toArray, first, takeUntil } = require('rxjs/operators')

let BlenoCharacteristic = bleno.Characteristic

let WifiNetworksCharacteristic = function () {
    WifiNetworksCharacteristic.super_.call(this, {
        uuid: UUID.WIFI_NETWORKS,
        properties: ['notify']
    })
}

util.inherits(WifiNetworksCharacteristic, BlenoCharacteristic)

WifiNetworksCharacteristic.prototype.onNetworkUpdate = function () {
    const next = function (network) {
	const encoded = JSON.stringify(network)
	try {
            const buffer = Buffer.from(encoded, 'ascii')
	} catch (e) {
            console.log('Invalid buffer', encoded)
        }
	for (let i = 0; i < buffer.byteLength; i = i + this.maxValueSize) {
            this.updateValueCallback(buffer.slice(i, i + this.maxValueSize))
	}
    }.bind(this)

    const networks = Observable.create((observer) => {
        //setTimeout(() => {
	    wlan0.networks.forEach((network) => observer.next(network))
            observer.complete()
	// }, 5000)
    })

    networks
        .pipe(
            distinct(({ ssid }) => ssid),
            map(({ ssid, signal }) => {
                return { ssid, signal }
            })
        )
        .subscribe({ next })
}

WifiNetworksCharacteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
    this.maxValueSize = maxValueSize
    console.log('subscribe to WifiNetworksCharacteristic')
    wlan0.on('ready', () => wlan0.scan())

    this.updateValueCallback = updateValueCallback
    wlan0.on(
        'update',
	function () {
            this.onNetworkUpdate()
        }.bind(this)
    )
}

WifiNetworksCharacteristic.prototype.onNotify = function () {
    wlan0.scan()
}

WifiNetworksCharacteristic.prototype.onUnsubscribe = function () {
    wlan0.removeAllListeners()
}

module.exports = WifiNetworksCharacteristic
