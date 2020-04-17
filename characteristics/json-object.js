let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
let wpa = require('wpa_supplicant')
const wlan0 = wpa('wlan0')
const { Observable } = require('rxjs')

let BlenoCharacteristic = bleno.Characteristic

let JsonObjectCharacteristic = function (serviceUuid) {
    if (!serviceUuid) {
        throw new Error("You must supply serviceUuid argument as a string to instantiate this Characteristic")
    }
    JsonObjectCharacteristic.super_.call(this, {
        uuid: serviceUuid,
        properties: ['notify']
    })

    this.emitObject = function (object) {
        this.observer.next(object)
    }.bind(this)
}

util.inherits(JsonObjectCharacteristic, BlenoCharacteristic)

JsonObjectCharacteristic.prototype.onObjectUpdate = function () {
    const next = function (object) {
        const encoded = JSON.stringify(object)
        try {
            const buffer = Buffer.from(encoded, 'ascii')
        } catch (e) {
            console.log('Invalid buffer', encoded)
        }
        for (let i = 0; i < buffer.byteLength; i = i + this.maxValueSize) {
            this.updateValueCallback(buffer.slice(i, i + this.maxValueSize))
        }
    }.bind(this)

    const objects = Observable.create((observer) => {
        this.iterateObjects(observer)
        observer.complete()
    })

    objects
        .pipe.apply(objects, this.pipeline)
        .subscribe({ next })
}

JsonObjectCharacteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
    this.maxValueSize = maxValueSize
    this.updateValueCallback = updateValueCallback
}

module.exports = JsonObjectCharacteristic
