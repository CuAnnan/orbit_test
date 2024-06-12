const TAU = Math.PI * 2;

function randomSeededIntInRange(min, max)
{
    return Math.floor(Game.prng() * (max - min + 1)) + min;
}

function validateHSL(name, value, rangeLimit)
{
    if(value > rangeLimit || value < 0)
    {
        throw new Error(`${name} must be between 0 and ${rangeLimit}. Value of ${value} provided`)
    }
}

function HSLtoRGB(h, s, l)
{
    validateHSL('Hue', h, 360);
    validateHSL('Saturation', s, 100);
    validateHSL('Lightness', l, 100);
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.floor(255 * f(0)), Math.floor(255 * f(8)), Math.floor(255 * f(4))];
}

function randomCelestialBodyColor(lowerSBound= 50, lowerLBound = 25)
{
    let hsl = {
        h:randomSeededIntInRange(0, 360),
        s:randomSeededIntInRange(lowerSBound,100),
        l:randomSeededIntInRange(lowerLBound,100)
    }
    let rgb = HSLtoRGB(hsl.h, hsl.s, hsl.l);
    return {hsl, rgb};
}


class Planet
{
    name;
    fillColor;
    strokeColor;
    orbitalRadius;
    satellites;
    planetaryRadius;
    drawRadius;
    boundingBox;

    yearLength;
    initialAngularPosition;
    angularPosition;
    position;
    dayOfYear;
    // measured in ms

    constructor(name)
    {
        this.name = name;
        this.fillColor = randomCelestialBodyColor();
        this.strokeColor = randomCelestialBodyColor();
        this.satellites = randomSeededIntInRange(0,10);
        this.dayOfYear = 0;
    }

    /**
     * @param {Object} params
     * @param {Number} params.orbitalRadius
     * @param {Number} params.planetaryRadius
     * @param {Number} params.yearLength
     * @param {Number} params.angularPosition
     * @returns {Planet}
     */
    initialise(params)
    {
        this.orbitalRadius = params.orbitalRadius;
        this.planetaryRadius = params.planetaryRadius;
        console.log(this.planetaryRadius);
        this.yearLength = Math.floor(570 * params.yearLength);
        this.initialAngularPosition = params.angularPosition;
        this.angularPosition = params.angularPosition;
        return this;
    }

    setPosition(position)
    {
        this.position = position;
        this.boundingBox = this.drawRadius?{
            topLeft:
                {
                    x:this.position.x - this.drawRadius,
                    y:this.position.y - this.drawRadius
                },
            bottomRight:
                {
                    x:this.position.x + this.drawRadius,
                    y:this.position.y + this.drawRadius
                }
        }:null;
        return this;
    }

    setDrawRadius(drawRadius)
    {
        this.drawRadius = drawRadius;
        return this;
    }

    getDrawRadius()
    {
        return this.drawRadius;
    }

    mouseIsOver(mousePointer)
    {
        if(!this.boundingBox)
        {
            return false;
        }
         return (
             mousePointer.x > this.boundingBox.topLeft.x && mousePointer.x < this.boundingBox.bottomRight.x
             &&
             mousePointer.y > this.boundingBox.topLeft.y && mousePointer.y < this.boundingBox.bottomRight.y
         );
    }

    addTime(time)
    {
        this.dayOfYear += time/100;
        if(this.dayOfYear > this.yearLength)
        {
            this.dayOfYear -= this.yearLength;
        }
        const angularOffset = TAU * (this.dayOfYear / this.yearLength);
        this.angularPosition = this.initialAngularPosition + angularOffset;
    }
}

class StarSystem
{
    planets;
    fillColor;
    strokeColor;
    solarMass;

    constructor()
    {
        // star system name format is three Upper Case letters followed by three numbers
        // planet name format is system name followed by a dash followed by the 1-indexed position from the inner ring out
        // moon name is planet name followed by a dash followed by a letter in the 1 indexed position (a, b, c and so on).
        this.name = '';
        for(let i = 0; i < 3; i++)
        {
            this.name += String.fromCharCode(randomSeededIntInRange(65,90));
        }
        for(let i = 0; i < 3; i++)
        {
            this.name += randomSeededIntInRange(0, 9);
        }
        this.fillColor = randomCelestialBodyColor(75,75);
        this.strokeColor = randomCelestialBodyColor();
        this.planets = [];
        this.solarMass = randomSeededIntInRange(50, 150)/100;
    }

