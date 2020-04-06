const execSync = require('child_process').execSync
let util = require('util')
let bleno = require('bleno')
let UUID = require('../sugar-uuid')

let BlenoCharacteristic = bleno.Characteristic

let WorkoutRoutineCharacteristic = function () {
    WorkoutRoutineCharacteristic.super_.call(this, {
        uuid: UUID.WORKOUT_ROUTINE,
        properties: ['write', 'writeWithoutResponse']
    })
}

util.inherits(WorkoutRoutineCharacteristic, BlenoCharacteristic)

WorkoutRoutineCharacteristic.prototype.onWriteRequest = function (data, offset, withoutResponse, callback) {
    console.log('InputCharacteristic write request: ' + data.toString() + ' ' + offset + ' ' + withoutResponse)
    /**
     * @app.route('/set_workout_routine/<id>')
     * @app.route('/play')
     * @app.route('/pause')
     * @app.route('/rewind')
     * @app.route('/refresh')
     * @app.route('/workouts_available')
     * @app.route('/mute')
     * @app.route('/unmute')
     * @app.route('/mobile_stats/<user_id>')
     */
    let inputArray = data.toString().split(concatTag)
    if (inputArray && inputArray.length < 3) {
        console.log('Wrong input syntax.')
        setMessage('Wrong input syntax.')
        callback(this.RESULT_SUCCESS)
        return
    }
    if (inputArray[0] !== config.key) {
        console.log('Wrong input key.')
        setMessage('Wrong input key.')
        callback(this.RESULT_SUCCESS)
        return
    }
    let ssid = inputArray[1]
    let password = inputArray[2]
    let result = setWifi(ssid, password)
    callback(this.RESULT_SUCCESS)
}

module.exports = WorkoutRoutineCharacteristic
