import { promises as fs } from 'fs';
import { FormData } from 'formdata-node';
import path from 'path';
import got from 'got';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getFilesInDir(dirpath) {
    // 读取文件夹中的文件列表
    let files = await fs.readdir(dirpath, { withFileTypes: true });

    // 过滤出文件
    const filteredFiles = files.filter(file => file.isFile());

    return filteredFiles;
}

async function getRandomFileInDir(dirpath) {
    // 读取文件夹中的文件列表
    let files = await fs.readdir(dirpath, { withFileTypes: true });

    // 过滤出文件
    const filteredFiles = files.filter(file => file.isFile());

    // 获取文件的修改时间
    const fileTimes = filteredFiles.map(file => {
        const { mtime } = fs.statSync(path.resolve(dirpath, file.name));
        return { name: file.name, time: new Date(mtime) };
    });

    // 按照修改时间对文件进行排序
    fileTimes.sort((a, b) => b.time - a.time);

    // 打印已排序的文件列表
    return fileTimes[Math.floor(Math.random() * fileTimes.length)];
}

async function main() {
    const readRes = await fs.readdir(__dirname + "/../screenshot/")

    // update Number of sites
    let readmeData = await fs.readFile(__dirname + "/../README.md", { encoding: "utf-8" });

    let regexp = /-[0-9]+-/g;
    readmeData = readmeData.replace(/-[0-9]+-/g, "-" + readRes.length + "-");

    let allScreenShots = await getFilesInDir(__dirname + "/../screenshot/");

    // update Daily Show
    let randomshot = allScreenShots[Math.floor(Math.random() * allScreenShots.length)];

    let randomshotUrlExp = new RegExp("(?<=" + randomshot.name + "\\)\\]\\()(.+?)(?=\\))", "g")
    let randomshotRepoUrl = readmeData.match(randomshotUrlExp)[0];
    
    let randomshotSiteUrl = randomshotRepoUrl.substr(randomshotRepoUrl.lastIndexOf("/")+1,999);

    regexp = /## Daily Show([\s\S]*?)## Index/g
    readmeData = readmeData.replace(regexp,
        `## Daily Show

[![](./screenshot/${randomshot.name})](${randomshotRepoUrl})

## Index`);

    await fs.writeFile(__dirname + "/../README.md", readmeData, "utf-8");

    const adjectives = [
        "excellent",
        "brilliant",
        "beautiful"
    ]
    const adjective=adjectives[Math.floor(Math.random()*adjectives.length)]
    const nouns = [
        "work",
        "experience",
        "animation",
        "job"
    ]
    const noun=nouns[Math.floor(Math.random()*nouns.length)]
    await createTweet("🗓"+getFormattedDate()+' '+getRandomEmoji()+` #AwesomeSites Daily Show, ${randomshotSiteUrl} 😘, ${adjective} ${noun} 👍, already backed up in github.com/ezshine/AwesomeSites`, `./screenshot/${randomshot.name}`);
}

function getRandomEmoji() {
    const start = 0x1F600; // Emoji 起始点
    const end = 0x1F64F;   // Emoji 结束点
    const randomCodePoint = Math.floor(Math.random() * (end - start + 1)) + start;
    return String.fromCodePoint(randomCodePoint);
}
function getFormattedDate() {
const now = new Date();
const day = String(now.getDate()).padStart(2, '0'); // 确保日是两位数
const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，所以加1
const year = now.getFullYear(); // 获取四位数的年份

// 格式化为“日/月/年”
return `${day}/${month}/${year}`;
}

const consumerApiKey = process.env.CONSUMERAPIKEY;
const consumerApiKeySecret = process.env.CONSUMERAPIKEYSECRET;
const accessToken = process.env.ACCESSTOKEN;
const accessTokenSecret = process.env.ACCESSTOKENSECRET;

// 创建 OAuth 1.0a 实例
const oauth = new OAuth({
    consumer: { key: consumerApiKey, secret: consumerApiKeySecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
        return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64');
    },
});

// 获取 OAuth 头部
function getAuthHeader(url, method) {
    const request_data = { url, method };
    const token = { key: accessToken, secret: accessTokenSecret };
    return oauth.toHeader(oauth.authorize(request_data, token));
}

// 上传图片
async function uploadImage(imagePath) {
    const url = 'https://upload.twitter.com/1.1/media/upload.json';
    const imageData = await fs.readFile(imagePath);

    const form = new FormData();
    form.append('media', new Blob([imageData]), {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
    });

    const response = await got.post(url, {
        body: form,
        headers: {
            ...getAuthHeader(url, 'POST'),
        },
    }).json();

    return response.media_id_string;
}

// 创建带图片的推文
async function createTweet(tweetText, imagePath) {
    // console.log(tweetText);
    // return;
    const mediaId = await uploadImage(imagePath);
    const url = 'https://api.twitter.com/2/tweets';

    const data = {
        text: tweetText,
        media: {
            media_ids: [mediaId]
        }
    };

    try {
        const response = await got.post(url, {
            json: data,
            headers: {
                ...getAuthHeader(url, 'POST'),
                'Content-Type': 'application/json',
            },
        }).json();

        console.log('Tweet with image created:', response);
        return response;
    } catch (error) {
        if (error.response) {
            console.error('Error response:', error.response.body);
            console.error('Error status:', error.response.statusCode);
        } else {
            console.error('Error message:', error.message);
        }
        throw error;
    }
}


main();