'use strict';

module.exports = core;

const path = require('path')
// 对比版本号
const semver = require('semver')
// 改打印颜色
const colors = require('colors/safe')
// 获取用户主目录
const userHome = require('user-home')
// 判断路径存不存在
const pathExists = require('path-exists').sync
// 注册命令
const commander = require('commander')

const pkg = require('../package.json')
const log = require('@sanstu-cli/log')
const init = require('@sanstu-cli/init')
const exec = require('@sanstu-cli/exec')
const constant = require('./const')

const program = new commander.Command()

async function core() {
  try {
    await prepare()
    registerCommand()
  } catch (e) {
    log.error(e.message)
  }
}

function registerCommand () {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化')
    .action(exec)

  // debug模式
  program.on('option:debug', function () {
    if (program.debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
  })
  // 指定targetPath
  program.on('option:targetPath', function () {
    process.env.CLI_TARGET_PATH = program.targetPath
  })
  // 未知命令监听
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map(cmd => cmd.name())
    console.log(colors.red(`未知的命令：${obj[0]}`))
    if (availableCommands.length) {
      console.log(colors.red(`可用命令：${availableCommands.join(',')}`))
    }
  })

  program.parse(process.argv)

  if (program.args && program.args.length < 1) {
    program.outputHelp()
    console.log()
  }
}

async function prepare () {
  checkPkgVersion()
  checkNodeVersion()
  checkRoot()
  checkUserHome()
  checkEnv()
  await checkGlobalUpdate()
}

async function checkGlobalUpdate () {
  // 1.获取当前版本号和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 2.调用npm API，获取所有的版本号
  // 3.提取所有的版本号，比对那些版本号是大于当前版本号的
  // 4.获取最新的版本号，提示用户更新到该版本
  const { getNpmSemverVersion } = require('@sanstu-cli/get-npm-info')
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName)
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion} 更新命令：npm install -g ${npmName}`))
  }
}

function checkEnv () {
  // 从用户主目录下的.env加载环境变量
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    })
  }
  createDefaultConfig()
}

function createDefaultConfig () {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

function checkUserHome () {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录主目录不存在！'))
  }
}

// 检查root启动，降级
function checkRoot () {
  const rootCheck = require('root-check')
  rootCheck()
}

function checkNodeVersion () {
  // 第一步，获取当前Node版本号
  const currentVersion = process.version
  // 第二步，比对最低版本号
  const lowestNodeVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowestNodeVersion)) {
    throw new Error(colors.red(`sanstu-cli 需要安装 v${lowestNodeVersion} 以上版本的 Node.js`))
  }
}

// 查看版本号
function checkPkgVersion () {
  log.info('cli', pkg.version)
}
