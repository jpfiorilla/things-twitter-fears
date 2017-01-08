const Twit = require('twit');
const T = require('./T');
const rita = require('rita');
const rs = rita.RiTa;
const RiLexicon = rita.RiLexicon;
const lexicon = new RiLexicon();
const fs = require('fs');
const salient = require('salient');
const tokenizer = new salient.tokenizers.TweetTokenizer({preserveEmoticons: true});
const wordTokenizer = new salient.tokenizers.WordPunctTokenizer({preserveEmoticons: true});
const emoji = require('node-emoji');

require.extensions['.txt'] = function (module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
};

Array.prototype.pick = function() {
    return this[Math.floor(Math.random()*this.length)];
};
Array.prototype.afterScared = function(query){
    // console.log('afterscared: ', query.split(' ')[2].substring(0, 2))
    for (var i = 0; i < this.length; i++){
        if (this[i] === query.split(' ')[1] && this[i+1] === query.split(' ')[2].substring(0, 2)){
            if (i > 1 && this[i-2].toLowerCase() === 'thing'){
                console.log('prefaced by "thing"\n')
                process.exit();
            }
            return this.slice(i+2);
        }
    }
    // return this;
}
Array.prototype.myToYour = function(){
    let index = Math.max(this.indexOf('my'), this.indexOf('MY'), this.indexOf('My'));
    if (index !== -1){
        console.log('changed my to your \n');
        this[index] = 'your';
    }
    index = Math.max(this.indexOf('me'), this.indexOf('ME'), this.indexOf('Me'));
    if (index !== -1){
        console.log('changed me to you \n');
        this[index] = 'you';
    }
    index = Math.max(this.indexOf('i'), this.indexOf('I'));
    if (index !== -1){
        console.log('changed i to you \n');
        this[index] = 'you';
    }
    index = Math.max(this.indexOf('myself'), this.indexOf('MYSELF'), this.indexOf('Myself'));
    if (index !== -1){
        console.log('changed myself to yourself \n');
        this[index] = 'yourself';
    }
    return this;
}
Array.prototype.removeLinks = function(){
    let arr = this;
    for (var i = arr.length-1; i > -1; i--){
        if (arr[i].substring(0, 4) === 'http'){
            console.log('removed link \n');
            arr = arr.slice(0, i);
        }
    }
    return arr;
}
Array.prototype.endAtPeriod = function(){
    // let hasNonalphanumeric = /[^a-zA-Z0-9]/;
    for (var i = 0; i < this.length; i++){
        if (rs.isPunctuation(this[i]) && this[i] !== ':' && this[i] !== ','){
            console.log('ended at period \n');
            this[i] = this[i].substring(0, this[i].length-1);
            return this.slice(0, i);
        }
    }
    return this;
}
Array.prototype.findEnd = function(){
    let bcAltSpellings = ['bc', 'cuz', 'becuz'];
    let adverbsOfTime = ['now', 'then', 'today', 'tomorrow', 'tonight', 'yesterday', 'again'];
    let arr = this;
    for (i = arr.length-1; i > 0; i--){
        let reasonToEnd = (rs.getPosTags(arr[i])[0] === 'in' && rs.getPosTags(arr[i-1])[0] !== 'vbg') ||
                          (rs.getPosTags(arr[i])[0] === 'cc' && arr[i] !== 'and' && arr[i] !== 'with') ||
                          (bcAltSpellings.includes(arr[i])) ||
                          (adverbsOfTime.includes(arr[i])) ||
                          (arr[i][0] === '#') ||
                          (rs.isSentenceEnd(arr[i], arr[i+1]));
                        //   (!lexicon.keys.includes(arr[i]) || !lexicon.keys.includes(rs.singularize(arr[i]))) || // words that have triggered this: 'things', 'contouring'
                        //   (rs.getPosTags(arr[i])[0] === 'nns' && rs.getPosTags(arr[i+1])[0] === 'nn');
        if (reasonToEnd){
            console.log('chopping at index ' + i + '\n');
            arr = arr.slice(0, i);
        }
    }
    return arr;
}
Array.prototype.joinPunctuation = function(){
    let str = '';
    for (i = 0; i < this.length; i++){
        if (rs.isPunctuation(this[i])) str += this[i];
        else str += ' ' + this[i];
    }
    return str;
}
Array.prototype.pluralize = function(){
    if (this.length === 1 && rs.getPosTags(this[0])[0] === 'nn' && rs.pluralize(this[0]).length) this[0] = rs.pluralize(this[0]);
    return this;
}

const yesterday = function(){
    let yest = new Date(Date.now() - 864e5);
    let dd = yest.getDate();
    let mm = yest.getMonth()+1;
    let yyyy = yest.getFullYear();
    if(dd<10) dd='0'+dd;
    if(mm<10) mm='0'+mm;
    return yyyy+'-'+mm+'-'+dd;
}

const tweet = function(status){
    T.post('statuses/update', { status }, function(err, data, response) {
        console.log(data)
    })
}

const past = require('./past.txt');
const fears = past.split('\n');

const writeFear = function(){
    fs.writeFile('./past.txt', fears.join('\n'), function(err) {
        if(err) return console.log(err);
        console.log(fears[fears.length-1] + ' was added to list of fears');
    });
}

const getStatus = function(){
    const since = yesterday();
    let query = ['"im afraid of"', '"im scared of"', '"be scared of"', '"be afraid of"'].pick();
    // query = ['be afraid of'].pick();
    T.get('search/tweets', { q: query + ' since:' + since, count: 100 }, function(err, data, response) {
        let status = data.statuses.pick().text.toLowerCase();
        // status = "be afraid of monsters";
        console.log('orig status: ' + status + '\n' + 'searchcount: ' + data.statuses.length + '\n');
        let thingToFear = tokenizer.tokenize(status).afterScared(query).removeLinks().endAtPeriod().findEnd().myToYour();
        // if (thingToFear.length === 1 && emoji.get(thingToFear[0])) thingToFear.push(emoji.get(thingToFear[0]));
        thingToFear.pluralize();
        let reasonToExit = '';
        if (rs.getPosTags(thingToFear[0])[0] === 'prp') reasonToExit = 'fear was preposition';
        if (thingToFear.length === 0 && rs.getPosTags(thingToFear[0])[0] === 'dt') reasonToExit = 'fear was determinant';
        if (thingToFear.length === 0 && rs.isPunctuation(thingToFear[0])) reasonToExit = 'fear was punctuation';
        if (fears.includes(thingToFear.joinPunctuation(' '))) reasonToExit = 'fear already tweeted';
        if (reasonToExit) {
            console.log(reasonToExit + '\n');
            process.exit();
        }
        thingToFear = thingToFear.joinPunctuation(' ');
        fears.push(thingToFear);
        writeFear();
        console.log(rs.getPosTagsInline(status) + '\n', thingToFear);
        // tweet(thingToFear);
        return thingToFear;
    })
}
let final = '';
getStatus();
// console.log(lexicon.keys.includes(rs.singularize('things')))

// to do list
// acknowledge 'n' as 'and'
// stop at 'but' () or 'because' (in)
// if the status ends with 'im scared of' program errors out, see if this is a problem. would have to refactor a lot to get it to return the normal status