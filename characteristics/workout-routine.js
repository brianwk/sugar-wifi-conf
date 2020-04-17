let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')

let BlenoCharacteristic = bleno.Characteristic

let JsonRpcCharacteristic = function () {
    JsonRpcCharacteristic.super_.call(this, {
        uuid: UUID.JSON_RPC,
        properties: ['read', 'write', 'writeWithoutResponse']
    })

    this.response = null
}

util.inherits(JsonRpcCharacteristic, BlenoCharacteristic)

JsonRpcCharacteristic.prototype.onReadRequest = function (offset, callback) {
    console.log('workout routine read', offset)
    /**
     * @app.route('/set_workout_routine/<id>')
     * @app.route('/workouts_available')
     */
    const data = '["1", "2", "3", "4", "5"]'
    // @todo example JSON data which represents workout IDs
    callback(this.RESULT_SUCCESS, data)
}

JsonRpcCharacteristic.prototype.onWriteRequest = function (data, offset, withoutResponse, callback) {
    console.log('InputCharacteristic write request: ' + data.toString() + ' ' + offset + ' ' + withoutResponse)
    /**
     * @app.route('/set_workout_routine/<id>')
     */
    let workoutId = data.toString()
    console.log('got workoutId', workoutId)
    callback(this.RESULT_SUCCESS)
}

module.exports = JsonRpcCharacteristic
