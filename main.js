const scale = 5
const neighbourCoords = [[1,0],[-1,0],[0,1],[0,-1]];
const neighbourCoordsAndSelf = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];

function main(){
    canvas = document.getElementById('canvas');
    let width = 0;
    let height = 0;

    width = Math.floor(document.documentElement.clientWidth/scale)
    height = Math.floor(document.documentElement.clientHeight/scale)
    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width*scale}px`
    canvas.style.height = `${height*scale}px`

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0F0F0F'
    ctx.fillRect(0, 0, width, height)

    let mainImageData = ctx.getImageData(0, 0, width, height)
    function paintPixel(imageData, x, y, r, g, b){
        const redIndex = (y * imageData.width + x) * 4;
        imageData.data[redIndex+0] = r
        imageData.data[redIndex+1] = g
        imageData.data[redIndex+2] = b
        imageData.data[redIndex+3] = 255
    }

    let floaters = []
    const map = {}
    let particles = []

    for(let x = 0; x < width; x++){
        for(let y = 0; y < height; y++){
            if(Math.random() < 0.4){
                particles.push({x, y, children: []})
            }
        }
    }

    function trySpawn(x, y){
        for(let dx = -2; dx < 2; dx++){
            for(let dy = -2; dy < 2; dy++){
                if(map[`${x+dx},${y+dy}`]){
                    return false;
                }
            }   
        }
        particles.push({x, y, children: []});
        return true
    }

    function addParticles(count){
        let successes = 0;
        let failures = 0;
        while(successes < count && failures < count){
            const x = Math.floor(Math.random()*width);
            const y = Math.floor(Math.random()*height);
            if(trySpawn(x, y)){
                successes += 1;
            } else {
                failures += 1;
            }
        }
    }
    window.addParticles = addParticles;

    function lerp(a, b, t){
        return a*(1-t) + b*t
    }

    function attachParticle(particle, parent){
        map[`${particle.x},${particle.y}`] = particle
        particle.attached = true
        if(parent){
            if(parent.kernel){
                particle.color = {
                    r: parent.color.r == 255 ? 200 : 70,
                    g: parent.color.g == 255 ? 200 : 70,
                    b: parent.color.b == 255 ? 200 : 70
                };
            } else {
                particle.color = {
                    r: lerp(parent.color.r, 100, (Math.random()-0.1)/50),
                    g: lerp(parent.color.g, 100, (Math.random()-0.1)/50),
                    b: lerp(parent.color.b, 100, (Math.random()-0.1)/50),
                };
            }
            particle.age = parent.age + 1;
            particle.parent = parent;
            parent.children.push(particle)
        }
        paintPixel(mainImageData, particle.x, particle.y, particle.color.r, particle.color.g, particle.color.b);
    }

    for(let i = 0; i < 3; i++){
        attachParticle({
            kernel: true,
            age: 0,
            x: Math.round(Math.random() * width),
            y: Math.round(Math.random() * height),
            color: {
                r: i == 0 ? 255 : 240,
                g: i == 1 ? 255 : 240,
                b: i == 2 ? 255 : 240,
            },
            children: []
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
        neighbourCoords.forEach(([dx, dy]) => {
            if(particle.attached){
                //already found one
                return;
            }
            const parent = map[`${particle.x+dx},${particle.y+dy}`]
            if(parent){
                attachParticle(particle, parent);
            }
        })
    }

    let nextIndex = 0
    function step(){
        for(let i = 0; i < particles.length/4; i++){
            if(nextIndex >= particles.length){
                let respawnNum = 0;
                particles = particles.filter(particle => {
                    if(particle.attached && !particle.parent){
                        respawnNum++;
                    }
                    return !particle.attached;
                });
                addParticles(respawnNum);
                nextIndex = 0;
                if(particles.length == 0){
                    return;
                }
            }
            const particle = particles[nextIndex]
            moveParticle(particle)
            checkForCrystal(particle)
            nextIndex += 1;
        }
    }

    function frame(){
        step()
        ctx.putImageData(mainImageData, 0, 0)
        floaters.forEach(floater => {
            floater.opacity *= 0.999

            if(floater.opacity < 0.3){
                floater.element.parentElement.removeChild(floater.element);
            } else {
                floater.rotation += floater.rotationSpeed;
                floater.x += floater.moveX;
                floater.y += floater.moveY;
                
                let anyBounce = false;
                if(floater.x < 0 || floater.x + floater.width > width*scale){
                    floater.moveX *= -1;
                    anyBounce = true;
                }
                if(floater.y < 0 || floater.y + floater.height > height*scale){
                    floater.moveY *= -1;
                    anyBounce = true;
                }
                if(anyBounce){
                    floater.rotationSpeed *= -1;
                }

                floater.element.style.transform = `rotate(${floater.rotation}deg)`;
                floater.element.style.left = `${floater.x}px`;
                floater.element.style.top = `${floater.y}px`;
                floater.element.style.opacity = floater.opacity;
            }
        })
        floaters = floaters.filter(floater => floater.opacity >= 0.3)
        window.requestAnimationFrame(frame)
    }
    window.requestAnimationFrame(frame)

    function getFragments(startingPoint){
        const fragments = [];
        const starts = [startingPoint];
        while(starts.length > 0){
            const start = starts.pop()
            const startAge = start.age;
            const toCheck = [start];
            const particles = [start];
            const fragment = {particles};
            start.fragment = fragment;
            while(toCheck.length > 0){
                const next = toCheck.pop();
                next.children.forEach((other) => {
                    if(other.age - startAge < 20){
                        toCheck.push(other);
                        fragment.particles.push(other);
                        other.fragment = fragment;
                    } else {
                        starts.push(other);
                    }
                })
            }
            fragments.push(fragment);
            if(fragment.particles.length < 30){
                if(start.parent && start.parent.fragment){
                    fragment.particles.forEach(particle => {
                        start.parent.fragment.particles.push(particle);
                        particle.fragment = start.parent.fragment;
                    })
                    fragments.pop();
                } else {
                    fragment.unusable = true;
                }
            }
        }
        return fragments;
    }

    window.addEventListener('click', event => {
        const clickX = Math.floor(event.clientX/scale);
        const clickY = Math.floor(event.clientY/scale);
        let target
        neighbourCoordsAndSelf.forEach(([dx, dy]) => {
            const x = clickX + dx;
            const y = clickY + dy;
            const candidate = map[`${x},${y}`];
            if(candidate && !candidate.kernel && (!target || candidate.age < target.age)){
                target = candidate
            }
        })
        if(target){
            target.parent.children = target.parent.children.filter(child => child != target);

            const fragments = getFragments(target)
            fragments.forEach( fragment => {
                let minX = width;
                let maxX = 0;
                let minY = height;
                let maxY = 0;
                fragment.particles.forEach(particle => {
                    paintPixel(mainImageData, particle.x, particle.y, 15, 15, 15);

                    map[`${particle.x},${particle.y}`] = null;

                    minX = Math.min(minX, particle.x);
                    maxX = Math.max(maxX, particle.x);
                    minY = Math.min(minY, particle.y);
                    maxY = Math.max(maxY, particle.y);
                });
                if(!fragment.unusable){
                    const imageData = ctx.createImageData(maxX-minX+1, maxY-minY+1);
                    fragment.particles.forEach(particle => {
                        paintPixel(imageData, particle.x-minX, particle.y-minY, particle.color.r, particle.color.g, particle.color.b);
                    });

                    const floater = document.createElement('canvas');
                    floater.width = imageData.width;
                    floater.height = imageData.height;
                    floater.style.width = `${imageData.width*scale}px`;
                    floater.style.height = `${imageData.height*scale}px`;
                    floater.style.position = 'absolute';
                    floater.style.left = `${minX*scale}px`
                    floater.style.top = `${minY*scale}px`

                    const floaterCtx = floater.getContext('2d')
                    floaterCtx.putImageData(imageData, 0, 0);

                    document.body.appendChild(floater)

                    floaters.push({
                        element: floater,
                        opacity: 1,
                        x: minX*scale,
                        y: minY*scale,
                        width: imageData.width*scale,
                        height: imageData.height*scale,
                        rotation: 0,
                        rotationSpeed: Math.random() * 2 - 1,
                        moveX: scale * (Math.random()*2-1) / 5,
                        moveY: scale * (Math.random()*2-1) / 5
                    });
                }
            });
        }
    })

}

function start(){
    if(document.readyState == 'complete'){
        main()
    }
}

document.addEventListener('readystatechange', start)
start()