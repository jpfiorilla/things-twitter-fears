const Twit = require('twit');
const T = require('./T');
const rita = require('rita');
const rs = rita.RiTa;
const fs = require('fs');
const salient = require('salient');
const tokenizer = new salient.tokenizers.TweetTokenizer();

Array.prototype.pick = function() {
    return this[Math.floor(Math.random()*this.length)];
};
Array.prototype.afterScared = function(query){
    // console.log('afterscared: ', query.split(' ')[2].substring(0, 2))
    for (var i = 0; i < this.length; i++){
        if (this[i] === query.split(' ')[1] && this[i+1] === query.split(' ')[2].substring(0, 2)) return this.slice(i+2);
    }
    // return this;
}
Array.prototype.myToYour = function(){
    let index = Math.max(this.indexOf('my'), this.indexOf('MY'), this.indexOf('My'));
    if (index !== -1){
        console.log('changed my to your \n');
        this[index] = 'your';
    }
    return this;
}
Array.prototype.removeLinks = function(){
    for (var i = 0; i < this.length; i++){
        if (this[i].substring(0, 4) === 'http'){
            console.log('removed link \n');
            this.splice(i, 1);
        }
    }
    return this;
}
Array.prototype.endAtPeriod = function(){
    let hasNonalphanumeric = /[^a-zA-Z0-9]/;
    for (var i = 0; i < this.length; i++){
        // if (this[i] === '.' || this[i][this[i].length-1] === '.'){
        if (this.length[i] === 1 && hasNonalphanumeric.test('this[i]') && this[i] !== ':'){
            console.log('ended at period \n');
            this[i] = this[i].substring(0, this[i].length-1);
            return this.slice(0, i);
        }
    }
    console.log('no if')
    return this;
}
Array.prototype.findEnd = function(){
    // end at 'because' alt spellings
    let arr = this;
    for (i = arr.length; i > 0; i--){
        let reasonToEnd = rs.getPosTags(arr[i])[0] === 'in' || (rs.getPosTags(arr[i])[0] === 'cc' && arr[i] !== 'and');
        if (reasonToEnd){
            console.log('chopping at index ' + i + ' \n');
            arr = arr.slice(0, i);
        }
    }
    return arr;
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

const getStatus = function(){
    const since = yesterday();
    const query = ['"im afraid of"', '"im scared of"'].pick();
    T.get('search/tweets', { q: query + ' since:' + since, count: 100 }, function(err, data, response) {
        // let status = data.statuses.pick().text.toLowerCase();
        let status = 'im afraid of three things: women, snakes, and the police. they all have the ability to hurt me and make it look like my fault.';
        console.log('orig status: ' + status + '\n')
        let thingToFear = tokenizer.tokenize(status).afterScared(query).removeLinks().endAtPeriod().findEnd().myToYour();
        console.log(rs.getPosTagsInline(status) + '\n', thingToFear);
    })
}
getStatus();
console.log(rs.getPosTagsInline('because cuz'))

// to do list
// acknowledge 'n' as 'and'
// stop at 'but' () or 'because' (in)
// if the status ends with 'im scared of' program errors out, see if this is a problem. would have to refactor a lot to get it to return the normal status

// T.post('statuses/retweet/:id', { id: '343360866131001345' }, function (err, data, response) {
//   console.log(data)
// })