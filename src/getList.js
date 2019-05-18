let http = require('http')
let fs = require('fs')
let request = require('request')
let path = require('path')
const nikeUrl = 'https://api.nike.com/product_feed/threads/v2?filter=marketplace%28CN%29&filter=language%28zh-Hans%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&anchor=2&count=10&fields=active&fields=id&fields=lastFetchTime&fields=productInfo&fields=publishedContent.nodes&fields=publishedContent.properties.coverCard&fields=publishedContent.properties.productCard&fields=publishedContent.properties.products&fields=publishedContent.properties.publish.collections&fields=publishedContent.properties.relatedThreads&fields=publishedContent.properties.seo&fields=publishedContent.properties.threadType&fields=publishedContent.properties.custom&fields=publishedContent.properties.title'


function checkList(dataStream) {
    filePath = path.resolve(__dirname, '../data')
    console.log(filePath)
    // 新建一个写入流
    let myWriteStream = fs.createWriteStream(filePath + '/shoesData.txt')
    // 新建一个读取流
    let myReadStream = fs.createReadStream(filePath + '/shoesData.txt')
    let data = '' // 存在的数据字符串
    let dataObject = []


    myReadStream.on('data', chunk => {
        data += chunk
    })

    // 这个是流读取结束时触发
    myReadStream.on('end', chunk => {
        console.log('*******************************\n', data)
    })

    let count = 0
    for (let i = 0; i < dataStream.length; i++) {
        const temp = dataStream[i]
        if (!(data.indexOf(temp.id) === -1)) {
            console.log('1111', temp)
            count ++
        }
    }
    if (count !== 0) {
        myWriteStream.write(JSON.stringify(dataStream))
        myWriteStream.end()
        myWriteStream.on('finish', () => {
            console.log('finished')
        })
    } else {
        return
    }
}

function requestGetList() {
    let arr = []
    console.log('nike接口调用启动，时间间隔10S')
    request(nikeUrl, function (error, response, body) {
        if (!error) {
            const data = JSON.parse(body).objects
            for (let i = 0, _sizei = data.length; i < _sizei; i++) {
                let temp = {
                    id: data[i].id,
                    imgurl: data[i].publishedContent.properties.coverCard.properties.squarishURL,
                    title: data[i].publishedContent.nodes[0].properties.title
                }
                arr.push(temp)
            }
            checkList(arr)
        }
    })
}

function setGetTime() {
    console.log(111)
    requestGetList()
}

module.exports = setGetTime