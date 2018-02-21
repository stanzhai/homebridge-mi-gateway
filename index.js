const fs = require('fs');
const miio = require('miio');
const { color } = require('abstract-things/values');
var Service, Characteristic;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "MiGateway")) {
        return;
    }

    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-mi-gateway', 'MiGateway', MiGateway);
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

function MiGateway(log, config) {
    if(null == config) {
        return;
    }

    this.log = log;
    this.config = config;
    this._device = null;
}

MiGateway.prototype = {
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

        var lightService = new Service.Lightbulb(this.lightName || "Light");
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

        var fmService = new Service.Switch(this.config.fmName || "FM");
        fmService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getFMStatus.bind(this))
            .on('set', this.setFMStatus.bind(this));
        services.push(fmService);

        var securityService = new Service.SecuritySystem(this.config['securityName'] || "Security");
        securityService
            .getCharacteristic(Characteristic.SecuritySystemCurrentState)
            .setProps({ validValues: [1, 3]})
            .on('get', this.getCurrentSecurity.bind(this))
            .value = Characteristic.SecuritySystemCurrentState.DISARMED;
        securityService
            .getCharacteristic(Characteristic.SecuritySystemTargetState)
            .setProps({ validValues: [1, 3]})
            .on('get', this.getTargetSecurity.bind(this))
            .on('set', this.setTargetSecurity.bind(this))
            .value = Characteristic.SecuritySystemCurrentState.DISARM;
        services.push(securityService);

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

    /////////////////////////////////////////////////////////////////////
    // Light
    /////////////////////////////////////////////////////////////////////

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
            const currentColor = color.rgb(rgb.red, rgb.green, rgb.blue).hsv;
            that.log.info("get Hue: " + currentColor.hue + ", " + rgb);
            callback(null, currentColor.hue);
        }).catch(callback);
    },

    setHue: function (value, callback) {
        const that = this;
        this.getDevice().then(res => {
            const rgb = res.light.gateway.property("rgb");
            const brightness = res.light.gateway.property("brightness");
            const currentColor = color.rgb(rgb.red, rgb.green, rgb.blue).hsv;
            const newColor = color.hsv(value, currentColor.saturation, brightness).rgb;
            that.log.info("set Hue: " + value + ", " + newColor);
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
            const currentColor = color.rgb(rgb.red, rgb.green, rgb.blue).hsv;
            that.log.info("get saturation: " + currentColor.saturation + ", " + rgb);
            callback(null, currentColor.saturation);
        }).catch(callback);
    },

    setSaturation: function (value, callback) {
        const that = this;
        this.getDevice().then(res => {
            const rgb = res.light.gateway.property("rgb");
            const brightness = res.light.gateway.property("brightness");
            const currentColor = color.rgb(rgb.red, rgb.green, rgb.blue).hsv;
            const newColor = color.hsv(currentColor.hue, value, brightness).rgb;
            that.log.info("set saturation: " + value + ", " + newColor);
            return res.light.changeColor(newColor);
        }).then(res => {
            if (res[0] == "ok") {
                callback(null);
            } else {
                callback(res);
            }
        }).catch(callback);
    },

    /////////////////////////////////////////////////////////////////////
    // FM
    /////////////////////////////////////////////////////////////////////

    getFMStatus: function (callback) {
        var that = this;
        this.getDevice().then(res => {
            return res.device.call("get_prop_fm", []);
        }).then(result => {
            callback(null, result['current_status'] === 'pause' ? false : true);
        }).catch(function(err) {
            that.log.error("[MiGateway][ERROR]getFMStatus Error: " + err);
            callback(err);
        });
    },

    setFMStatus: function (value, callback) {
        var that = this;
        this.getDevice().then(res => {
            return res.device.call("play_fm", [ value ? "on" : "off"]);
        }).then(result => {
            if(result[0] === "ok") {
                callback(null);
            } else {
                callback(new Error(result[0]));
            }
        }).catch(function(err) {
            that.log.error("[MiGateway][ERROR]setFMStatus Error: " + err);
            callback(err);
        });
    },

    /////////////////////////////////////////////////////////////////////
    // Security
    /////////////////////////////////////////////////////////////////////

    getCurrentSecurity: function (callback) {
        var that = this;
        this.getDevice().then(res => {
            return res.device.call("get_arming", []);
        }).then(result => {
            var value = null;
            if(result[0] === 'on') {
                callback(null, Characteristic.SecuritySystemCurrentState.AWAY_ARM);
            } else if(result[0] === 'off') {
                callback(null, Characteristic.SecuritySystemCurrentState.DISARMED);
            } else {
                callback(new Error(result[0]));
            }
        }).catch(function(err) {
            that.log.error("[MiGateway][ERROR]get Current Security Error: " + err);
            callback(err);
        });
    },

    getTargetSecurity: function (callback) {
        var that = this;
        this.getDevice().then(res => {
            return res.device.call("get_arming", []);
        }).then(result => {
            var value = null;
            if(result[0] === 'on') {
                callback(null, Characteristic.SecuritySystemTargetState.AWAY_ARM);
            } else if(result[0] === 'off') {
                callback(null, Characteristic.SecuritySystemTargetState.DISARM);
            } else {
                callback(new Error(result[0]));
            }
        }).catch(function(err) {
            that.log.error("[MiGateway][ERROR]get Target Security Error: " + err);
            callback(err);
        });
    },

    setTargetSecurity: function (value, callback) {
        var val = "off";
        if (Characteristic.SecuritySystemCurrentState.AWAY_ARM == value) {
            val = "on";
        } else if (Characteristic.SecuritySystemCurrentState.DISARMED == value) {
            val = "off";
        } else {
            val = "off";
        }

        var that = this;
        this.getDevice().then(res => {
            return res.device.call("set_arming", [val]);
        }).then(result => {
            if(result[0] === "ok") {
                callback(null);
            } else {
                callback(new Error(result[0]));
            }
        }).catch(function(err) {
            that.log.error("[MiGateway][ERROR] set Target Security Error: " + err);
            callback(err);
        });
    }
}
