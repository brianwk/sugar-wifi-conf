let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')
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
}

util.inherits(JsonObjectCharacteristic, BlenoCharacteristic)

JsonObjectCharacteristic.prototype.emitObject = function (object) {
	this.observer.next(object)
}

JsonObjectCharacteristic.prototype.onObjectUpdate = function () {
    const next = function (object) {
	if (typeof object != 'object') {
	    console.log('invalid buffer', object)
            return
        }
	const encoded = JSON.stringify(object)
        const buffer = Buffer.from(encoded, 'ascii')
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