    addPlanet()
    {
        this.planets.push(new Planet(this.name + ' - ' + (this.planets.length + 1)));
    }

    establishPlanetBounds()
    {
        let orbitalRadius = 0.15;
        const aveOrbitalDelta = 0.8 / this.planets.length ;

        const avePlanetIndex =Math.floor(this.planets.length / 3)-1;

        const planetSizeMultiplierRatio = 1 / this.planets.length / 2;
        let yearLength = 0.25;

        for(let i = 0; i < this.planets.length; i++)
        {
            const variance = randomSeededIntInRange(0,40) - 20;
            const offset = aveOrbitalDelta + (aveOrbitalDelta * variance / 100);
            const planetSizeMultiplierAmount = 0.5 + (i + 1) * planetSizeMultiplierRatio;

            this.planets[i].initialise({
                orbitalRadius,
                planetaryRadius:offset * planetSizeMultiplierAmount,
                yearLength,
                angularPosition:Game.prng() * Math.PI * 2
            });
            yearLength *= Math.pow(2, 1.005);

            orbitalRadius += offset;

            if(orbitalRadius > 1)
            {
                orbitalRadius = 1;
            }
        }
    }

    get size()
    {
        return this.planets.length;
    }

}

class Galaxy
{
    starSystems;
    startingSystem;
    focusedSystem;
    name;

    /**
     * @param {Object} params - The Object containing the initialisation parameters
     * @param {string} params.name - The name of the galaxy
     * @param {Number} params.stars - The number of stars in the galaxy
     * @param {Number} params.planetStarRatio - The ratio of stars to planets;
     */
    constructor(params)
    {
        this.starSystems = [];
        this.name = params.name;
        const numberOfPlanets = params.stars * params.planetStarRatio;
        for(let i = 0; i < params.stars; i++)
        {
            this.starSystems.push(new StarSystem());
        }

        let mostPopulousSystem = this.starSystems[0];

        for(let i = 0; i < numberOfPlanets; i++)
        {
            let systemIndex = randomSeededIntInRange(0, params.stars - 1);
            let system = this.starSystems[systemIndex];
            system.addPlanet();
            if(system.size > mostPopulousSystem.size)
            {
                mostPopulousSystem = system;
            }
        }

        for(let i = 0; i < params.stars; i++)
        {
            this.starSystems[i].establishPlanetBounds();
        }


        this.startingSystem = mostPopulousSystem;
        this.focusedSystem = this.startingSystem;
    }
}

class Universe
{
    galaxies;
    startingGalaxy;
    /**
     * @param {Object} params - The Object containing the initialisation parameters
     * @param {Array}  params.galaxies - the array containing the galaxies
     */
    constructor(params)
    {
        this.galaxies = [];
        for(let galaxyParams of params.galaxies)
        {
            this.galaxies.push(new Galaxy(galaxyParams));
            this.startingGalaxy = this.galaxies[randomSeededIntInRange(0, this.galaxies.length - 1)];
            this.startingSystem = this.startingGalaxy.startingSystem;
        }
    }
}


class Game {
    ctx;
    animate = false;
    static prng;
    lastPNow = performance.now();
    numTicks = 1;
    static MOUSE_OUT_OF_BOUNDS = {
        x:-1000,
        y:-1000
    };
    $currentPlanetContainer;

    mouse = Game.MOUSE_OUT_OF_BOUNDS;
    underMouse = null;

    /**
     * @param {Object} params - The Object containing the initialisation parameters
     * @param {HTMLElement} params.canvas - The HTML element reference to the canvas to render to
     * @param {string} params.prngKey - The seed to generate consistent PRNG keys
     * @param {Object} params.universe - The Object containing the initialisation parameters of the universe;
     */
    constructor(params) {
        Game.prng = new Math.seedrandom(params.prngKey)
        this.ctx = params.canvas.getContext('2d');
        this.universe = new Universe(params.universe);
        this.$currentPlanetContainer = params.currentPlanetContainer;
    }

