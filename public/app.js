const canvas = document.getElementById('renderCanvas');
checkOpengl(canvas);
//const engine = new BABYLON.Engine(canvas, true);
var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
//engine.setHardwareScalingLevel(5);

const infoOverlay = document.getElementById('infoOverlay');
const fpsElement = document.getElementById('fps');
const trianglesElement = document.getElementById('triangles');
const showWireframeBtn = document.getElementById('showWireframeBtn');
var infoDiv = document.getElementById("info");
var wireframeMode = false;
var boxes = []
var debug = false;
var numberBoxes = 100;



var scene = createScene();
var player = loadPlayer(scene);

createCannon(scene);
var camera = createCamera(scene);

createLights(scene);
createFloor(scene);
createWalls(scene);
manageEvent(scene);   
createObjects(scene);
   
   // Crear un GUI para mostrar el FPS
	var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

	var fpsText = new BABYLON.GUI.TextBlock();
	fpsText.text = "FPS: 0";
	fpsText.color = "white";
	fpsText.fontSize = 24;
	//fpsText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
	//fpsText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
	fpsText.top = "10px";
	fpsText.right = "10px";

	advancedTexture.addControl(fpsText);
	
	// Actualizar el texto de FPS
	scene.onAfterRenderObservable.add(function () {
		fpsText.text = "FPS: " + Math.round(engine.getFps());
	});
   
engine.runRenderLoop(() => {
	scene.render();
	detectCollisions(scene);
	
});

window.addEventListener('resize', () => {
	engine.resize();
});

//scene.debugLayer.show();




function createScene(){
	let scene = new BABYLON.Scene(engine);	

	return scene;
}

function createCannon(scene){
	const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.CannonJSPlugin();
	scene.checkCollisions = true;
	scene.enablePhysics(gravityVector, physicsPlugin);
}


function loadPlayer(scene) {
    /*let player = BABYLON.SceneLoader.ImportMesh("", "assets/character/", "character.glb", scene, function (meshes) {
        player = meshes[0]; // Asume que el primer mesh es el cuerpo principal del personaje
        player.position = new BABYLON.Vector3(0, 0, 0); // Ajusta la posición inicial del personaje
        player.scaling = new BABYLON.Vector3(1, 1, 1); // Ajusta el tamaño del personaje
        player.checkCollisions = true; // Activa colisiones para el personaje
        player.ellipsoid = new BABYLON.Vector3(1, 1, 1); // Ajusta el elipsoide de colisión
        player.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0); // Ajusta el offset del elipsoide
        player.physicsImpostor = new BABYLON.PhysicsImpostor(player, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0 }, scene);
    });*/


	BABYLON.SceneLoader.ImportMesh("","assets/character/", "animation.glb", scene, function (meshes, particleSystems, skeletons) {
		const character = meshes[0]; // Asumiendo que el primer mesh es el personaje principal
		character.position = new BABYLON.Vector3(0, 0, 0);
	
		const skeleton = skeletons[0];
	
		// Reproducir todas las animaciones
		scene.beginAnimation(skeleton, 0, skeleton.animationRanges[0].to, true);
	});

	let player;
	return player;
}

function createCamera(scene){
	

	const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 1.5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    camera.checkCollisions = true;
    camera.applyGravity = true;
	camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    camera.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
	


    return camera;

}

function createBoxCamera(camera){
	let cameraBox = BABYLON.MeshBuilder.CreateBox('cameraBox', { height: 2, width: 2, depth: 2 }, scene);
	cameraBox.isVisible = false;
	cameraBox.position = camera.position.clone();
	cameraBox.physicsImpostor = new BABYLON.PhysicsImpostor(cameraBox, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1, restitution: 0 }, scene);
	return cameraBox;
}

function createLights(scene){
	// Añadir luz a la escena
	var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
	light.intensity = 0.7;
}

function createFloor(scene){
	var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 500, height: 500}, scene);
	var groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
	var groundTexture = new BABYLON.Texture('assets/suelo/suelo.jpg', scene);
	groundTexture.uScale = 200; // Repetir la textura en el eje U
	groundTexture.vScale = 200; // Repetir la textura en el eje V
	groundMaterial.diffuseTexture = groundTexture;
	ground.material = groundMaterial;
	ground.checkCollisions = true;
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);
	

}

