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
		this.scrollSen = 30;

		this.rotSenX = 0.008;
		this.rotSenY = 0.006;

		this.dragSen = 0.6;
		this.arrowsSen = 0.03;

		this.clickThreshold = 5;
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
			var temp = new THREE.Mesh(geo, new THREE.MeshLambertMaterial());
			temp.material.color.setHex(0xFFFFFF);
			temp.name = 'unit';

			temp.position.x = 0;
			temp.position.y = 0;
			temp.position.z = 0;

			temp.selectable = true;
			temp.onselect = function() {
				this.material.color.setHex(0x22DD22)
			}
			temp.offselect = function() {
				this.material.color.setHex(0xFFFFFF);
			}

			temp.floatCounter = 0;
			sample.add(temp);
		});
		utils.loader.load('Models/Unit/selection.js', function(geo) {

			var temp = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
			temp.name = 'selection';

			temp.position.x = 0;
			temp.position.y = -20;
			temp.position.z = 0;

			sample.add(temp);
		});
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
				try { [startX, x] = [x, startX]; } catch(error) { x ^= y; y ^= x; x ^= y; }
			}
			if(startY > y) {
				try { [startX, x] = [x, startX]; } catch(error) { x ^= y; y ^= x; x ^= y; }
			}

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

			// Swap start and end variables so that start is always the smaller one
			if(startX > x) {
				try { [startX, x] = [x, startX]; } catch(error) { x ^= y; y ^= x; x ^= y; }
			}
			if(startY > y) {	
				try { [startX, x] = [x, startX]; } catch(error) { x ^= y; y ^= x; x ^= y; }
			}

			// For each object in the scene
			for(var index = 0; index < scene.sample.__objects.length; index++) {
				var object = scene.sample.__objects[index];

				if(object.selectable) {

					// Get the object's center on the screen
					var center = three.projector.projectVector(object.position, three.camera);

					// If the object center is within the dragged box
					if(center.x < x && center.x > startX && center.y < y && center.y > startY) {

						// Remove from selection with the ctrl key
						if(e.ctrlKey) {
							this.remove(object);

						// Add to the selection with anything else
						} else {
							this.add(object);
						}
					}
				}
			}
		}
	};
	
	// Camera Controls
	var camera = new function() {
		this.addViewRotation = function(across, up) {
			// Add rotation around pivot
			three.camera.view.y += across * settings.rotSenX;
			three.camera.view.z -= up * settings.rotSenY;
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

			if(three.camera.distance < 200) { three.camera.distance = 200; }
			if(three.camera.distance > 500) { three.camera.distance = 500; }
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
			mouseVars.down = true;
			mouseVars.lastX = e.clientX;
			mouseVars.lastY = e.clientY;

			selection.startDrag(e);
		};

		document.onmouseup = function(e) {
			// If a box is still being dragged
			if(selection.drag) {
				selection.update(e);
				selection.endDrag(e);
			}

			mouseVars.down = false;
			mouseVars.lastX = false;
			mouseVars.lastY = false;
		};

		document.onmousemove = function(e) {
			if(mouseVars.down) {
				// Move screen
				if(e.altKey && e.shiftKey) {

					selection.endDrag(e);
					
					// Find difference between this frame and last frame
					var x = ((e.clientX / window.innerWidth) * 2 - 1) - ((mouseVars.lastX / window.innerWidth) * 2 - 1),
						y =  ((e.clientY / window.innerHeight) * 2 - 1) - ((mouseVars.lastY / window.innerHeight) * 2 - 1);

					camera.moveView(x, y);

				// Rotate Screen
				} else if(e.altKey) {

					selection.endDrag(e);
					camera.addViewRotation(mouseVars.lastX - e.clientX, mouseVars.lastY - e.clientY);	
				
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

						item.position.y = 6 + Math.sin(item.floatCounter) * 4;
						break;

					case 'selection':
						//THREE.AnimationHandler.update(16);
						break;
				}
			}

			// Update camera position
			(function() {
				if(keysPressed.W) {
					camera.moveView(0, 0.05);
				}
				if(keysPressed.S) {
					camera.moveView(0, -0.05);
				}
				if(keysPressed.A) {
					camera.moveView(0.05, 0);
				}
				if(keysPressed.D) {
					camera.moveView(-0.05, 0);
				}
			})();
			

			// Update camera rotation
			(function() {
				if(keysPressed.Q) {
					camera.addViewRotation(-5, 0);
				}
				if(keysPressed.E) {
					camera.addViewRotation(5, 0)
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
			requestAnimationFrame(renderLoop);
		})();
	})();
})();