    animateFrame()
    {
        requestAnimationFrame((ms) => {
            const now = performance.now();
            this.updatePositions(now - this.lastPNow);
            this.lastPNow = now;
            if(this.animate)
            {
                this.animateFrame();
            }
        });
    }

    start() {
        this.animate = true;
        this.animateFrame();
    }

    /**
     * @param {DOMHighResTimeStamp} ms
     */
    updatePositions(ms) {
        this.render(ms);
    }

    click()
    {
        if(this.underMouse)
        {
            this.currentPlanet = this.underMouse;
            this.$currentPlanetContainer.style.visibility = "visible";
            document.getElementById('currentPlanetName').innerText = this.underMouse.name;
        }
        else
        {
            this.currentPlanet = null;
            this.$currentPlanetContainer.style.visibility = "hidden";
        }

    }

    render(ms)
    {
        let solarSystem = this.universe.startingSystem;
        const {width, height} = this.ctx.canvas;
        const centre = {x: width/2, y:height/2};

        this.underMouse = null;

        this.ctx.clearRect(0, 0, width, height);


        this.ctx.fillStyle =  `rgb(${solarSystem.strokeColor.rgb.join(', ')})`;
        this.ctx.strokeStyle = `rgb(${solarSystem.fillColor.rgb.join(', ')})`;
        this.ctx.beginPath();
        this.ctx.arc(centre.x, centre.y, width/20, 0,TAU);
        this.ctx.fill();
        this.ctx.stroke();

        if(this.currentPlanet)
        {
            document.getElementById('currentPlanetDayOfYear').innerText = `Day ${Math.floor(this.currentPlanet.dayOfYear)} of ${this.currentPlanet.yearLength}`;
        }


        for(const [i,planet] of Object.entries(solarSystem.planets))
        {
            planet.addTime(ms);
            const oRadius = width / 2 * planet.orbitalRadius;

            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgb(200, 200, 200)';
            this.ctx.arc(centre.x, centre.y, oRadius, 0, TAU)
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgb(${planet.strokeColor.rgb.join(', ')})`;
            this.ctx.fillStyle = `rgb(${planet.fillColor.rgb.join(', ')})`;

            planet.setPosition({
                x:(centre.x + (oRadius * Math.cos(planet.angularPosition))),
                y:(centre.y + (oRadius * Math.sin(planet.angularPosition)))
            });

            let planetRadius = planet.getDrawRadius();
            if(!planetRadius)
            {
                planetRadius = width / 10 * planet.planetaryRadius;
                planet.setDrawRadius(planetRadius);
            }

            // these could be made properties of the planet object to make it more efficient to do tthis

            if(planet.mouseIsOver(this.mouse))
            {
                this.underMouse = planet;
            }

            this.ctx.arc(
                planet.position.x,
                planet.position.y,
                planetRadius,
                0,
                TAU
            );

            //if(this.mouse.x > planetBoundingBox.topLeft.x && this.mouse.x < planetBoundingBox.bottomRight.x && this.mouse.x < planetBounding)


            this.ctx.fill();
            this.ctx.stroke();
        }

    }

    /**
     *
     * @typedef {Object} params
     * @property {HTMLElement} canvas - The HTML Canvas Object
     * @property {string} [prngKey]
     * @property {Object} [universe]
     */
    static init(params)
    {
        if (params.canvas.tagName !== 'CANVAS')
        {
            throw new Error('Invalid element provided to init method');
        }

        const defaultParams = {
            prngKey:'hello universe',
            universe:{galaxies:[
                {
                    name:'Cerulean Path',
                    stars:1,
                    planetStarRatio:8
                },
            ]}
        };
        for(const [key, value] of Object.entries(defaultParams))
        {
            if(!params[key])
            {
                params[key] = value;
            }
        }
        let game = new Game(params);

        params.canvas.addEventListener('mousemove', function(evt){
            game.mouse = {x:evt.offsetX, y:evt.offsetY};
        });
        params.canvas.addEventListener('mousedown', function(evt){
            game.click();
        });
        Array.from(document.getElementsByClassName('currentSystemName')).forEach(
            (elem)=> elem.innerText = game.universe.startingSystem.name
        );


        return game;
    }
}