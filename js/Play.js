;(function wrapper() {
	if (!Detector.webgl) { Detector.addGetWebGLMessage(); return; }

	// Utilities
	var utils = new function utils() {
		this.stats = new Stats();
		this.loader = new THREE.JSONLoader();

		this.stats.getDomElement().style.position = 'absolute';
		this.stats.getDomElement().style.bottom = '0px';
		this.stats.getDomElement().style.right = '0px';

		$('body').append(this.stats.getDomElement());
	};

	// Settings
	var settings = new function settings() {
		this.antialias = true;

		this.scrollSen = 6; // Zoom with mouse wheel
		this.scrollKeySen = 1; // Zoom with keys

		this.rotSen = 0.0045; // Rotation with mouse
		this.rotKeySen = 8.5; // Rotation with keys

		this.panSen = 0.6; // Pan with mouse
		this.panKeySen = 0.03; // Pan with keys

		this.clickThreshold = 50; // Differentiates between dragging and clicking
		this.selectThreshold = 1000; // Closest distance that an object can be selected

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

	// THREE.js Setup
	var display = new function display() {
		var renderer = new THREE.WebGLRenderer({ antialias: settings.antialias });
		
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

		// The rotation of the camera around the pivot (radians)
		camera.view = new THREE.Vector3(0, 0, 0);

		camera.distance = 250;
		camera.view.z = 0.45;

		renderer.setSize(window.innerWidth, window.innerHeight);
		$('#draw').attr('width', window.innerWidth).attr('height', window.innerHeight);
		$('#container').append(renderer.domElement);

		//scene.sample.add(camera);

		window.onresize = function() {
			$('#draw').attr('width', window.innerWidth).attr('height', window.innerHeight);
			renderer.setSize(window.innerWidth, window.innerHeight);

			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
		}

		this.renderer = renderer;
		this.projector = projector;
		this.camera = camera;

		this.draw = document.getElementById('draw').getContext('2d');
		this.draw.objects = [];
		this.draw.point = function(v) {
			var v = projector.projectVector(v, camera);

			v.x = (v.x + 1) / 2 * window.innerWidth;
			v.y = (-v.y + 1) / 2 * window.innerHeight;

			this.pointPixels(v.x, v.y);
		};

		this.draw.pointPixels = function(x, y) {
			this.beginPath();
			this.arc(x, y, 5, 0, Math.PI*2, true); 
			this.closePath();
			this.fill();
		};

		this.draw.line = function(path) {
			// If the line intersects with the viewport
			if(!(
			(path[0].x > window.innerWidth && path[1].x > window.innerWidth)
			|| (path[0].x < 0 && path[1].x < 0)
			|| (path[0].y > window.innerHeight && path[1].y > window.innerHeight)
			|| (path[0].y < 0 && path[1].y < 0))
			) {

				// this.lineWidth = 0.5;
				// this.beginPath();

				// // If the first point (path[0]) is outside the viewport
				// // if(path[0].x > window.innerWidth || path[0].x < 0 || path[0].y > window.innerHeight || path[0].y < 0) {
				// if(path[0].x < 0) {
				// 	toLeft = -path[0].x;
				// } else if(path[0].x > window.innerWidth) {
					
				// }


				// this.moveTo(x[0].x, x[0].y);
				// for(var index = 1; index < x.length; index++) {
				// 	this.lineTo(x[index].x, x[index].y);
				// }
				// this.closePath();
				// this.stroke();
			}
		};

		// Like Skyrim but without dragons
		this.draw.line3 = function(x) {
			var projectedA = projector.projectVector(x[0].clone(), camera);
			projectedA.x = (projectedA.x + 1) / 2 * window.innerWidth;
			projectedA.y = (-projectedA.y + 1) / 2 * window.innerHeight;

			var projectedB = projector.projectVector(x[1].clone(), camera);
			projectedB.x = (projectedB.x + 1) / 2 * window.innerWidth;
			projectedB.y = (-projectedB.y + 1) / 2 * window.innerHeight;

			// if(projectedA.y > window.innerHeight) {
			// 	return;
			// }
			// if(projectedB.y > window.innerHeight) {
			// 	return;
			// }

			// this.moveTo(projectedA.x, projectedA.y);
			// this.lineTo(projectedB.x, projectedB.y);

			this.line([projectedA, projectedB]);
		};

		this.draw.update = function() {
			this.clearRect(0, 0, window.innerWidth, window.innerHeight);
			
			for(var index = 0; index < this.objects.length; index++) {
		
				// If it's a path
				if(this.objects[index].length && this.objects[index].length === 2) {
					this.line3(this.objects[index]);


				// If it's a point
				} else if(this.objects[index].x !== undefined) {
					this.point(this.objects[index].clone());
				
				// If it's a string
				} else if(typeof this.objects[index][0] === 'string') {
					
				}
			}
		}
	};

		// Scene
	var scene = new function scene() {
		var sample = new THREE.Scene();

		sample.add(display.camera);

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
				temp.class = 'unit';

				temp.groundPosition = new THREE.Vector3(x - 50, 0, 20);
				temp.offset = new THREE.Vector3(0, 20, 0);

				temp.speed = 1;
				temp.route = [];

				// For selection
				temp.radius = 5;

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
			temp.class = 'terrain';

			temp.castShadow = true;
			temp.receiveShadow = true;

			sample.add(temp);
		});

		// Low-poly mesh of only the moveable areas for fast intersection detection
		utils.loader.load('Models/Terrain/clickCatcher.js', function(geo) {
			sample.clickCatcher = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());
		});


		// Low-poly mesh of the moveable area borders for pathfinding
		utils.loader.load('Models/Terrain/blocker.js', function(geo) {
			sample.blocker = new THREE.Mesh(geo, new THREE.MeshNormalMaterial());

			sample.blocker.doubleSided = true;
			// sample.add(sample.blocker);
		});

		// A network of edges for the A* algorithm
		utils.loader.load('Models/Terrain/paths.js', function(geo) {
			sample.paths = geo;

			for(var vertex = 0; vertex < geo.vertices.length; vertex++) {
				for(var i = 0; i < geo.edges[vertex].length; i++) {

					display.draw.objects.push([
						geo.vertices[vertex].position.clone().setY(10),
						geo.vertices[geo.edges[vertex][i]].position.clone().setY(10)
					]);

					// var line = new THREE.Geometry();

					// line.vertices.push(new THREE.Vertex(geo.vertices[vertex].position.clone().setY(10))));
					// line.vertices.push(new THREE.Vertex(geo.vertices[geo.edges[vertex][i]].position.clone().setY(10))));

					// line = new THREE.Line(line);
					// sample.add(line);
				}
			}
		});

		utils.loader.load('Models/Grid.js', function(geo) {
			var temp = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
			temp.material.color.setHex(0x999999);
			temp.class = 'grid'
			temp.position.x = 0;
			temp.position.y = 5;
			temp.position.z = 0;

			sample.add(temp);
		});

		this.sample = sample;
	};

	var misc = new function misc() {
		this.drawBox = function(a) {
			var box = new THREE.Mesh(new THREE.CubeGeometry(3, 3, 3), new THREE.MeshBasicMaterial({ color: 0x000000 }));
			box.position = a.clone();
			scene.sample.add(box);
		};

		this.drawLine = function(a, b) {
			var line = new THREE.Geometry();

			line.vertices.push(new THREE.Vertex(a));
			line.vertices.push(new THREE.Vertex(b));

			scene.sample.add(new THREE.Line(line));
		};

		this.intersectLineSegment = function(a, b) {
			var distance = a.distanceTo(b);
			var ray = new THREE.Ray(a, a.clone().subSelf(b).normalize().negate());
			var intersects = ray.intersectObject(scene.sample.blocker);
			var between = false;


			for(var i = 0; i < intersects.length; i++) {
				// this.drawLine(a.clone().setY(10), b.clone().setY(10));
				// this.drawBox(intersects[i].point.clone().setY(10));

				

				if(a.distanceTo(intersects[i].point) < distance) {
					//console.log([a.distanceTo(intersects[i].point), distance])
					between = true;
				}
			}

			return between;
		};
	};

	var commands = new function commands() {
		this.move = function(e, destination) {
			for(var index = 0; index < selection.list.length; index++) {
				var object = selection.list[index];

				if(object.route) {
					// Replace current route unless adding to the current selection
					if(!keysPressed[settings.keys.add]) {
						object.route = [];
					}

					var begin = object.route[object.route.length - 1] || object.groundPosition;
					display.draw.objects.push(begin);



					// [Vertex, parent, f], ...
					var openList = [];

					// [Vertex, parent], ...
					var closedList = [];

					function getF(point) {
						return begin.distanceTo(point) + point.distanceTo(destination);
					}

					// Form connections between 'begin' and the other nodes
					for(var j = 0; j < scene.sample.paths.vertices.length; j++) {
						var vertex = scene.sample.paths.vertices[j];

						// If there is no obstruction between 'begin' and this node
						if(!misc.intersectLineSegment(begin.clone(), vertex.position.clone())) {
							// console.log(':D');

							openList.push([j, false, getF(vertex.position)]);
							// display.draw.objects.push(vertex.position);
						}
					}

					// return;

					// var maxIterations = 1;
					// var currentIt = 0;

					// // Main loop
					// while(currentIt < maxIterations && openList.length > 0) {
					// 	currentIt++;

					// 	// Find the node with the lowest f
					// 	var lowest = undefined;
					// 	for(var j = 0; j < openList.length; j++) {
					// 		if(!lowest || openList[j][2] < lowest[1]) {

					// 			// [Vertex, parent, f, index]
					// 			lowest = openList[j];
					// 			lowest.push(j);
					// 		}
					// 	}

					// 	// Remove the node with the lowest f from the open list
					// 	openList.splice(lowest[3], 1);

					// 	// And add it to the closed list
					// 	closedList.push([lowest[0], lowest[1]]);

					// 	// For every connected node to the most recently added
					// 	for(var index = 0; index < scene.sample.paths.edges[lowest[0]].length; index++) {
					// 		var id = scene.sample.paths.edges[lowest[0]][index];

					// 		console.log(scene.sample.paths.nodes[id]);

					// 		misc.drawBox(scene.sample.paths.nodes[id]);
					// 	}

					// 	//console.log(scene.sample.paths);


					// 	console.log("----------------------");

					// // 	var ray = new THREE.Ray(
					// // 		closedList[closedList.length - 1][0],
					// // 		closedList[closedList.length - 1][0].position.clone().subSelf(destination).normalize()
					// // 	);

					// 	// If there is no object between this and the destination
					// 	if(ray.intersectObject(scene.sample.blocker).length === 0) {
					// 		console.log('break');

					// 		closedList.push([destination, closedList[closedList.length - 1]]);
					// 		break;
					// 	}

					// 	// For v in all of the connected vertices of the new node
					// 	for(var v in scene.sample.paths.connections[closedList[closedList.length - 1][0].id]) {
							
					// 		// If this vertex is not in openList
					// 		if(openList.indexOf(v) === -1) {
					// 			var f = begin.distanceTo(v.position) + v.position.distanceTo(destination);

					// 			openList.push([v, f]);
					// 		}
					// 	}
					// }
					
					if(object.route.length === 1) {
						object.movementVector = destination.clone().subSelf(object.groundPosition).normalize();
					}
				}
			}
		}
	};

	// Selected units/buildings
	var selection = new function selection() {
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
			if(!this.drag) {
				$('#container').append('<div class="select"></div>');
				this.drag = new Object();
				this.drag.element = $('.select');
				this.drag.startX = e.clientX;
				this.drag.startY = e.clientY;
			}	
		}

		this.updateDrag = function(e) {
			if(this.drag) {
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
		}

		this.endDrag = function() {
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
				closestClick = [undefined, undefined];

			// For each object in the scene
			for(var index = 0; index < scene.sample.__objects.length; index++) {
				var object = scene.sample.__objects[index];

				if(object.selectable) {

					// Get the object's center on the screen
					var center = display.projector.projectVector(
						new THREE.Vector3(
							object.position.x, 
							object.position.y,
							object.position.z
						), 
						display.camera
					);
					center.y = -center.y; // Invert y or it doesn't work properly

					if(click) {
						 // Distance from click to object
						var distance = Math.sqrt(
							Math.abs(e.clientX - ((center.x + 1) / 2 * window.innerWidth)^2) + 
							Math.abs(e.clientY - ((center.y + 1) / 2 * window.innerHeight)^2)
						);

						// Account for other variables like unit size and camera zoom
						distance = (distance - object.radius) * (display.camera.position.distanceTo(object.position));

						console.log(distance);

						// If there are not any other potential selected objects
						if(!closestClick[1]) {
							
							// And this one is in the clickThreshold
							if(distance < settings.selectThreshold) {
								closestClick = [object, distance]
							}

						} else if(distance < closestClick[1]) {
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
	var camera = new function camera() {
		this.addViewRotation = function(across, up) {
			// Add rotation around pivot
			display.camera.view.y += across * settings.rotSen;
			display.camera.view.z -= up * settings.rotSen;
		};

		this.moveView = function(leftAmount, upAmount) {
			// Get vector for moving up/left
			var up = new THREE.Vector3(Math.cos(display.camera.view.y - Math.PI / 2), 0, -Math.sin(display.camera.view.y - Math.PI / 2)),
				left = new THREE.Vector3(Math.cos(display.camera.view.y), 0, -Math.sin(display.camera.view.y));

			// Multiply up/left vectors by the difference in mouse movement
			display.camera.pivot.subSelf(up.multiplyScalar(upAmount * settings.panSen * display.camera.distance));
			display.camera.pivot.subSelf(left.multiplyScalar(leftAmount * settings.panSen * display.camera.distance));
		};

		this.addZoom = function(difference) {
			display.camera.distance += difference * settings.scrollSen;

			// Vertical movement
			display.camera.view.z += difference * 0.005 * settings.scrollSen;
		};

		this.updatePosition = function() {
			if(keysPressed[settings.keys.camera.forward]) {
				this.moveView(0, settings.panKeySen);
			}
			if(keysPressed[settings.keys.camera.backward]) {
				this.moveView(0, -settings.panKeySen);
			}
			if(keysPressed[settings.keys.camera.left]) {
				this.moveView(settings.panKeySen, 0);
			}
			if(keysPressed[settings.keys.camera.right]) {
				this.moveView(-settings.panKeySen, 0);
			}
		};

		this.updateRotation = function() {
			if(keysPressed[settings.keys.camera.rotateLeft]) {
				this.addViewRotation(-settings.rotKeySen, 0);
			}
			if(keysPressed[settings.keys.camera.rotateRight]) {
				this.addViewRotation(settings.rotKeySen, 0);
			}
			if(keysPressed[settings.keys.camera.zoomIn]) {
				this.addZoom(-settings.scrollKeySen);
			}
			if(keysPressed[settings.keys.camera.zoomOut]) {
				this.addZoom(settings.scrollKeySen);
			}

			if(display.camera.view.z > 1.7) { display.camera.view.z = 1.7; }
			if(display.camera.view.z < 0.2) { display.camera.view.z = 0.2; }

			if(display.camera.distance < 200) { display.camera.distance = 200; }
			if(display.camera.distance > 500) { display.camera.distance = 500; }

			display.camera.position.x = display.camera.pivot.x + (Math.sin(display.camera.view.y) * display.camera.distance);
			display.camera.position.y = display.camera.pivot.y + (Math.sin(display.camera.view.z) * display.camera.distance);
			display.camera.position.z = display.camera.pivot.z + (Math.cos(display.camera.view.y) * display.camera.distance);

			display.camera.lookAt(display.camera.pivot);
		};
	};

	// Bind camera to keystrokes
	(function keystrokes() {
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

					var point = display.projector.unprojectVector(new THREE.Vector3(x, -y, 0.5), display.camera);
					var ray = new THREE.Ray(display.camera.position, point.subSelf(display.camera.position).normalize());

					var intersect = ray.intersectObject(scene.sample.clickCatcher);

					if(intersect.length > 0) {
						commands.move(e, intersect[0].point);
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

		// Disable right clicking
		document.oncontextmenu = function(e) {
			return false;
		}

		document.onmousemove = function(e) {
			mouseVars.toUpdate = true;

			mouseVars.clientX = e.clientX;
			mouseVars.clientY = e.clientY;
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

				mouseVars.toUpdate = true;
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
	(function main() {
		(function renderLoop() {

			for(var index = 0; index < scene.sample.__objects.length; index++) {
				var object = scene.sample.__objects[index];

				// Movement
				if(object.route && object.speed && object.route.length > 0) {
					var nextCheckpoint = object.route[0];

					if(object.groundPosition.distanceTo(nextCheckpoint) < 2) {
						object.route.shift();

						if(object.route.length > 0) {
							object.movementVector = object.route[0].clone().subSelf(object.groundPosition).normalize();
						}
					}
					object.groundPosition.addSelf(object.movementVector);
				}

				// Specifics for different units
				switch(object.class) {
					case 'temp':
						scene.sample.remove(object);
						break;

					case 'unit':
						object.position = object.groundPosition.clone().addSelf(object.offset);
				}
			}

			// Happens only if the mouse moved since the last frame
			if(mouseVars.toUpdate) {
				if(mouseVars.down) {

					// Pan screen
					if(keysPressed[settings.keys.camera.panMouse]) {
						selection.endDrag();
						
						// Find difference between this frame and last frame
						var x = ((mouseVars.clientX / window.innerWidth) * 2 - 1) - ((mouseVars.lastX / window.innerWidth) * 2 - 1),
							y =  ((mouseVars.clientY / window.innerHeight) * 2 - 1) - ((mouseVars.lastY / window.innerHeight) * 2 - 1);

						// Translate the camera accordingly
						camera.moveView(x * display.camera.aspect, y);

					// Rotate Screen
					} else if(keysPressed[settings.keys.camera.rotateMouse]) {
						selection.endDrag();

						// Rotate for left and right movement
						camera.addViewRotation(mouseVars.lastX - mouseVars.clientX, 0);
						
						// Zoom for up and down movement
						camera.addZoom((mouseVars.clientY - mouseVars.lastY) / settings.scrollSen * settings.rotSen * 200);	

					} else {
						// Update selection box
						selection.updateDrag(mouseVars);
					}
				}
				mouseVars.lastX = mouseVars.clientX;
				mouseVars.lastY = mouseVars.clientY;

				mouseVars.toUpdate = false;
			}

			camera.updatePosition();
			camera.updateRotation();  

			utils.stats.update();
			display.renderer.render(scene.sample, display.camera);

			display.draw.update();

			requestAnimationFrame(renderLoop);
		})();
	})();
})();