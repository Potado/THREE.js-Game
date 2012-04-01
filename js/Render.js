var container = $('#container');

$('#settingsToggle').click(function() {
	$('#settingsOptions').slideToggle();
});


//////////////////////////////////////////
// Performance Monitor

var stats = new Stats();

//Top left of parent element
stats.getDomElement().style.position = 'absolute';
stats.getDomElement().style.left = '0px';
stats.getDomElement().style.top = '0px';

container.append(stats.getDomElement());


//////////////////////////////////////////
// Setup camera and renderer and such

var width = window.innerWidth, 
	height = window.innerHeight - 5,
	viewAngle = 45, 
	aspect = width / height, 
	near = 0.1,
	far = 10000;


var renderer = new THREE.WebGLRenderer(),
	camera = new THREE.PerspectiveCamera(
		viewAngle,
		aspect,
		near,
		far
	),
	scene = new THREE.Scene();

camera.position.x = 70;
camera.position.y = -80;
camera.position.z = 130;

camera.rotation.z = 0.63;
camera.rotation.x = 0.6;
camera.rotation.y = 0.4;


renderer.setSize(width, height);
container.append(renderer.domElement);

$(window).resize(function() {
	var width = window.innerWidth,
		height = window.innerHeight - 5;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
});

//////////////////////////////////////////
// Add a simple mesh

var cubeMaterial = new THREE.MeshLambertMaterial(
{
    color: 0xCC0000
});


var cube = new THREE.Mesh(
  	new THREE.CubeGeometry(
   		50, 
   		50, 
   		50,
   		1,
   		1,
   		1
   	),
   	cubeMaterial
);

cube.rotation.x = 50;
cube.rotation.y = 50;
cube.rotation.z = 50;

var pointLight = new THREE.PointLight(0xFFFFFF);

pointLight.position.x = 10;
pointLight.position.y = 20;
pointLight.position.z = 200;


scene.add(cube);
scene.add(pointLight);

//////////////////////////////////////////
// Animation

var framerate, time, frameTime, currentTime, delta;

var spincube = $('#spincube'),
	fps = $('#fps');

fps.change(function(){
	$('#settingsOptions').append(fps.val())
	framerate = 1000 / parseInt(fps.val());
});

framerate = 1000 / 60;

frameTime = new Date().getTime();

(function animloop() {
	currentTime = new Date().getTime();
	delta = currentTime - frameTime;
	frameTime = currentTime;

	if(spincube.attr('checked')) {
		cube.rotation.z += 0.001 * delta;
	}

	stats.update();
	renderer.render(scene, camera);
	window.setTimeout(animloop, framerate);
})();