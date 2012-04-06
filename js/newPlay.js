;(function() {
    // Utilities
    var utils = new function() {
        this.logger = new Logger();
        this.stats = new Stats();
        this.loader = new THREE.JSONLoader(true);

        this.stats.getDomElement().style.position = 'absolute';
        this.stats.getDomElement().style.right = '0px';
        this.stats.getDomElement().style.bottom = '0px';


        $('body')
            .append(this.logger.domElement)
            .append(this.stats.getDomElement())
            .append(this.loader.statusDomElement);
    };

    var settings = new function() {
        this.scrollSen = 30;
        this.rotSenX = 0.008;
        this.rotSenY = 0.006;
        this.moveSen = 1200;
    }

    // Scene
    var scene = new function() {
        var sample = new THREE.Scene();

        var pointLight = new THREE.PointLight(0xFFFFFF);
        pointLight.intensity = 1;
        pointLight.position.x = 0;
        pointLight.position.y = 200;
        pointLight.position.z = 100;

        var ambientLight = new THREE.PointLight(0xFFFFFF);
        ambientLight.intensity = 0.0;
        ambientLight.position.x = -300;
        ambientLight.position.y = -200;
        ambientLight.position.z = -200;

        sample.add(pointLight);
        sample.add(ambientLight);

        // Load models
        utils.loader.load('Models/Dragon/Medium.js', function(low) {
            var temp = new THREE.Mesh(low, new THREE.MeshLambertMaterial());
            temp.name = 'dragon'
            temp.position.x = 0;
            temp.position.y = -50;
            temp.position.z = 0;

            sample.add(temp);
        });

        this.sample = sample;
    };

    // THREE.js Setup
    var three = new function() {
        var renderer = new THREE.WebGLRenderer();
        var projector = new THREE.Projector();
        var camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100000
        );
        camera.pivot = new THREE.Vector3(0, 0, 0);

        camera.distance = 250;
        // The rotation of the camera around the pivot point (in radians)
        camera.view = new THREE.Vector3(0, 0, 0);

        renderer.setSize(window.innerWidth, window.innerHeight);
        $('#container').append(renderer.domElement);

        scene.sample.add(camera);

        window.onresize = function() {
            renderer.setSize(window.innerWidth, window.innerHeight);

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }

        this.renderer = renderer;
        this.projector = projector;
        this.camera = camera;
    };

    // Camera Controls
    (function() {
        window.mouseDown = false;
        window.lastMouseX = false;
        window.lastMouseY = false;

        document.onmousedown = function(e) {
            window.mouseDown = true;
            window.lastMouseX = e.clientX;
            window.lastMouseY = e.clientY;
        };

        document.onmouseup = function(e) {
            window.mouseDown = false;
            window.lastMouseX = false;
            window.lastMouseY = false;
        };

        document.onmousemove = function(e) {
            if(window.mouseDown) {
                // Move screen
                if(e.altKey && e.shiftKey) {

                    var lastX = (window.lastMouseX / window.innerWidth) * 2 - 1,
                        lastY = (window.lastMouseY / window.innerHeight) * 2 - 1;

                    var x = (e.clientX / window.innerWidth) * 2 - 1,
                        y = (e.clientY / window.innerHeight) * 2 - 1;

                    var last = three.projector.unprojectVector(new THREE.Vector3(lastX, -lastY, 0), three.camera),
                        now = three.projector.unprojectVector(new THREE.Vector3(x, -y, 0), three.camera);

                    var difference = now.subSelf(last).multiplyScalar(settings.moveSen);

                    three.camera.pivot.subSelf(difference);

                // Rotate Screen
                } else if(e.altKey) {

                    three.camera.view.y += (window.lastMouseX - e.clientX) * settings.rotSenX;
                    three.camera.view.z -= (window.lastMouseY - e.clientY) * settings.rotSenY;

                    if(three.camera.view.z > 1.57) { three.camera.view.z = 1.57; }
                    if(three.camera.view.z < 0) { three.camera.view.z = 0; }
                
                }
            }
            window.lastMouseX = e.clientX;
            window.lastMouseY = e.clientY;
        };

        if(window.addEventListener) {
            function moveObject(event) {
                var delta = 0;

                if (event.wheelDelta) {
                   delta = event.wheelDelta / 120;
                } else if (event.detail) {
                    delta = -event.detail / 3;
                }
                
                if(delta > 0) {
                    three.camera.distance -= settings.scrollSen;
                } else {
                    three.camera.distance += settings.scrollSen;
                }
            }
            document.addEventListener('DOMMouseScroll', moveObject, false);
            document.onmousewheel = moveObject;
        }
    })();

    (function() {

        (function renderLoop() {

            for(var index = 0; index < scene.sample.__objects.length; index++) {
                item = scene.sample.__objects[index];
                switch(item.name) {
                    case 'dragon':
                        //item.rotation.y += 0.01;
                        break;
                }
            }

            // Update camera rotation
            three.camera.position.x = three.camera.pivot.x + (Math.sin(three.camera.view.y) * three.camera.distance);
            three.camera.position.y = three.camera.pivot.y + (Math.sin(three.camera.view.z) * three.camera.distance);
            three.camera.position.z = three.camera.pivot.z + (Math.cos(three.camera.view.y) * three.camera.distance);

            three.camera.lookAt(three.camera.pivot);

            utils.stats.update();
            three.renderer.render(scene.sample, three.camera);
            window.requestAnimationFrame(renderLoop);
        })();
    })();
})();