'use strict';

const path = require('path')
const pkgDir = require('pkg-dir').sync
const { isObject } = require('@sanstu-cli/utils')
const formatPath = require('@sanstu-cli/format-path')

class Package {
    constructor (options) {
        if (!options) {
            throw new Error('Package类的options参数不能为空')
        }
        if (!isObject(options)) {
            throw new Error('Package类的options参数必须为对象')
        }
        // package的目标路径
        this.targetPath = options.targetPath
        // package的存储路径
        this.storePath = options.storePath
        // package的name
        this.packageName = options.packageName
        // package的version
        this.packageVersion = options.packageVersion
    }
    // 判断当前Package是否存在
    exists () {}
    // 安装Package
    install () {}
    // 更新Package
    update () {}
    // 获取入口文件的路径
    getRootFilePath () {
        // 1.获取package.json所在目录 - pkg-dir
        const dir = pkgDir(this.targetPath)
        if (dir) {
            // 2.读取package.json - require() js/json/node
            const pkgFile = require(path.resolve(dir, 'package.json'))
            // 3.main/lib - path
            if (pkgFile &&  pkgFile.main) {
                // 4.路径的兼容(macOS/windows)
                return formatPath(path.resolve(dir, pkgFile.main))
            }
        }
        return null
    }
}

module.exports = Package
