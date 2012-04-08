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

	// Settings
	var settings = new function() {
		this.scrollSen = 30; // Zoom with mouse
		this.scrollKeySen = 5; // Zoom with keys

		this.rotSen = 0.005; // Rotation with mouse
		this.rotKeySen = 7; // Rotation with keys

		this.dragSen = 0.6; // Movement with mouse
		this.dragKeySen = 0.03; // Movement with keys

		this.clickThreshold = 50; // Differentiates between dragging and clicking
		this.selectThreshold = 100; // Closest distance that an object can be selected
	};

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
			for(var x = -200; x <= 200; x += 50) {
				for(var z = -200; z <= 200; z += 50) {
					var temp = new THREE.Mesh(geo, new THREE.MeshLambertMaterial());
					temp.material.color.setHex(0xFFFFFF);
					temp.name = 'unit';

					temp.position.x = x;
					temp.position.y = 0;
					temp.position.z = z;

					temp.selectable = true;
					temp.onselect = function() {
						this.material.color.setHex(0x22DD22)
					}
					temp.offselect = function() {
						this.material.color.setHex(0xFFFFFF);
					}

					temp.floatCounter = 0;
					sample.add(temp);
				}
			}
		});
		// utils.loader.load('Models/Unit/selection.js', function(geo) {

		// 	var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
		// 	temp.name = 'selection';

		// 	temp.position.x = 0;
		// 	temp.position.y = -20;
		// 	temp.position.z = 0;

		// 	sample.add(temp);
		// });
		utils.loader.load('Models/Grid.js', function(geo) {
			var temp = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
			temp.material.color.setHex(0xE3E3E3);

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
		var renderer = new THREE.WebGLRenderer();
		var projector = new THREE.Projector();
		var camera = new THREE.PerspectiveCamera(
			45,
			innerWidth / innerHeight,
			0.1,
			100000
		);

		// The location of the point that the camera rotates around
		camera.pivot = new THREE.Vector3(0, 0, 0);

		camera.distance = 250;

		// The rotation of the camera around the pivot (rads)
		camera.view = new THREE.Vector3(0, 0, 0);

		renderer.setSize(innerWidth, innerHeight);
		$('#container').append(renderer.domElement);

		scene.sample.add(camera);

		onresize = function() {
			renderer.setSize(innerWidth, innerHeight);

			camera.aspect = innerWidth / innerHeight;
			camera.updateProjectionMatrix();
		}

		this.renderer = renderer;
		this.projector = projector;
		this.camera = camera;
	};

	var commands = new function() {
		
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
			}
		}

		this.isClick = function(a, b, x, y) {
			// *Cough*
			return (Math.abs(a - x) + Math.abs(b - y) < settings.clickThreshold);
		}

		this.update = function(e) {
			// Clear selection unless you're adding or removing from it
			if(!e.shiftKey && !e.ctrlKey) {
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
					// * invert the y coordinates before and after or it doesn't work properly
					var center = three.projector.projectVector(
						new THREE.Vector3(
							object.position.x, 
							-object.position.y, // *
							object.position.z
						), 
						three.camera
					);
					center.y = -center.y; // *

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
							if(e.ctrlKey) {
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
					if(e.ctrlKey) {
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
			three.camera.pivot.subSelf(up.multiplyScalar(upAmount * settings.dragSen * three.camera.distance));
			three.camera.pivot.subSelf(left.multiplyScalar(leftAmount * settings.dragSen * three.camera.distance));
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
			} else if(e.button === 1) {
				
			}
		};

		document.onmouseup = function(e) {
			// Left click
			if(e.button === 0) {
				// If a box is still being dragged
				if(selection.drag) {
					selection.update(e);
					selection.endDrag(e);
				}

				mouseVars.down = false;
				mouseVars.lastX = false;
				mouseVars.lastY = false;
			
			// Right click
			} else if(e.button === 1) {
				
			}
		};

		document.oncontextmenu = function(e) {
			return false;
		}

		document.onmousemove = function(e) {
			if(mouseVars.down) {
				// Move screen
				if(keysPressed.C) {

					selection.endDrag(e);
					
					// Find difference between this frame and last frame
					var x = ((e.clientX / window.innerWidth) * 2 - 1) - ((mouseVars.lastX / window.innerWidth) * 2 - 1),
						y =  ((e.clientY / window.innerHeight) * 2 - 1) - ((mouseVars.lastY / window.innerHeight) * 2 - 1);

					camera.moveView(x * three.camera.aspect, y);

				// Rotate Screen
				} else if(keysPressed.Z) {

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

	(function() {
		(function renderLoop() {

			for(var index = 0; index < scene.sample.__objects.length; index++) {
				item = scene.sample.__objects[index];
				switch(item.name) {
					case 'unit':
						item.floatCounter += 0.05;

						//item.position.y = Math.sin(item.floatCounter) * 4;
						break;

					case 'selection':
						//THREE.AnimationHandler.update(16);
						break;
				}
			}

			// Update camera position
			(function() {
				if(keysPressed.W) {
					camera.moveView(0, settings.dragKeySen);
				}
				if(keysPressed.S) {
					camera.moveView(0, -settings.dragKeySen);
				}
				if(keysPressed.A) {
					camera.moveView(settings.dragKeySen, 0);
				}
				if(keysPressed.D) {
					camera.moveView(-settings.dragKeySen, 0);
				}
			})();
			

			// Update camera rotation
			(function() {
				if(keysPressed.Q) {
					camera.addViewRotation(-settings.rotKeySen, 0);
				}
				if(keysPressed.E) {
					camera.addViewRotation(settings.rotKeySen, 0);
				}
				if(keysPressed.R) {
					camera.addZoom(-settings.scrollKeySen);
				}
				if(keysPressed.F) {
					camera.addZoom(settings.scrollKeySen);
				}

				if(three.camera.view.z > 1.57) { three.camera.view.z = 1.57; }
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