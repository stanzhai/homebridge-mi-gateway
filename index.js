const fs = require('fs');
const miio = require('miio');
const { color } = require('abstract-things/values');
var Service, Characteristic;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "MiGatewayLight")) {
        return;
    }

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-mi-gateway-light', 'MiGatewayLight', MiGatewayLight);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if ("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if ("platforms" === type) {
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
            .addCharacteristic(Characteristic.Hue)
            .on('get', this.getHue.bind(this))
            .on('set', this.setHue.bind(this));
        lightService
            .addCharacteristic(Characteristic.Saturation)
            .on('get', this.getSaturation.bind(this))
            .on('set', this.setSaturation.bind(this));
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
            return res.light.power()
        }).then(power => callback(null, power)).catch(callback);
    },

    setPower: function(value, callback) {
        var that = this;
        this.getDevice().then(res => {
            return res.light.setPower(value)
        }).then(power => callback(null)).catch(callback);
    },

    getBrightness: function (callback) {
        this.getDevice().then(res => {
            callback(null, res.light.gateway.property("brightness"));
        }).catch(callback);
    },

    setBrightness: function (value, callback) {
        this.getDevice().then(res => {
            return res.light.changeBrightness(value);
        }).then(bright => callback(null)).catch(callback);
    },

    getHue: function (callback) {
        const that = this;
        this.getDevice().then(res => {
            const rgb = res.light.gateway.property("rgb");
            const currentColor = color.rgb(rgb.red, rgb.green, rgb.blue).hsl;
            callback(null, currentColor.hue);
        }).catch(callback);
    },

    setHue: function (value, callback) {
        const that = this;
        this.getDevice().then(res => {
            const rgb = res.light.gateway.property("rgb");
            const brightness = res.light.gateway.property("brightness");
            const currentColor = color.rgb(rgb.red, rgb.green, rgb.blue).hsl;
            const newColor = color.hsl(value, currentColor.saturation, brightness).rgb;
            return res.light.changeColor(newColor);
        }).then(res => {
            if (res[0] == "ok") {
                callback(null);
            } else {
                callback(res);
            }
        }).catch(callback);
    },

    getSaturation: function (callback) {
        const that = this;
        this.getDevice().then(res => {
            const rgb = res.light.gateway.property("rgb");
            const currentColor = color.rgb(rgb.red, rgb.green, rgb.blue).hsl;
            callback(null, currentColor.saturation);
        }).catch(callback);
    },

    setSaturation: function (value, callback) {
        const that = this;
        this.getDevice().then(res => {
            const rgb = res.light.gateway.property("rgb");
            const brightness = res.light.gateway.property("brightness");
            const currentColor = color.rgb(rgb.red, rgb.green, rgb.blue).hsl;
            const newColor = color.hsl(currentColor.hue, value, brightness).rgb;
            return res.light.changeColor(newColor);
        }).then(res => {
            if (res[0] == "ok") {
                callback(null);
            } else {
                callback(res);
            }
        }).catch(callback);
    }
}

// TODO: hsl -> hsv ?
