// Wrapper function (duh)
;(function() {

	var width = window.innerWidth, height = window.innerHeight;
	var logger = new Logger();
	var container = $('#container');
	var selected = [];

	$('body').append(logger.domElement); 

	// Selections
	(function() {
		THREE.Object3D.prototype.selectable = false;
		THREE.Object3D.prototype.selected = false;
		THREE.Object3D.prototype.startSelect = function() {};
		THREE.Object3D.prototype.stopSelect = function() {};

		THREE.Ray.prototype.intersectSelectable = function(object) {
			if(object.selectable) {
				return this.intersectObject(object);
			}
		}

		// Taken from Three.js source
		// Swrapped this.intersectObject to this.intersectSelectable
		THREE.Ray.prototype.intersectSelectables = function(objects) {
			var i, l, object,
			intersects = [];

			for (i = 0, l = objects.length; i < l; i ++) {
				Array.prototype.push.apply(intersects, this.intersectSelectable(objects[i]));
			}

			intersects.sort(function (a, b) { return a.distance - b.distance; });

			return intersects;
		}
	})();

	// Multi-detail and selection meshes
	(function() {
		THREE.Mesh.prototype.high = '';
		THREE.Mesh.prototype.medium = '';
		THREE.Mesh.prototype.low = '';

		THREE.Mesh.prototype.detail = 'high';

		// THREE.Object3D.prototype.changeDetail = function(detail) {
		// 	this.geometry = this['detail'];
		// };
	})();

	// THREE.js
	// Standard WebGL rendering stuff
	var renderer, projector, camera, scene, loader;
	(function() {
		renderer = new THREE.WebGLRenderer();
		projector = new THREE.Projector();
		camera = new THREE.PerspectiveCamera(
			45,
			width / height,
			0.1,
			100000
		);

		scene = new THREE.Scene();

		renderer.setSize(width, height);
		container.append(renderer.domElement);

		framerate = 1000 / 60;
		frameTime = new Date().getTime();

		loader = new THREE.JSONLoader();
	})();

	container.click(function(eventObj) {
		for(var index = 0; index < selected.length; index++) {
			selected[index].stopSelect();
			selected[index].selected = true;
		};
		selected = [];
		

	    var x = (eventObj.clientX / renderer.domElement.width) * 2 - 1;
	    var y = (eventObj.clientY / renderer.domElement.height) * 2 - 1;

	    var vector = new THREE.Vector3(x, y, 0.5);
	    var mouse3d = projector.unprojectVector(vector, camera);

	    var ray = new THREE.Ray( camera.position, mouse3d.subSelf( camera.position ).normalize() );

	    var intersect = ray.intersectSelectables(scene.__objects);

	    if(intersect.length > 0) {
	    	intersect[0].object.startSelect();
	    	intersect[0].object.selected = true;
	    	selected.push(intersect[0].object);
	    }

	    logger.log(intersect.length);
	    // logger.log(scene.__objects);

	    // if(intersect.length > 0) {
	    // 	logger.log(intersect[0]);
	    // 	intersect[0].object.material.color.setHex(0x333333);
	    // }

	    // logger.log([x, y]);
	});

	// Camera controls
	(function() {
	})();

	// Enables performance monitoring
	var stats;
	(function() {
		//////////////////////////////////////////
		// Performance Monitor

		stats = new Stats();

		//Top left of parent element
		stats.getDomElement().style.position = 'absolute';
		stats.getDomElement().style.left = '0px';
		stats.getDomElement().style.bottom = '0px';

		$('body').append(stats.getDomElement());
	})();

	// Load Meshes
	(function() {

		// Taken from THREE.js source
		// function updateGeometry(mesh) {
		// 	mesh.geometry.computeBoundingSphere();		
		// 	mesh.boundRadius = geometry.boundingSphere.radius;

		// 	if( mesh.geometry.morphTargets.length ) {

		// 		mesh.morphTargetBase = -1;
		// 		mesh.morphTargetForcedOrder = [];
		// 		mesh.morphTargetInfluences = [];
		// 		mesh.morphTargetDictionary = {};

		// 		for(var m = 0; m < mesh.geometry.morphTargets.length; m++) {

		// 			mesh.morphTargetInfluences.push(0);
		// 			mesh.morphTargetDictionary[mesh.geometry.morphTargets[m].name] = m;
		// 		}
		// 	}
		// 	return mesh
		// }

		loader.load('Models/Monkey/High.js', function(geo) {
			monkey = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x333399 }));

			monkey.selectable = true;
			monkey.name = 'monkey';
			monkey.startSelect = function() {
				this.material.color.setHex(0x333333);
			};
			monkey.stopSelect = function() {
				this.material.color.setHex(0x333399);
			};

			scene.add(monkey);
		});
		// loader.load('Models/Monkey/Medium.js', function(model) {
		// 	// model.computeBoundingSphere();
		// 	// monkey.medium = model;
		// });
		// loader.load('Models/Monkey/Low.js', function(model) {
		// 	// model.computeBoundingSphere();
		// 	// monkey.low = model;
		// });	
	})();

	// Set up scene
	(function() {
		var pointlight = new THREE.PointLight(0xFFFFFF);
		pointlight.intensity = 1.7;
		pointlight.position.x = 90;
		pointlight.position.y = 130;
		pointlight.position.z = 80;

		var ambientLight = new THREE.PointLight(0xFFFFFF);
		ambientLight.intensity = 0.3;
		ambientLight.position.x = -200;
		ambientLight.position.y = -200;
		ambientLight.position.z = 200;


		camera.position.x = 70;
		camera.position.y = 40;
		camera.position.z = 130;

		camera.lookAt(new THREE.Vector3(0, 0, 0));

		scene.add(pointlight);
		scene.add(ambientLight); 
		scene.add(camera);
	})();

	// Where the magic happens
	var framerate = 1000 / 60, delta, lastFrame, thisFrame = new Date().getTime();
	(function loop() {
		lastFrame = thisFrame;
		thisFrame = new Date().getTime();
		delta = thisFrame - lastFrame;


		//logger.log(monkey);
		for(var index = 0; index < scene.__objects.length; index++) {
			if(scene.__objects[index].name === 'monkey') {
				scene.__objects[index].rotation.y += 0.001 * delta;
			}
		}

		stats.update();
		renderer.render(scene, camera);

		window.requestAnimFrame(
			loop, 
			Math.max(0, framerate - (new Date().getTime() - thisFrame))
			);
	})();

})();