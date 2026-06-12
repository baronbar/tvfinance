
function updateClock(){
 document.getElementById('datetime').innerText=new Date().toLocaleString();
 document.getElementById('clocks').innerHTML=
 'Dubai: '+new Date().toLocaleTimeString('en-US',{timeZone:'Asia/Dubai'})+'<br>'+
 'Istanbul: '+new Date().toLocaleTimeString('en-US',{timeZone:'Europe/Istanbul'})+'<br>'+
 'Sofia: '+new Date().toLocaleTimeString('en-US',{timeZone:'Europe/Sofia'})+'<br>'+
 'London: '+new Date().toLocaleTimeString('en-US',{timeZone:'Europe/London'})+'<br>'+
 'New York: '+new Date().toLocaleTimeString('en-US',{timeZone:'America/New_York'});
}
setInterval(updateClock,1000);updateClock();

fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd')
.then(r=>r.json()).then(d=>{
document.getElementById('crypto').innerHTML=
'BTC $'+d.bitcoin.usd+'<br>ETH $'+d.ethereum.usd;
}).catch(()=>{});

document.getElementById('news').innerText='Use TradingView / RSS widget source here';
