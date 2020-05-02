let wpa = require('wpa_supplicant')

module.exports = (function () {
    var instance

    function createInstance() {
	if (instance) {
            throw new Error("Cannot create multiple instances of wpa interface")
	}
        let object = wpa('wlan0')
	object.on('ready', () => object.scan())
        return object
    }

    return {
        get wlan0() {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})()
