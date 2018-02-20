const fs = require('fs');
const miio = require('miio');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "MiGatewayLight")) {
        return;
    }

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerAccessory('homebridge-mi-gateway-light', 'MiGatewayLight', MiGatewayLight);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function MiGatewayLight(log, config) {
    if(null == config) {
        return;
    }

    this.log = log;
    this.config = config;

    var that = this;
    this._device = null;
}

MiGatewayLight.prototype = {
    identify: function(callback) {
        callback();
    },

    getServices: function() {
        var services = [];

        var infoService = new Service.AccessoryInformation();
        infoService
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "Gateway")
            .setCharacteristic(Characteristic.SerialNumber, "Undefined");
        services.push(infoService);

        var lightService = new Service.Lightbulb(this.name);
        lightService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getPower.bind(this))
            .on('set', this.setPower.bind(this));
        lightService
            .addCharacteristic(Characteristic.Brightness)
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));
        lightService
            .addCharacteristic(Characteristic.ColorTemperature)
            .setProps({
                minValue: 50,
                maxValue: 400,
                minStep: 1
            })
            .on('get', this.getColorTemperature.bind(this))
            .on('set', this.setColorTemperature.bind(this));
        services.push(lightService);

        return services;
    },

    getDevice: function() {
        var that = this;
        return new Promise((resolve, reject) => {
            if (that._device != null) {
                resolve(that._device);
                return;
            }
            miio.device({address: that.config.ip, token: that.config.token})
                .then(res => {
                    const children = res.children();
                    for (const child of children) {
                        if (child.matches('type:light')) {
                            that._device = {device: res, light: child};
                            resolve(that._device);
                            break;
                        }
                    }
                })
        });
    },

    getPower: function(callback) {
        var that = this;
        this.getDevice().then(res => {
            return res.device.call("get_prop", ["power"], {sid: res.child.internalId})
        }).then(result => {
            console.log(result);
            callback(null, result);
        }).catch(callback);
    },

    setPower: function(value, callback) {
        var that = this;
        this.getDevice().then(res => {
            return res.device.call("set_power", [value ? "on" : "off"], {sid: res.child.internalId})
        }).then(result => {
            console.log(result);
            if (result[0] == "ok") {
                callback(null);
            } else {
                callback(new Error(result[0]));
            }
        }).catch(callback);
    },

    getBrightness: function (callback) {
        
    },

    setBrightness: function (value, callback) {

    },

    getColorTemperature: function (callback) {

    },

    setColorTemperature: function (value, callback) {

    }
}
