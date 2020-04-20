let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
const { Observable } = require('rxjs')

let BlenoCharacteristic = bleno.Characteristic

let JsonObjectCharacteristic = function (serviceUuid) {
    if (!serviceUuid) {
        throw new Error("You must supply serviceUuid argument as a string to instantiate this Characteristic")
    }
    console.log('serviceUuid', serviceUuid)
    JsonObjectCharacteristic.super_.call(this, {
        uuid: serviceUuid,
        properties: ['notify']
    })
}

util.inherits(JsonObjectCharacteristic, BlenoCharacteristic)

JsonObjectCharacteristic.prototype.emitObject = function (object) {
    this.observer.next(object)
}

JsonObjectCharacteristic.prototype.onObjectUpdate = function () {
    const next = function (object) {
        const encoded = JSON.stringify(object)
        let buffer
	try {
            buffer = Buffer.from(encoded, 'ascii')
        } catch (e) {
            console.log('Invalid buffer', encoded)
        }
        for (let i = 0; i < buffer.byteLength; i = i + this.maxValueSize) {
            this.updateValueCallback(buffer.slice(i, i + this.maxValueSize))
        }
    }.bind(this)

    let self = this
    const objects = Observable.create((observer) => {
	self.observer = observer
	self.iterateObjects(self.emitObject)
        observer.complete()
    })

    objects
        .pipe.apply(objects, this.pipeline.call(this))
        .subscribe({ next })
}

JsonObjectCharacteristic.prototype.onSubscribe = function (maxValueSize, updateValueCallback) {
    this.maxValueSize = maxValueSize
    this.updateValueCallback = updateValueCallback
}

module.exports = JsonObjectCharacteristic
