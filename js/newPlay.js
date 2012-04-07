;(function() {
	// Utilities
	var utils = new function() {
		this.logger = new Logger();
		this.stats = new Stats();
		this.loader = new THREE.JSONLoader();

		this.stats.getDomElement().style.position = 'absolute';
		this.stats.getDomElement().style.right = '0px';
		this.stats.getDomElement().style.bottom = '0px';


		$('body')
			.append(this.logger.domElement)
			.append(this.stats.getDomElement());
	};

	var settings = new function() {
		this.scrollSen = 30;

		this.rotSenX = 0.008;
		this.rotSenY = 0.006;

		this.dragSen = 0.6;
		this.arrowsSen = 0.03;
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
		utils.loader.load('Models/Unit/simpleMesh.js', function(geo) {
			var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
			temp.name = 'unit';

			temp.position.x = 0;
			temp.position.y = 0;
			temp.position.z = 0;

			temp.selectable = true;

			temp.floatCounter = 0;

			sample.add(temp);
		});
		utils.loader.load('Models/Unit/selection1.js', function(geo) {
			var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
			temp.name = 'selection1';

			temp.position.x = 0;
			temp.position.y = -20;
			temp.position.z = 0;

			sample.add(temp);
		});
		utils.loader.load('Models/Unit/selection2.js', function(geo) {
			var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
			temp.name = 'selection2';

			temp.position.x = 0;
			temp.position.y = -20;
			temp.position.z = 0;


			sample.add(temp);
		});
		utils.loader.load('Models/Unit/selection3.js', function(geo) {
			var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
			temp.name = 'selection3';

			temp.position.x = 0;
			temp.position.y = -20;
			temp.position.z = 0;

			sample.add(temp);
		});
		// utils.loader.load('Models/Grid.js', function(geo) {
		// 	var temp = new THREE.Mesh(geo, new THREE.MeshLambertMaterial());

		// 	temp.name = 'grid'
		// 	temp.position.x = 0;
		// 	temp.position.y = -20;
		// 	temp.position.z = 0;

		// 	sample.add(temp);
		// });


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

	// Selected units/buildings
	var selection = new function() {
		this.list = [];

		// Adds array to the selection
		this.add = function(object) {
			if(this.list.indexOf(object) === -1) {
				this.list.push(object);
				object.selected = true;
			}
		}

		// Removes any elements in the array from the selection
		this.remove = function(object) {
			if(this.list.indexOf(object) !== -1) {
				this.list.splice(this.list.indexOf(object), 1);
			}
		}
		this.clear = function() {
			this.list = [];
		}
	};

	// Camera Controls

	// CLEAN DIS CRAP UP!
	(function() {
		window.mouseDown = false;
		window.lastMouseX = false;
		window.lastMouseY = false;
		window.startDragX = false;
		window.startDragY = false;
		window.dragElement = false;
		window.keysPressed = new Object();

		document.onmousedown = function(e) {
			window.mouseDown = true;
			window.lastMouseX = e.clientX;
			window.lastMouseY = e.clientY;
			window.startDragX = e.clientX;
			window.startDragY = e.clientY;
			$('#container').append('<div class="select"></div>');
		};

		document.onmouseup = function(e) {
			window.mouseDown = false;
			window.lastMouseX = false;
			window.lastMouseY = false;

			// If a box has been dragged
			if(window.startDragX && window.startDragY) {

				if(!e.shiftKey && !e.ctrlKey) {
					selection.clear();
				}

				for(var index = 0; index < scene.sample.__objects.length; index++) {
					var object = scene.sample.__objects[index];

					if(object.selectable) {
						// Get the object center in terms of 
						var center = three.projector.projectVector(object.position, three.camera);

						var startX = ((window.startDragX / window.innerWidth) * 2 - 1),
							startY = ((window.startDragY / window.innerHeight) * 2 - 1);

						var x = ((e.clientX / window.innerWidth) * 2 - 1);
							y =  ((e.clientY / window.innerHeight) * 2 - 1);

						if(startX > x) {
							// Swap startX and x
							[startX, x] = [x, startX];
						}
						if(startY > y) {	
							// Swap startY and y
							[startY, y] = [y, startY];
						}

						// If the object center is within the dragged box
						if(center.x < x && center.x > startX && center.y < y && center.y > startY) {

							// Add to selection with shift key
							if(e.shiftKey) {
								selection.add(object);

							// Remove from selection with ctrl key
							} else if(e.ctrlKey) {
								selection.remove(object);
							
							// Replace selection by default
							} else {
								selection.add(object);
							}
						}
					}
				}
			}

			window.startDragX = false;
			window.startDragY = false;
			$('.select').remove();
		};

		document.onmousemove = function(e) {
			if(window.mouseDown) {
				// Move screen
				if(e.altKey && e.shiftKey) {

					// Cancel any selections
					window.startDragX = false;
					window.startDragY = false;

					var x = ((e.clientX / window.innerWidth) * 2 - 1) - ((window.lastMouseX / window.innerWidth) * 2 - 1),
						y =  ((e.clientY / window.innerHeight) * 2 - 1) - ((window.lastMouseY / window.innerHeight) * 2 - 1);

					var up = new THREE.Vector3(Math.cos(three.camera.view.y - Math.PI / 2), 0, -Math.sin(three.camera.view.y - Math.PI / 2)),
						left = new THREE.Vector3(Math.cos(three.camera.view.y), 0, -Math.sin(three.camera.view.y));

					three.camera.pivot.subSelf(up.multiplyScalar(y * settings.dragSen * three.camera.distance));
					three.camera.pivot.subSelf(left.multiplyScalar(x * settings.dragSen * three.camera.distance * three.camera.aspect));

				// Rotate Screen
				} else if(e.altKey) {

					// Cancel any selections
					window.startDragX = false;
					window.startDragY = false;

					three.camera.view.y += (window.lastMouseX - e.clientX) * settings.rotSenX;
					three.camera.view.z -= (window.lastMouseY - e.clientY) * settings.rotSenY;
				
				// Update selection box
				} else {
					$('.select').css('left', window.startDragX)
								.css('top', window.startDragY)
								.css('width', e.clientX - window.startDragX)
								.css('height', e.clientY - window.startDragY);
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
				if(three.camera.distance < 200) { three.camera.distance = 200; }
				if(three.camera.distance > 500) { three.camera.distance = 500; }
			}
			document.addEventListener('DOMMouseScroll', moveObject, false);
			document.onmousewheel = moveObject;
		}

		document.onkeydown = function(e) {
			window.keysPressed[String.fromCharCode(e.charCode ? e.charCode : e.keyCode)] = true;
		}
		document.onkeyup = function(e) {
			window.keysPressed[String.fromCharCode(e.charCode ? e.charCode : e.keyCode)] = false;
		}
	})();

	(function() {

		(function renderLoop() {

			for(var index = 0; index < scene.sample.__objects.length; index++) {
				item = scene.sample.__objects[index];
				switch(item.name) {
					case 'unit':
						item.floatCounter += 0.05;

						item.position.y = 6 + Math.sin(item.floatCounter) * 4;
						break;

					case 'selection1':
						item.rotation.y += 0.05;
						break;
					case 'selection2':
						item.rotation.y -= 0.02;
						break;
					case 'selection3':
						item.rotation.y += 0.10;
						break;
				}
			}

			// Update camera position
			(function() {
				if(window.keysPressed.W) {
				three.camera.pivot.subSelf(new THREE.Vector3(
					Math.cos(three.camera.view.y - Math.PI / 2),
					0,
					-Math.sin(three.camera.view.y - Math.PI / 2)
				).multiplyScalar(settings.arrowsSen * three.camera.distance));
				}
				if(window.keysPressed.S) {
					three.camera.pivot.subSelf(new THREE.Vector3(
						Math.cos(three.camera.view.y + Math.PI / 2),
						0,
						-Math.sin(three.camera.view.y + Math.PI / 2)
					).multiplyScalar(settings.arrowsSen * three.camera.distance));
				}
				if(window.keysPressed.A) {
					three.camera.pivot.subSelf(new THREE.Vector3(
						Math.cos(three.camera.view.y),
						0,
						-Math.sin(three.camera.view.y)
					).multiplyScalar(settings.arrowsSen * three.camera.distance));
				}
				if(window.keysPressed.D) {
					three.camera.pivot.subSelf(new THREE.Vector3(
						Math.cos(three.camera.view.y + Math.PI),
						0,
						-Math.sin(three.camera.view.y + Math.PI)
					).multiplyScalar(settings.arrowsSen * three.camera.distance));
				}
			})();
			

			// Update camera rotation
			(function() {
				if(window.keysPressed.F) {
					three.camera.view.y -= 5 * settings.rotSenX;
				}
				if(window.keysPressed.H) {
					three.camera.view.y += 5 * settings.rotSenX;
				}
				if(window.keysPressed.T) {
					three.camera.view.z += 5 * settings.rotSenY;
				}
				if(window.keysPressed.G) {
					three.camera.view.z -= 5 * settings.rotSenY;
				}

				if(three.camera.view.z > 1.57) { three.camera.view.z = 1.57; }
				if(three.camera.view.z < 0) { three.camera.view.z = 0; }

				three.camera.position.x = three.camera.pivot.x + (Math.sin(three.camera.view.y) * three.camera.distance);
				three.camera.position.y = three.camera.pivot.y + (Math.sin(three.camera.view.z) * three.camera.distance);
				three.camera.position.z = three.camera.pivot.z + (Math.cos(three.camera.view.y) * three.camera.distance);

				three.camera.lookAt(three.camera.pivot);
			})();      

			utils.stats.update();
			three.renderer.render(scene.sample, three.camera);
			window.requestAnimationFrame(renderLoop);
		})();
	})();
})();