function createWalls(scene){
	const wallHeight = 5;
	const wallThickness = 0.5;
	const wallPositions = [
		{ position: new BABYLON.Vector3(0, wallHeight / 2, -25), rotation: 0 }, // Pared trasera
		{ position: new BABYLON.Vector3(0, wallHeight / 2, 25), rotation: 0 },  // Pared delantera
		{ position: new BABYLON.Vector3(-25, wallHeight / 2, 0), rotation: Math.PI / 2 }, // Pared izquierda
		{ position: new BABYLON.Vector3(25, wallHeight / 2, 0), rotation: Math.PI / 2 }   // Pared derecha
	];
	var wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
	const wallTexture = new BABYLON.Texture('assets/pared/pared.jpg', scene);
	const wallNormalTexture = new BABYLON.Texture('assets/pared/normal.jpg', scene); // Tu normal map o bump map

	let i = 0;
	wallPositions.forEach(wallPos => {
		let wall = BABYLON.MeshBuilder.CreateBox('wall'+(i++), { height: wallHeight, width: 50, depth: wallThickness }, scene);
		wall.position = wallPos.position;
		wall.rotation.y = wallPos.rotation;
		wall.material = wallMaterial;
		
		
		wallTexture.uScale = 5; // Repetir la textura en el eje U
		wallTexture.vScale = 3; // Repetir la textura en el eje V
		wallMaterial.diffuseTexture = wallTexture;
		wallMaterial.bumpTexture = wallNormalTexture;
		wall.material = wallMaterial;
		 // Activar colisiones para las paredes
		wall.checkCollisions = true;
		wall.physicsImpostor = new BABYLON.PhysicsImpostor(wall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
	  
	});
}

function manageEvent(scene){
	let speed = 0.05;
    let inputMap = {};

    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key.toLowerCase()] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key.toLowerCase()] = evt.sourceEvent.type == "keydown";
    }));

    canvas.addEventListener("click", function () {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
        canvas.requestPointerLock();
    }, false);

    document.addEventListener("pointerlockchange", lockChangeAlert, false);
    document.addEventListener("mozpointerlockchange", lockChangeAlert, false);
    document.addEventListener("webkitpointerlockchange", lockChangeAlert, false);

    function lockChangeAlert() {
        if (document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas ||
            document.webkitPointerLockElement === canvas) {
            document.addEventListener("mousemove", updateCameraRotation, false);
        } else {
            document.removeEventListener("mousemove", updateCameraRotation, false);
        }
    }

    function updateCameraRotation(event) {
        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        camera.rotation.y += movementX * 0.001;
        camera.rotation.x += movementY * 0.001;

        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }

    scene.onBeforeRenderObservable.add(function () {
		var currentSpeed = speed;
		if (inputMap["shift"]) {
			currentSpeed *= 2; // Aumentar la velocidad si se presiona Shift
		}
        var forward = new BABYLON.Vector3(
            Math.sin(camera.rotation.y),
            0,
            Math.cos(camera.rotation.y)
        );

        var right = new BABYLON.Vector3(
            Math.sin(camera.rotation.y + Math.PI / 2),
            0,
            Math.cos(camera.rotation.y + Math.PI / 2)
        );
		
        var movement = new BABYLON.Vector3(0, 0, 0);

        if (inputMap["w"]) {
            movement.addInPlace(forward.scale(currentSpeed));
        }
        if (inputMap["s"]) {
            movement.addInPlace(forward.scale(-currentSpeed));
        }
        if (inputMap["a"]) {
            movement.addInPlace(right.scale(-currentSpeed));
        }
        if (inputMap["d"]) {
            movement.addInPlace(right.scale(currentSpeed));
        }

        // Mover la cámara manualmente
        camera.position.addInPlace(movement);

        // Comprobar colisiones manualmente
		var colliding = false;
		
        scene.meshes.forEach(function (mesh) {
		
            if (mesh !== camera) {
                var boundingBox = mesh.getBoundingInfo().boundingBox;
                var distance = camera.position.subtract(mesh.position).length();
                if (distance < camera.ellipsoid.x) {
                    colliding = true;
                }
            }
        });

        // Si está colisionando, revertir el movimiento
        if (colliding) {
            camera.position.subtractInPlace(movement);
        }
    });
}


function createObjects(scene){
	BABYLON.SceneLoader.Append("assets/cubo/", "cubo1.glb", scene, function (mesh) {
		// The mesh will be loaded and added to the scene
		console.log(mesh);
	}, null, function (scene, message) {
		console.error(message);
	});



	const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 2, segments: 16}, scene);
	sphere.position.y = 10;
	const sphereMaterial = new BABYLON.StandardMaterial('sphereMaterial', scene);
	sphereMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
	sphere.material = sphereMaterial;
	sphere.checkCollisions = true;
	sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.5 }, scene);
	

	let box = BABYLON.MeshBuilder.CreateBox('box', { height:1, width: 1, depth: 1 }, scene);
	box.position.x = 5;
	box.position.y = 2;
	box.position.z = 5;
	const boxMat = new BABYLON.StandardMaterial('boxMat', scene);
	boxMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
	box.material = boxMat;
	box.checkCollisions = true;

	box.physicsImpostor = new BABYLON.PhysicsImpostor(
		box, 
		BABYLON.PhysicsImpostor.BoxImpostor, 
		{
			mass: 0, 
			restitution: 0.9, 
			nativeOptions: { halfExtents: new BABYLON.Vector3(1,1,1) } // Ajustar halfExtents si es necesario
		}, 
		scene
	);

}

function checkOpengl(canvas){
	if (debug){
		var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		console.log(gl);
		if (gl) {
			var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
			if (debugInfo) {
				var vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
				var renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
				console.log('GPU Vendor: ' + vendor);
				console.log('GPU Renderer: ' + renderer);
			} else {
				console.log('WEBGL_debug_renderer_info not supported');
			}
		} else {
			console.log('WebGL not supported');
		}
	}
		
}

function detectCollisions(scene) {
	var collidedMesh = null;

	// Crear un rayo desde la cámara hacia adelante	
	var forwardRay = new BABYLON.Ray(camera.position, camera.getForwardRay().direction, 5);
	

	infoDiv.innerHTML = `Info div: ${camera.getForwardRay().direction}<br/>`;
	let distanciaCercana = 10000;
	// Verificar intersección con cada malla en la escena
	for (var i = 0; i < scene.meshes.length; i++) {
		var mesh = scene.meshes[i];
		
		if (mesh !== camera && mesh.checkCollisions) {
			var pickInfo = forwardRay.intersectsMesh(mesh);

			if (pickInfo.hit && distanciaCercana>pickInfo.distance) {
				collidedMesh = mesh;
			}
		}
	}

	// Mostrar información de colisión
	
	if (collidedMesh) {
		infoDiv.innerHTML += `
			Colisión detectada!<br>
			Malla: ${collidedMesh.name}<br>
			Posición de la malla: ${collidedMesh.position}<br>
			Posición de la cámara: ${camera.position}
		`;
	}
}
