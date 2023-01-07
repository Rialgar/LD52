function main(){
    canvas = document.getElementById('canvas');
    let width = 0;
    let height = 0;

    width = Math.floor(document.documentElement.clientWidth/5)
    height = Math.floor(document.documentElement.clientHeight/5)
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width*5}px` 
    canvas.style.height = `${height*5}px`

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0F0F0F'
    ctx.fillRect(0, 0, width, height)

    const imageData = ctx.getImageData(0, 0, width, height)
    function paintPixel(x, y, r, g, b){
        const redIndex = (y * width + x) * 4;
        imageData.data[redIndex+0] = r
        imageData.data[redIndex+1] = g
        imageData.data[redIndex+2] = b
    }

    const map = {}
    let particles = []

    for(let x = 0; x < width; x++){
        for(let y = 0; y < height; y++){
            if(Math.random() < 0.4){
                particles.push({x, y})
            }
        }
    }

    function attachParticle(particle, parent){
        map[`${particle.x},${particle.y}`] = particle
        particle.attached = true
        if(parent){
            particle.color = {
                r: Math.min(255, Math.max(0, Math.round(Math.random()*6)-3 + parent.color.r)),
                g: Math.min(255, Math.max(0, Math.round(Math.random()*6)-3 + parent.color.g)),
                b: Math.min(255, Math.max(0, Math.round(Math.random()*6)-3 + parent.color.b))
            },
            particle.age = parent.age + 1
        }
        paintPixel(particle.x, particle.y, particle.color.r, particle.color.g, particle.color.b);
        //paintPixel(particle.x, particle.y, particle.age, particle.age, particle.age);
    }

    for(let i = 0; i < 3; i++){
        attachParticle({
            kernel: true,
            age: 0,
            x: Math.round(Math.random() * width),
            y: Math.round(Math.random() * height),
            color: {
                r: i == 0 ? 200 : 70,
                g: i == 1 ? 200 : 70,
                b: i == 2 ? 200 : 70,
            }
        })
    }

    function moveParticle(particle){
        const x = particle.x + Math.floor(Math.random()*3)-1;
        const y = particle.y + Math.floor(Math.random()*3)-1;
        if(x >= 0 && x < width && y >= 0 && y < height && !map[`${x},${y}`]){
            particle.x = x;
            particle.y = y;
        }
    }

    function checkForCrystal(particle){
        if(map[`${particle.x},${particle.y}`]){
            //we managed to land ON another attached particle, just destroy
            particle.attached = true;
            return;
        }
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
            const parent = map[`${particle.x+dx},${particle.y+dy}`]
            if(parent){
                attachParticle(particle, parent);
            }
        })
    }

    function step(){
        particles.forEach(particle => {
            moveParticle(particle)
            checkForCrystal(particle)
        })
        particles = particles.filter(particle => !particle.attached)
    }

    function frame(){
        for(let i = 0; i < 2; i ++){
            step();
        }
        ctx.putImageData(imageData, 0, 0)
        window.requestAnimationFrame(frame)
    }
    window.requestAnimationFrame(frame)

    window.check = function(){
        console.log(particles.length)
    }
}

function start(){
    if(document.readyState == 'complete'){
        main()
    }
}

document.addEventListener('readystatechange', start)
start()