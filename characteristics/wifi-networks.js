let util = require('util')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')
const { wlan0 } = require('../wlan0')
const { distinct, map } = require('rxjs/operators')
const JsonObjectCharacteristic = require('./json-object')

let WifiNetworksCharacteristic = function () {
    WifiNetworksCharacteristic.super_.call(this, UUID.WIFI_NETWORKS)
    this.pipeline = () => (
	[
        distinct(({ ssid }) => ssid),
        map(({ ssid, signal }) => ( { ssid, signal }))
	]
    )
}

util.inherits(WifiNetworksCharacteristic, JsonObjectCharacteristic)

WifiNetworksCharacteristic.prototype.iterateObjects = function(callback) {
	return wlan0.networks.forEach(callback.bind(this))
}

WifiNetworksCharacteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
    console.log('New subscriber')

    WifiNetworksCharacteristic.super_.prototype.onSubscribe.apply(this, [maxValueSize, updateValueCallback])

    wlan0.scan()
    wlan0.on(
        'update',
        this.onObjectUpdate.bind(this)
    )
}

WifiNetworksCharacteristic.prototype.onNotify = function () {
    //if (!wlan0.scanning) {
	wlan0.scan()
    //}
}

WifiNetworksCharacteristic.prototype.onUnsubscribe = function () {
    console.log('Lost subscriber')
    wlan0.removeAllListeners()
}

module.exports = WifiNetworksCharacteristic
