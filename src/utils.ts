
export const random = (len :number)=>{

    let options = "qwertyuiop123456789RashmitTopGLol"
    let length = options.length;
    let ans = "";

    for(let i = 0;i<len;i++){
        ans += options[Math.floor((Math.random() * length))]
    }

    return ans;

}

