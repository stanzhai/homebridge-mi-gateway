# homebridge-mi-gateway

[![npm version](https://badge.fury.io/js/homebridge-mi-gateway.svg)](https://badge.fury.io/js/homebridge-mi-gateway)

XiaoMi Gateway plugin for HomeBridge.

Thanks for [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol), [aholstenson](https://github.com/aholstenson)(the author of [miio](https://github.com/aholstenson/miio)), all other developer and testers.

## Pre-Requirements

Make sure you have V2 of the gateway.

![](https://raw.githubusercontent.com/stanzhai/homebridge-mi-gateway/master/Gateway.jpg)

## Features

- FM Switch
- Lightbulb Control
- Security

## Installation

1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install this plugin.   `npm install -g homebridge-mi-gateway`

## Configuration

Modify `~/.homebridge/config.json`.

```
"accessories": [{
    "accessory": "MiGateway",
    "ip": "192.168.123.xx",
    "token": "your-token",
    "name": "MiGateway",
    "fmName": "FM",
    "lightName": "Lightbulb",
    "securityName": "Security"
}]
```

## Get token

### Get token by miio2.db

setup MiJia(MiHome) app in your android device or android virtual machine.   
open MiJia(MiHome) app and login your account.   
refresh device list and make sure device display in the device list.   
get miio2.db(path: /data/data/com.xiaomi.smarthome/databases/miio2.db) file from your android device or android virtual machine.   
open website [[Get MiIo Tokens By DataBase File](http://miio2.yinhh.com/)], upload miio2.db file and submit.    

### Get token by network

Install miio: `npm install -g miio@0.14.1`

Open command prompt or terminal. Run following command:   

```
miio --discover
```

Wait until you get output similar to this:   

```
Device ID: xxxxxxxx   
Model info: Unknown   
Address: 192.168.88.xx   
Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx via auto-token   
Support: Unknown   
```

"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" is token.   
If token is "???", then reset device and connect device created Wi-Fi hotspot.   
Run following command:   

```
miio --discover --sync
```

Wait until you get output.   
For more information about token, please refer to [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol) and [miio](https://github.com/aholstenson/miio).   

## License

Copyright 2018 by Stan Zhai. Licensed under MIT.
