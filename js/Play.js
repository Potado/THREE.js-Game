;(function() {
	if (!Detector.webgl) { Detector.addGetWebGLMessage(); return; }

	// Utilities
	var utils = new function() {
		this.logger = new Logger();
		this.stats = new Stats();
		this.loader = new THREE.JSONLoader();

		this.stats.getDomElement().style.position = 'absolute';
		this.stats.getDomElement().style.bottom = '0px';
		this.stats.getDomElement().style.right = '0px';

		$('body')
			.append(this.logger.domElement)
			.append(this.stats.getDomElement());
	};

	// Settings
	var settings = new function() {
		this.scrollSen = 30; // Zoom with mouse
		this.scrollKeySen = 5; // Zoom with keys

		this.rotSen = 0.005; // Rotation with mouse
		this.rotKeySen = 7; // Rotation with keys

		this.panSen = 0.6; // Pan with mouse
		this.panKeySen = 0.03; // Pan with keys

		this.clickThreshold = 50; // Differentiates between dragging and clicking
		this.selectThreshold = 100; // Closest distance that an object can be selected

		// Keyboard shortcuts
		this.keys = new function() {
			this.add = 'C';
			this.remove = 'V';

			this.camera = new function() {
				this.forward = 'W';
				this.backward = 'S';
				this.left = 'A';
				this.right = 'D';

				this.rotateLeft = 'Q';
				this.rotateRight = 'E';
				this.zoomIn = 'R';
				this.zoomOut = 'F';

				this.rotateMouse = 'Z';
				this.panMouse = 'X';
			};
		};
	};

	// Scene
	var scene = new function() {
		var sample = new THREE.Scene();

		var spotLight = new THREE.DirectionalLight(0xFFFFFF);
		spotLight.position.x = 300;
		spotLight.position.y = 400;
		spotLight.position.z = 600;

		spotLight.castShadow = true;
		spotLight.shadowDarkness = 0.3;

		spotLight.shadowCameraNear = 10;
		spotLight.shadowCameraFar = 1500;
		spotLight.shadowMapWidth = 2048;
		spotLight.shadowMapHeight = 2048;

		var fillLight = new THREE.DirectionalLight(0xAAAAAA);

		fillLight.position.x = -100;
		fillLight.position.y = 300;
		fillLight.position.z = -400

		sample.add(spotLight);
		sample.add(fillLight);

		utils.loader.load('Models/Unit/simpleMesh.js', function(geo) {
			for(var x = -50; x <= 50; x += 50) {
				var temp = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'Models/Unit/ao.png' ) }));
				temp.material.color.setHex(0xFFFFFF);

				temp.position.x = x - 50;
				temp.position.y = 0;
				temp.position.z = 20;

				temp.speed = 1;
				temp.route = [];

				temp.castShadow = true;

				temp.selectable = true;
				temp.onselect = function() {
					this.material.color.setHex(0x22DD22)
				}
				temp.offselect = function() {
					this.material.color.setHex(0xFFFFFF);
				}
				sample.add(temp);
			}
		});

		// Visible geometry
		utils.loader.load('Models/Terrain/terrain.js', function(geo) {

			var temp = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'Models/Terrain/ao.png' ) }));
			temp.class = '';

			temp.castShadow = true;
			temp.receiveShadow = true;

			sample.add(temp);
		});

		// Low-poly mesh of only the moveable areas for fast intersection detection
		utils.loader.load('Models/Terrain/clickCatcher.js', function(geo) {

			var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
			temp.class = 'clickCatcher';

			temp.visible = false;

			sample.add(temp);
		});

		// Low-poly mesh of the moveable area borders for pathfinding
		utils.loader.load('Models/Terrain/blocker.js', function(geo) {

			var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
			temp.class = 'blocker';

			temp.visible = false;

			sample.add(temp);
		});

		// A netword of edges for the A* algorithm
		utils.loader.load('Models/Terrain/paths.js', function(geo) {

			var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
			temp.class = 'paths';

			temp.visible = false;

			sample.add(temp);
		});

		utils.loader.load('Models/Grid.js', function(geo) {
			var temp = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
			temp.material.color.setHex(0x999999);

			temp.name = 'grid'
			temp.position.x = 0;
			temp.position.y = -20;
			temp.position.z = 0;

			sample.add(temp);
		});


		this.sample = sample;
	};

	// THREE.js Setup
	var three = new function() {
		var renderer = new THREE.WebGLRenderer({ antialias: true });
		
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true; 

		var projector = new THREE.Projector();
		var camera = new THREE.PerspectiveCamera(
			45,
			window.innerWidth / window.innerHeight,
			0.1,
			100000
		);

		// The location of the point that the camera rotates around
		camera.pivot = new THREE.Vector3(0, 0, 0);

		// The rotation of the camera around the pivot (rads)
		camera.view = new THREE.Vector3(0, 0, 0);

		camera.distance = 250;
		camera.view.z = 0.45;

		renderer.setSize(window.innerWidth, window.innerHeight - 5);
		$('#container').append(renderer.domElement);

		scene.sample.add(camera);

		onresize = function() {
			renderer.setSize(window.innerWidth, window.innerHeight - 5);

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
		}

		this.renderer = renderer;
		this.projector = projector;
		this.camera = camera;
	};

	var misc = new function() {
		this.lineToGeometry = function(line) {
			var geo = new THREE.Geometry();
			geo.dynamic = true;

			for(var index = 1; index < line.vertices.length; index++) {
				var vertexA = line.vertices[index],
					vertexB = line.vertices[index - 1];

				var face = new THREE.Face4(
					vertexA,
					vertexA.clone().position.addSelf(new THREE.Vector3(10, 0, 10)),
					vertexB,
					vertexB.clone().position.addSelf(new THREE.Vector3(10, 0, 10))
				);

				geo.faces.push(face);
				geo.vertices.push(vertexA);
				geo.vertices.push(vertexB);
				geo.vertices.push(vertexA.clone().position.addSelf(new THREE.Vector3(10, 0, 10)));
				geo.vertices.push(vertexB.clone().position.addSelf(new THREE.Vector3(10, 0, 10)));
			}

			return geo;
		};
	};

	var commands = new function() {
		this.move = function(e, destination) {
			for(var index = 0; index < selection.list.length; index++) {
				var object = selection.list[index];

				if(object.route) {

					if(keysPressed[settings.keys.add]) {
						object.route.push(destination.clone());

					} else {
						object.route = [destination.clone()];
					}

					if(object.route.length === 1) {
						object.movementVector = destination.clone().subSelf(object.position).normalize();
					}
				}
			}
		}
	};

	// Selected units/buildings
	var selection = new function() {
		this.list = [];

		// Adds array to the selection
		this.add = function(object) {
			if(this.list.indexOf(object) === -1) {
				this.list.push(object);
				object.selected = true;
				object.onselect();
			}
		}

		// Removes any elements in the array from the selection
		this.remove = function(object) {
			if(this.list.indexOf(object) !== -1) {
				object.offselect();
				this.list.splice(this.list.indexOf(object), 1);
			}
		}

		this.clear = function() {
			for(var index = 0; index < this.list.length; index++) {
				this.list[index].offselect();
			}
			this.list = [];
		}

		// Creates a DOM element who's values will reflect the position of the cursor
		this.startDrag = function(e) {
			$('#container').append('<div class="select"></div>');
			this.drag = new Object();
			this.drag.element = $('.select');
			this.drag.startX = e.clientX;
			this.drag.startY = e.clientY;
		}

		this.updateDrag = function(e) {
			var x = e.clientX,
				y = e.clientY;

			var startX = this.drag.startX,
				startY = this.drag.startY;

			// Make sure that start variables are always smaller
			if(startX > x) {	
				var temp = x;
				x = startX;
				startX = temp; }
			if(startY > y) {
				var temp = y;
				y = startY;
				startY = temp; }

			this.drag.element.css('left', startX)
							.css('top', startY)
							.css('width', x - startX)
							.css('height', y - startY);
		}

		this.endDrag = function(e) {
			if(this.drag) {
				this.drag.element.remove();
				delete this.drag;
			}
		}

		this.isClick = function(a, b, x, y) {
			// *Cough*
			return (Math.abs(a - x) + Math.abs(b - y) < settings.clickThreshold);
		}

		this.updateUnits = function(e) {
			// Clear selection unless you're adding or removing from it
			if(!keysPressed[settings.keys.add] && !keysPressed[settings.keys.remove]) {
				this.clear();
			}

			// Get the boundaries of the box
			var startX = ((this.drag.startX / window.innerWidth) * 2 - 1),
				startY = ((this.drag.startY / window.innerHeight) * 2 - 1);

			var x = ((e.clientX / window.innerWidth) * 2 - 1);
				y =  ((e.clientY / window.innerHeight) * 2 - 1);

			// Make sure that start variables are always smaller
			if(startX > x) {	
				var temp = x;
				x = startX;
				startX = temp; }
			if(startY > y) {
				var temp = y;
				y = startY;
				startY = temp; }

			// Differentiate clicking between dragging
			var click = this.isClick(e.clientX, e.clientY, this.drag.startX, this.drag.startY),
				closestClick = [undefined, settings.selectThreshold];

			// For each object in the scene
			for(var index = 0; index < scene.sample.__objects.length; index++) {
				var object = scene.sample.__objects[index];

				if(object.selectable) {

					// Get the object's center on the screen
					var center = three.projector.projectVector(
						new THREE.Vector3(
							object.position.x, 
							object.position.y,
							object.position.z
						), 
						three.camera
					);
					center.y = -center.y; // Invert y or it doesn't work properly

					if(click) {
						 // Distance from click to object
						var distance = Math.abs(e.clientX - ((center.x + 1) / 2 * window.innerWidth)) + 
									   Math.abs(e.clientY - ((center.y + 1) / 2 * window.innerHeight));

						if(distance < closestClick[1]) {
							closestClick = [object, distance]
						}

					// If dragging
					} else {
						// If the object center is within the dragged box
						if(center.x < x && center.x > startX && center.y < y && center.y > startY) {

							// Remove from selection with the ctrl key
							if(keysPressed[settings.keys.remove]) {
								this.remove(object);

							// Add to the selection otherwise
							} else {
								this.add(object);
							}
						}
					}
				}
			}
			// Add the closest object to the click origin to the selection
			if(click) {
				if(closestClick[0]) {
					// Remove from selection with the ctrl key
					if(keysPressed[settings.keys.remove]) {
						this.remove(closestClick[0]);
					
					// Add to the selection otherwise
					} else {
						this.add(closestClick[0]);
					}
				}
			}
		}
	};
	
	// Camera Controls
	var camera = new function() {
		this.addViewRotation = function(across, up) {
			// Add rotation around pivot
			three.camera.view.y += across * settings.rotSen;
			three.camera.view.z -= up * settings.rotSen;
		};

		this.moveView = function(leftAmount, upAmount) {
			// Get vector for moving up/left
			var up = new THREE.Vector3(Math.cos(three.camera.view.y - Math.PI / 2), 0, -Math.sin(three.camera.view.y - Math.PI / 2)),
				left = new THREE.Vector3(Math.cos(three.camera.view.y), 0, -Math.sin(three.camera.view.y));

			// Multiply up/left vectors by the difference in mouse movement
			three.camera.pivot.subSelf(up.multiplyScalar(upAmount * settings.panSen * three.camera.distance));
			three.camera.pivot.subSelf(left.multiplyScalar(leftAmount * settings.panSen * three.camera.distance));
		};

		this.addZoom = function(difference) {
			three.camera.distance += difference;
			three.camera.view.z += difference * 0.005;
		}
	};

	// Bind camera to keystrokes
	(function() {
		mouseVars = new Object();
		mouseVars.down = false;
		mouseVars.lastX = false;
		mouseVars.lastY = false;

		keysPressed = new Object();

		document.onmousedown = function(e) {
			// Left click
			if(e.button === 0) {
				mouseVars.down = true;
				mouseVars.lastX = e.clientX;
				mouseVars.lastY = e.clientY;

				selection.startDrag(e);
			
			// Right click
			} else if(e.button === 2) {
				if(selection.list.length !== 0) {
					var x = ((e.clientX / window.innerWidth) * 2 - 1),
						y =  ((e.clientY / window.innerHeight) * 2 - 1); 

					var point = three.projector.unprojectVector(new THREE.Vector3(x, -y, 0.5), three.camera);
					var ray = new THREE.Ray(three.camera.position, point.subSelf(three.camera.position).normalize());

					for(var index = 0; index < scene.sample.__objects.length; index++) {
						var object = scene.sample.__objects[index];

						// Find the low poly, click catching mesh
						if(object.class === 'clickCatcher') {

							var intersect = ray.intersectObject(object);

							if(intersect.length > 0) {
								commands.move(e, intersect[0].point);
							}
						}
					}
				}
			}
			
			// Disable text selection (sometimes selects the render element
			// and the results aren't pretty)
			return false;
		};

		document.onmouseup = function(e) {
			// Left click
			if(e.button === 0) {
				// If a box is still being dragged
				if(selection.drag) {
					selection.updateUnits(e);
					selection.endDrag(e);
				}

				mouseVars.down = false;
				mouseVars.lastX = false;
				mouseVars.lastY = false;
			
			// Right click
			} else if(e.button === 2) {
				
			}
		};

		document.oncontextmenu = function(e) {
			return false;
		}

		document.onmousemove = function(e) {
			if(mouseVars.down) {
				// Pan screen
				if(keysPressed[settings.keys.camera.panMouse]) {

					selection.endDrag(e);
					
					// Find difference between this frame and last frame
					var x = ((e.clientX / window.innerWidth) * 2 - 1) - ((mouseVars.lastX / window.innerWidth) * 2 - 1),
						y =  ((e.clientY / window.innerHeight) * 2 - 1) - ((mouseVars.lastY / window.innerHeight) * 2 - 1);

					camera.moveView(x * three.camera.aspect, y);

				// Rotate Screen
				} else if(keysPressed[settings.keys.camera.rotateMouse]) {

					selection.endDrag(e);
					camera.addViewRotation(mouseVars.lastX - e.clientX, 0);
					camera.addZoom(e.clientY - mouseVars.lastY);	

				// Update selection box
				} else {
					selection.updateDrag(e);
				}
			}
			mouseVars.lastX = e.clientX;
			mouseVars.lastY = e.clientY;
		};

		// Scroll to zoom
		if(addEventListener) {
			function moveObject(event) {
				var delta = 0;

				if (event.wheelDelta) {
				   delta = event.wheelDelta / 120;
				} else if (event.detail) {
					delta = -event.detail / 3;
				}
				
				if(delta > 0) {
					camera.addZoom(-settings.scrollSen);
				} else {
					camera.addZoom(settings.scrollSen);
				}
				
			}
			document.addEventListener('DOMMouseScroll', moveObject, false);
			document.onmousewheel = moveObject;
		}

		document.onkeydown = function(e) {
			keysPressed[String.fromCharCode(e.charCode ? e.charCode : e.keyCode)] = true;
		}
		document.onkeyup = function(e) {
			keysPressed[String.fromCharCode(e.charCode ? e.charCode : e.keyCode)] = false;
		}
	})();

	// Render loop
	(function() {

		var geo = new THREE.Geometry();
		geo.vertices.push(new THREE.Vertex(new THREE.Vector3(-10, 0, 0)));
	    geo.vertices.push(new THREE.Vertex(new THREE.Vector3(0, 10, 0)));
	    geo.vertices.push(new THREE.Vertex(new THREE.Vector3(10, 0, 0)));



	   	//scene.sample.add(new THREE.Mesh(misc.lineToGeometry(geo)));

		(function renderLoop() {

			for(var index = 0; index < scene.sample.__objects.length; index++) {
				var object = scene.sample.__objects[index];

				// Movement
				if(object.route && object.speed && object.route.length > 0) {
					var nextCheckpoint = object.route[0];

					if(object.position.distanceTo(nextCheckpoint) < 2) {
						object.route.shift();

						if(object.route.length > 0) {
							object.movementVector = object.route[0].clone().subSelf(object.position).normalize();
						}
					}
					object.position.addSelf(object.movementVector);
				}

				// Specifics for different units
				switch(object.class) {
					case 'temp':
						scene.sample.remove(object);
				}
			}

			// Update camera position
			(function() {
				if(keysPressed[settings.keys.camera.forward]) {
					camera.moveView(0, settings.panKeySen);
				}
				if(keysPressed[settings.keys.camera.backward]) {
					camera.moveView(0, -settings.panKeySen);
				}
				if(keysPressed[settings.keys.camera.left]) {
					camera.moveView(settings.panKeySen, 0);
				}
				if(keysPressed[settings.keys.camera.right]) {
					camera.moveView(-settings.panKeySen, 0);
				}
			})();
			

			// Update camera rotation
			(function() {
				if(keysPressed[settings.keys.camera.rotateLeft]) {
					camera.addViewRotation(-settings.rotKeySen, 0);
				}
				if(keysPressed[settings.keys.camera.rotateRight]) {
					camera.addViewRotation(settings.rotKeySen, 0);
				}
				if(keysPressed[settings.keys.camera.zoomIn]) {
					camera.addZoom(-settings.scrollKeySen);
				}
				if(keysPressed[settings.keys.camera.zoomOut]) {
					camera.addZoom(settings.scrollKeySen);
				}

				if(three.camera.view.z > 1.7) { three.camera.view.z = 1.7; }
				if(three.camera.view.z < 0.2) { three.camera.view.z = 0.2; }

				if(three.camera.distance < 200) { three.camera.distance = 200; }
				if(three.camera.distance > 500) { three.camera.distance = 500; }

				three.camera.position.x = three.camera.pivot.x + (Math.sin(three.camera.view.y) * three.camera.distance);
				three.camera.position.y = three.camera.pivot.y + (Math.sin(three.camera.view.z) * three.camera.distance);
				three.camera.position.z = three.camera.pivot.z + (Math.cos(three.camera.view.y) * three.camera.distance);

				three.camera.lookAt(three.camera.pivot);
			})();      

			utils.stats.update();
			three.renderer.render(scene.sample, three.camera);
			requestAnimationFrame(renderLoop);
		})();
	})();
})();