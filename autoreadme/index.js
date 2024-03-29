const fs = require("fs");
const path = require("path");


function getFilesInDir(dirpath){
    // 读取文件夹中的文件列表
    let files = fs.readdirSync(dirpath, { withFileTypes: true });
        
    // 过滤出文件
    const filteredFiles = files.filter(file => file.isFile());
        
    return filteredFiles;
}

function getRandomFileInDir(dirpath){
    // 读取文件夹中的文件列表
    let files = fs.readdirSync(dirpath, { withFileTypes: true });
    
    // 过滤出文件
    const filteredFiles = files.filter(file => file.isFile());
        
    // 获取文件的修改时间
    const fileTimes = filteredFiles.map(file => {
        const { mtime } = fs.statSync(path.resolve(dirpath,file.name));
        return { name: file.name, time: new Date(mtime) };
    });

    // 按照修改时间对文件进行排序
    fileTimes.sort((a, b) => b.time - a.time);
    
    // 打印已排序的文件列表
    return fileTimes[Math.floor(Math.random()*fileTimes.length)];
}

async function main(){
    const readRes = fs.readdirSync(__dirname+"/../screenshot/")

    // update Number of sites
    let readmeData = fs.readFileSync(__dirname+"/../README.md",{encoding:"utf-8"});
    
    let regexp = /-[0-9]+-/g;
    readmeData = readmeData.replace(/-[0-9]+-/g,"-"+readRes.length+"-");

    let allScreenShots = getFilesInDir(__dirname+"/../screenshot/");
    
    // update Daily Show
    let randomshot = allScreenShots[Math.floor(Math.random()*allScreenShots.length)];

    let randomshotUrlExp = new RegExp("(?<="+randomshot.name+"\\)\\]\\()(.+?)(?=\\))","g")
    let randomshotRepoUrl = readmeData.match(randomshotUrlExp)[0];

    regexp = /## Daily Show([\s\S]*?)## Index/g
    readmeData = readmeData.replace(regexp,
`## Daily Show

[![](./screenshot/${randomshot.name})](${randomshotRepoUrl})

## Index`);

    fs.writeFileSync(__dirname+"/../README.md",readmeData,"utf-8"); 
}
main();