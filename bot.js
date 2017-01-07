const Twit = require('twit');
const T = require('./T');
const rita = require('rita');
const rs = rita.RiTa;
const fs = require('fs');

Array.prototype.pick = function() {
    return this[Math.floor(Math.random()*this.length)];
};
Array.prototype.afterScared = function(query){
    for (var i = 0; i < this.length; i++){
        if (this[i] === query.split(' ')[1]) return this.slice(i+2);
    }
}
Array.prototype.myToYour = function(){
    let index = this.indexOf('my');
    if (index !== -1) this[index] = 'your';
    console.log('changed my to your \n')
    return this;
}
Array.prototype.removeLink = function(){
    if (this[this.length-1].substring(0, 4).toLowerCase() === 'http'){
        console.log('removed link \n');
        this.pop();
    }
    return this;
}
Array.prototype.endAtPeriod = function(){
    for (var i = 0; i < this.length; i--){
        if (this[i] === '.'){ //  || this[i][this[i].length-1] === '.'
            console.log('ended at period \n');
            return this.slice(0, i);
        }
    }
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

const getStatus = function(){
    const since = yesterday();
    const query = ['"im afraid of"', '"im scared of"'].pick();
    T.get('search/tweets', { q: query + ' since:' + since, count: 100 }, function(err, data, response) {
        let status = data.statuses.pick().text.toLowerCase();
        console.log('orig status: ' + status + '\n')
        let after = status.split(' ').afterScared(query).removeLink();
        console.log(rs.getPosTagsInline(status) + '\n', after);
    })
}
getStatus();

// T.post('statuses/retweet/:id', { id: '343360866131001345' }, function (err, data, response) {
//   console.log(data)
// })