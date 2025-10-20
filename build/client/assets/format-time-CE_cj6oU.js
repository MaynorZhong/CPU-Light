const l=t=>{const f=Math.floor(t/86400),r=Math.floor(t%(3600*24)/3600),a=Math.floor(t%3600/60);let o="";return f>0&&(o+=`${f}天`),r>0&&(o+=`${r}小时`),a>0&&(o+=`${a}分钟`),o||"0天0小时0分钟"};export{l as f};
