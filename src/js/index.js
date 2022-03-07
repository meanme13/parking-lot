import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { PositionalAudioHelper } from 'three/examples/jsm/helpers/PositionalAudioHelper.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

import { AmmoPhysics, PhysicsLoader } from '@enable3d/ammo-physics'

import gsap from 'gsap'

let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false
let loaded = false
let lightmaps = []
let mixers = []
let intersected

let canvas, blocker, audioElement, loaderPercent, loaderBar, interactText
let levelCollision, doorCollision, cageCollision, laptopCollision, foxCollision, leverCollision, button1Collision, button2Collision, button3Collision
let scene, camera, renderer, controls, mixer, mixer1, mixer2, listener, pmremGenerator, musicLocator, positionalAudio, audioContext, biquadFilter, cameraRaycaster, playerRaycaster
let physics, clock, player, door, hiddenDoor, doorOpened = false, discoBall, doorHoverText = 'OPEN DOOR'
let torchBillboards = [], torchMaterial, torchAnimator, fireplaceMaterial, fireplaceAnimator, emissiveMaterial, emissiveFloorMaterial, bubblesMaterial
let zuckerberg, buterin, baby1, baby2, baby3, baby4
let zuckerbergLocator, buterinLocator, baby1Locator, baby2Locator, baby3Locator, baby4Locator
let reflectionProbe, reflectionProbe1, reflectionProbe2, reflectionProbe3

const MainScene = () =>
{
    init()
    update()
}

PhysicsLoader('./js/ammo', () => MainScene())

function init()
{
    canvas = document.getElementById('canvas')
    blocker = document.getElementById('blocker')
    audioElement = document.getElementById('music')
    loaderPercent = document.getElementById('loader__percent')
    loaderBar = document.getElementById('loader__bar')
    interactText = document.getElementById('interact__text')

    clock = new THREE.Clock()

    cameraRaycaster = new THREE.Raycaster()
    cameraRaycaster.far = 4
    cameraRaycaster.layers.set(0)

    playerRaycaster = new THREE.Raycaster()
    playerRaycaster.layers.set(0)

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    //renderer.outputEncoding = THREE.sRGBEncoding
    //renderer.gammaFactor = 2.2;
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    //renderer.toneMappingExposure = 0.3

    scene = new THREE.Scene()

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(-5, 0.8, -31.5)
    camera.rotation.set(0, -Math.PI / 2, 0)
    camera.layers.enable(1)

    controls = new PointerLockControls(camera, renderer.domElement)

    physics = new AmmoPhysics(scene)
    //physics.debug.enable(true)

    listener = new THREE.AudioListener()
    camera.add(listener)

    positionalAudio = new THREE.PositionalAudio(listener)
    positionalAudio.setMediaElementSource(audioElement)
    positionalAudio.setRefDistance(10)
    positionalAudio.setRolloffFactor(2)
    positionalAudio.setDistanceModel('exponential')
    positionalAudio.setDirectionalCone(180, 360, 0.2)

    audioContext = positionalAudio.context

    biquadFilter = audioContext.createBiquadFilter()
    biquadFilter.type = 'lowpass'
    biquadFilter.frequency.setValueAtTime(200, audioContext.currentTime)

    positionalAudio.setFilter(biquadFilter)
    positionalAudio.setVolume(0.5)

    pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    //const helper = new PositionalAudioHelper(positionalAudio, 10)
    //positionalAudio.add(helper)

    loadResources()
}

function loadResources()
{
    const loadingManager = new THREE.LoadingManager()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderConfig({ type: 'js' })
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/')
    const rgbeLoader = new RGBELoader(loadingManager)
    const exrLoader = new EXRLoader(loadingManager)
    const gltfLoader = new GLTFLoader(loadingManager)

    rgbeLoader.load('./images/1_final.hdr', (texture) =>
    {
        texture.flipY = false

        lightmaps[0] = texture
    })

    rgbeLoader.load('./images/2_final.hdr', (texture) =>
    {
        texture.flipY = false

        lightmaps[1] = texture
    })

    exrLoader.load('./images/kloppenheim_02_4k.exr', (texture) =>
    {
        texture.mapping = THREE.EquirectangularReflectionMapping
        scene.background = texture
    })

    exrLoader.load('./images/ReflectionProbe.exr', (texture) =>
    {
        reflectionProbe = pmremGenerator.fromEquirectangular(texture)
        pmremGenerator.dispose()
    })

    exrLoader.load('./images/ReflectionProbe1.exr', (texture) =>
    {
        reflectionProbe1 = pmremGenerator.fromEquirectangular(texture)
        pmremGenerator.dispose()
    })

    exrLoader.load('./images/ReflectionProbe2.exr', (texture) =>
    {
        reflectionProbe2 = pmremGenerator.fromEquirectangular(texture)
        pmremGenerator.dispose()
    })

    exrLoader.load('./images/ReflectionProbe3.exr', (texture) =>
    {
        reflectionProbe3 = pmremGenerator.fromEquirectangular(texture)
        pmremGenerator.dispose()
    })

    gltfLoader.setDRACOLoader(dracoLoader)
    gltfLoader.load('./models/Parking.glb', (gltf) =>
    {
        scene.add(gltf.scene)
        scene.animations = gltf.animations
        scene.traverse((child) =>
        {
            if (!child.name.includes('COLLISION'))
            {
                child.layers.set(1)
            }
        })
        console.log(scene)
    })

    gltfLoader.load('./models/Zuckerberg.glb', (gltf) =>
    {
        zuckerberg = SkeletonUtils.clone(gltf.scene)
        zuckerberg.traverse((child) =>
        {
            if (child.isMesh)
            {
                child.frustumCulled = false
                child.material.map.encoding = THREE.LinearEncoding
                child.material.envMap = reflectionProbe3.texture
            }
            child.layers.set(1)
        })

        mixer1 = new THREE.AnimationMixer(zuckerberg)
        mixer1.clipAction(gltf.animations[0]).play()

        scene.add(zuckerberg)

    })

    gltfLoader.load('./models/Buterin.glb', (gltf) =>
    {
        buterin = SkeletonUtils.clone(gltf.scene)
        buterin.traverse((child) =>
        {
            if (child.isMesh)
            {
                child.material.map.encoding = THREE.LinearEncoding
                child.material.envMap = reflectionProbe.texture
                child.material.envMapIntensity = 2
            }
            child.layers.set(1)
        })

        mixer2 = new THREE.AnimationMixer(buterin)
        mixer2.clipAction(gltf.animations[0]).play()

        scene.add(buterin)
    })

    gltfLoader.load('./models/Baby.glb', (gltf) =>
    {
        baby1 = SkeletonUtils.clone(gltf.scene)
        baby2 = SkeletonUtils.clone(gltf.scene)
        baby3 = SkeletonUtils.clone(gltf.scene)
        baby4 = SkeletonUtils.clone(gltf.scene)

        const mixer1 = new THREE.AnimationMixer(baby1)
        const mixer2 = new THREE.AnimationMixer(baby2)
        const mixer3 = new THREE.AnimationMixer(baby3)
        const mixer4 = new THREE.AnimationMixer(baby4)

        const action = mixer1.clipAction(gltf.animations[2])
        action.timeScale = 0.25
        action.play()

        mixer2.clipAction(gltf.animations[1]).play()
        mixer3.clipAction(gltf.animations[0]).play()
        mixer4.clipAction(gltf.animations[0]).play()

        scene.add(baby1, baby2, baby3, baby4)
        mixers.push(mixer1, mixer2, mixer3, mixer4)
    })

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) =>
    {
        let progress = itemsLoaded / itemsTotal * 100
        loaderPercent.innerHTML = Math.floor(progress) + '%'
        loaderBar.style.width = progress + '%'
    }

    loadingManager.onLoad = () =>
    {
        loaded = true

        gsap.to('#blocker', { backgroundColor: '#07070999', delay: 0.5, duration: 0.5 })
        gsap.fromTo('#loader', { autoAlpha: 1 }, { autoAlpha: 0, delay: 0.5, duration: 0.5 })
        gsap.fromTo('.instructions', { autoAlpha: 0 }, { autoAlpha: 1, delay: 0.5, duration: 0.5 })
        gsap.fromTo('.keymapping', { autoAlpha: 0 }, { autoAlpha: 1, delay: 0.5, duration: 0.5 })
        gsap.to('.instructions__title', { opacity: 0.2, delay: 1, duration: 1, ease: 'power1.in', repeat: -1, yoyo: true })

        mixer = new THREE.AnimationMixer(scene)

        scene.traverse((child) =>
        {
            traverseBaby(baby1, reflectionProbe2)
            traverseBaby(baby2, reflectionProbe1)
            traverseBaby(baby3, reflectionProbe)
            traverseBaby(baby4, reflectionProbe)
            /*             if (child.name !== 'Player' || !child.name.includes('COLLISION'))
                        {
                            child.matrixAutoUpdate = false
                        } */

            if (child.isMesh)
            {
                if (child.material)
                {
                    if (child.material.name === 'MAT_default')
                    {
                        child.material.lightMap = lightmaps[1]
                    }
                    else if (child.material.name !== 'MAT_floor' && child.material.name !== 'MAT_glass')
                    {
                        child.material.lightMap = lightmaps[0]
                    }
                    /*                 if (child.name.includes('_l1'))
                                    {
                                        child.material.lightMap = lightmaps[0]
                                    }
                                    else
                                    {
                                        child.material.lightMap = lightmaps[1]
                                    } */

                    if (child.material.name === 'MAT_emission')
                    {
                        emissiveMaterial = child.material
                        emissiveMaterial.emissiveIntensity = 2
                    }

                    if (child.material.name === 'MAT_floor')
                    {
                        emissiveFloorMaterial = child.material
                        emissiveFloorMaterial.emissiveIntensity = 2
                        changeMaterialOffset()
                    }

                    if (child.material.name === 'MAT_discoball')
                    {
                        child.material.envMap = reflectionProbe.texture
                    }

                    if (child.material.name === 'MAT_glass')
                    {
                        child.material = new THREE.MeshPhysicalMaterial({
                            lightMap: lightmaps[1],
                            roughness: 0,
                            transmission: 1,
                            thickness: 0.1,
                            envMap: reflectionProbe2.texture
                        })
                    }

                    if (child.material.name === 'MAT_bubbles')
                    {
                        bubblesMaterial = child.material
                        bubblesMaterial.lightMap = lightmaps[1]
                    }

                    child.material.lightMapIntensity = 1.5
                }

                if (child.name.includes('BILLBOARD_torch'))
                {
                    torchBillboards.push(child)
                    torchMaterial = child.material
                    torchMaterial.emissiveIntensity = 10
                }

                if (child.name.includes('BILLBOARD_fireplace'))
                {
                    fireplaceMaterial = child.material
                    fireplaceMaterial.emissiveIntensity = 10
                }
            }
        })

        torchAnimator = new TextureAnimator(torchMaterial.emissiveMap, 6, 6, 36, 50)
        fireplaceAnimator = new TextureAnimator(fireplaceMaterial.emissiveMap, 8, 8, 64, 50)

        door = scene.getObjectByName('MESH_door')
        levelCollision = scene.getObjectByName('COLLISION_level')
        doorCollision = scene.getObjectByName('COLLISION_door')
        cageCollision = scene.getObjectByName('COLLISION_cage')
        laptopCollision = scene.getObjectByName('COLLISION_laptop')
        foxCollision = scene.getObjectByName('COLLISION_fox')
        leverCollision = scene.getObjectByName('COLLISION_lever')
        hiddenDoor = scene.getObjectByName('MESH_hiddenDoor')
        button1Collision = scene.getObjectByName('COLLISION_button_01')
        button2Collision = scene.getObjectByName('COLLISION_button_02')
        button3Collision = scene.getObjectByName('COLLISION_button_03')
        player = scene.getObjectByName('Player')

        musicLocator = scene.getObjectByName('LOCATOR_music')
        zuckerbergLocator = scene.getObjectByName('LOCATOR_zuckerberg')
        buterinLocator = scene.getObjectByName('LOCATOR_buterin')
        baby1Locator = scene.getObjectByName('LOCATOR_baby_01')
        baby2Locator = scene.getObjectByName('LOCATOR_baby_02')
        baby3Locator = scene.getObjectByName('LOCATOR_baby_03')
        baby4Locator = scene.getObjectByName('LOCATOR_baby_04')

        discoBall = scene.getObjectByName('MESH_discoball')

        physics.add.existing(levelCollision, { shape: 'concave', mass: 0 })
        levelCollision.visible = false

        physics.add.existing(doorCollision, { shape: 'convex' })
        doorCollision.body.setCollisionFlags(2)
        doorCollision.visible = false

        physics.add.existing(cageCollision, { shape: 'convex' })
        cageCollision.body.setCollisionFlags(2)
        cageCollision.visible = false

        physics.add.existing(laptopCollision, { shape: 'convex' })
        laptopCollision.body.setCollisionFlags(2)
        laptopCollision.visible = false

        physics.add.existing(foxCollision, { shape: 'convex' })
        foxCollision.body.setCollisionFlags(2)
        foxCollision.visible = false

        physics.add.existing(leverCollision, { shape: 'convex' })
        leverCollision.body.setCollisionFlags(2)
        leverCollision.visible = false

        physics.add.existing(hiddenDoor, { shape: 'convex' })
        hiddenDoor.body.setCollisionFlags(2)

        physics.add.existing(button1Collision, { shape: 'convex' })
        button1Collision.body.setCollisionFlags(2)
        button1Collision.visible = false

        physics.add.existing(button2Collision, { shape: 'convex' })
        button2Collision.body.setCollisionFlags(2)
        button2Collision.visible = false

        physics.add.existing(button3Collision, { shape: 'convex' })
        button3Collision.body.setCollisionFlags(2)
        button3Collision.visible = false

        physics.add.existing(player, { shape: 'convex', mass: 1 })
        player.body.setFriction(0.5)
        player.body.setAngularFactor(0, 0, 0)
        player.body.setCcdMotionThreshold(1e-7)
        player.body.setCcdSweptSphereRadius(0.5)
        player.visible = false
        player.layers.set(1)

        musicLocator.add(positionalAudio)

        zuckerberg.position.copy(zuckerbergLocator.position)
        zuckerberg.rotation.copy(zuckerbergLocator.rotation)

        buterin.position.copy(buterinLocator.position)
        buterin.rotation.copy(buterinLocator.rotation)

        baby1.position.copy(baby1Locator.position)

        baby2.position.copy(baby2Locator.position)
        baby2.rotation.copy(baby2Locator.rotation)
        baby2.scale.set(1.2, 1.2, 1.2)

        baby3.position.copy(baby3Locator.position)
        baby3.rotation.copy(baby3Locator.rotation)
        baby3.scale.set(1.2, 1.2, 1.2)

        baby4.position.copy(baby4Locator.position)
        baby4.rotation.copy(baby4Locator.rotation)
        baby4.scale.set(1.2, 1.2, 1.2)
    }

    setupEvents()
}

function setupEvents()
{
    canvas.addEventListener('click', () =>
    {
        if (!loaded) return

        if (intersected && intersected.name === 'COLLISION_door')
        {
            scene.animations.forEach((animation) =>
            {
                if (animation.name === 'ANIM_door')
                {
                    const action = mixer.clipAction(animation)
                    action.clampWhenFinished = true
                    action.setLoop(THREE.LoopOnce)
                    action.setDuration(1)

                    if (doorOpened)
                    {
                        action.timeScale *= -1

                        if (player.position.x < 12.2)
                        {
                            biquadFilter.frequency.setValueAtTime(biquadFilter.frequency.value, audioContext.currentTime)
                            biquadFilter.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1)
                        }
                        interactText.innerHTML = doorHoverText = 'OPEN DOOR'
                    }
                    else
                    {
                        biquadFilter.frequency.setValueAtTime(biquadFilter.frequency.value, audioContext.currentTime)
                        biquadFilter.frequency.exponentialRampToValueAtTime(24000, audioContext.currentTime + 1)
                        interactText.innerHTML = doorHoverText = 'CLOSE DOOR'
                    }

                    action.paused = false
                    action.play()

                    doorOpened = !doorOpened
                }
            })
        }

        if (intersected && intersected.name === 'COLLISION_lever')
        {
            scene.animations.forEach((animation) =>
            {
                if (animation.name === 'ANIM_lever')
                {
                    const action = mixer.clipAction(animation)
                    action.clampWhenFinished = true
                    action.setLoop(THREE.LoopOnce)
                    action.play()
                }

                if (animation.name === 'ANIM_hiddenDoor')
                {
                    const action = mixer.clipAction(animation)
                    action.clampWhenFinished = true
                    action.setLoop(THREE.LoopOnce)
                    action.play()
                }
            })
        }

        if (intersected && intersected.name === 'COLLISION_cage')
        {
            window.open('https://www.twitter.com')
        }

        if (intersected && intersected.name === 'COLLISION_laptop')
        {
            window.open('https://www.discord.com')
        }

        if (intersected && intersected.name === 'COLLISION_fox')
        {
            // Fox onclick logic
        }

        if (intersected && intersected === button1Collision)
        {
            playButtonAnimation('ANIM_button_01')
            // Button1 onclick logic
        }

        if (intersected && intersected === button2Collision)
        {
            playButtonAnimation('ANIM_button_02')
            // Button2 onclick logic
        }

        if (intersected && intersected === button3Collision)
        {
            playButtonAnimation('ANIM_button_03')
            // Button3 onclick logic
        }
    })

    document.addEventListener('keydown', (event) =>
    {
        switch (event.code)
        {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true
                break

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true
                break

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true
                break

            case 'ArrowRight':
            case 'KeyD':
                moveRight = true
                break
        }
    })

    document.addEventListener('keyup', (event) =>
    {
        switch (event.code)
        {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false
                break

            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false
                break

            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false
                break

            case 'ArrowRight':
            case 'KeyD':
                moveRight = false
                break
        }
    })

    blocker.addEventListener('click', () =>
    {
        if (!loaded) return

        controls.lock()
        audioElement.play()
    })

    controls.addEventListener('lock', () =>
    {
        gsap.fromTo('#blocker', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 })
        listener.context.resume()
    })

    controls.addEventListener('unlock', () =>
    {
        gsap.fromTo('#blocker', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
        listener.context.suspend()
    })

    window.addEventListener('resize', onWindowResize)
}

function update()
{
    requestAnimationFrame(update)

    if (!loaded) return

    const delta = clock.getDelta()

    if (controls.isLocked === true)
    {
        // Update physics
        physics.update(delta * 1000)
        physics.updateDebugger()

        // Rotate player
        const cameraDirection = new THREE.Vector3()
        const rotation = camera.getWorldDirection(cameraDirection)
        const theta = Math.atan2(rotation.x, rotation.z)

        const rotationPlayer = player.getWorldDirection(cameraDirection)
        const thetaPlayer = Math.atan2(rotationPlayer.x, rotationPlayer.z)
        player.body.setAngularVelocityY(0)

        const l = Math.abs(theta - thetaPlayer)
        const d = Math.PI / 24

        let rotationSpeed = /* isTouchDevice ? 2 : */ 10

        if (l > d)
        {
            if (l > Math.PI - d) rotationSpeed *= -1
            if (theta < thetaPlayer) rotationSpeed *= -1

            player.body.setAngularVelocityY(rotationSpeed)
        }

        // Move player
        const speed = 5

        let x = 0, z = 0

        if (moveForward)
        {
            x += Math.sin(theta) * speed
            z += Math.cos(theta) * speed
        }
        else if (moveBackward)
        {
            x -= Math.sin(theta) * speed
            z -= Math.cos(theta) * speed
        }

        if (moveLeft)
        {
            x += Math.sin(theta + Math.PI * 0.5) * speed
            z += Math.cos(theta + Math.PI * 0.5) * speed
        }
        else if (moveRight)
        {
            x += Math.sin(theta - Math.PI * 0.5) * speed
            z += Math.cos(theta - Math.PI * 0.5) * speed
        }

        const velocity = new THREE.Vector3(x, player.body.velocity.y, z)

        // Raycast down from player position
        playerRaycaster.set(player.position, new THREE.Vector3(0, -1, 0))

        // Get ground hits
        const groundIntersects = playerRaycaster.intersectObjects(scene.children, true)

        if (groundIntersects.length > 0)
        {
            // Ground normal
            const normal = groundIntersects[0].face.normal.normalize()
            // Project player velocity on ground plane
            const projectedVelocity = velocity.projectOnPlane(normal)
            // Set player velocity
            player.body.setVelocity(projectedVelocity.x, projectedVelocity.y, projectedVelocity.z)
        }

        // Set camera position to the center of player and move up by 1 unit
        camera.position.copy(player.position.clone().add(new THREE.Vector3(0, 1, 0)))

        // Update door collider with animation
        doorCollision.rotation.copy(door.rotation)
        doorCollision.body.needUpdate = true

        // Update hidden door collider with animation
        hiddenDoor.body.needUpdate = true

        // Rotate billboards
        for (let i = 0; i < torchBillboards.length; i++)
        {
            torchBillboards[i].rotation.setFromRotationMatrix(camera.matrix)
        }

        // Update spritesheets
        torchAnimator.update(1000 * delta)
        fireplaceAnimator.update(1000 * delta)

        // Emissive material animation
        emissiveMaterial.emissiveMap.offset.x += delta / 15

        bubblesMaterial.map.offset.y += delta / 15

        // Disco ball rotation
        discoBall.rotateY(THREE.MathUtils.degToRad(50) * delta)

        // Raycast from camera
        cameraRaycaster.setFromCamera(new THREE.Vector2(), camera)

        const intersects = cameraRaycaster.intersectObjects(scene.children)

        if (intersects.length > 0)
        {
            if (intersected != intersects[0].object)
            {
                intersected = intersects[0].object

                if (intersected.name === 'COLLISION_door')
                {
                    interactText.innerHTML = doorHoverText
                }
                if (intersected.name === 'COLLISION_lever')
                {
                    interactText.innerHTML = 'USE LEVER'
                }
                if (intersected.name === 'COLLISION_cage')
                {
                    interactText.innerHTML = 'OPEN TWITTER'
                }
                if (intersected.name === 'COLLISION_laptop')
                {
                    interactText.innerHTML = 'OPEN DISCORD'
                }
                if (intersected.name === 'COLLISION_fox')
                {
                    interactText.innerHTML = 'CONNECT WALLET'
                }
                if (intersected.name === 'COLLISION_button_01')
                {
                    interactText.innerHTML = 'QTY: 1'
                }
                if (intersected.name === 'COLLISION_button_02')
                {
                    interactText.innerHTML = 'QTY: 2'
                }
                if (intersected.name === 'COLLISION_button_03')
                {
                    interactText.innerHTML = 'QTY: 3'
                }
            }
        }
        else
        {
            if (intersected)
            {
                intersected = null
            }
        }

        if (intersected && intersected.name === 'COLLISION_door' ||
            intersected && intersected.name === 'COLLISION_lever' ||
            intersected && intersected.name === 'COLLISION_cage' ||
            intersected && intersected.name === 'COLLISION_laptop' ||
            intersected && intersected.name === 'COLLISION_fox' ||
            intersected && intersected.name === 'COLLISION_button_01' ||
            intersected && intersected.name === 'COLLISION_button_02' ||
            intersected && intersected.name === 'COLLISION_button_03')
        {
            gsap.to('#dot', { width: '10px', height: '10px', backgroundColor: 'rgba(203, 203, 203, 0)', duration: 0.1 })
            gsap.to('#interact__container', { autoAlpha: 1, delay: 0.2, duration: 0.2 })
        }
        else
        {
            gsap.to('#dot', { width: '2px', height: '2px', backgroundColor: 'rgba(203, 203, 203, 1)', duration: 0.1 })
            gsap.to('#interact__container', { autoAlpha: 0, delay: 0.2, duration: 0.2 })
        }

        // Update animations
        mixer.update(delta)
        mixer1.update(delta)
        mixer2.update(delta)
        for (const mixer of mixers) mixer.update(delta)
    }

    renderer.render(scene, camera)
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
}

function traverseBaby(baby, probe)
{
    let mat = null

    baby.traverse((child) =>
    {
        if(mat === null && child.material)
        {
            child.material.map.encoding = THREE.LinearEncoding
            mat = child.material.clone()
            mat.envMap = probe.texture

            child.material = mat
        }
        child.layers.set(1)
    })
}

function changeMaterialOffset()
{
    emissiveFloorMaterial.emissiveMap.offset.x += 1 / 6
    emissiveFloorMaterial.emissiveMap.offset.y += 3 / 8

    setTimeout(() => changeMaterialOffset(), 400)
}

function playButtonAnimation(button)
{
    const action = mixer.clipAction(getAnimationByName(scene.animations, button))
    action.setLoop(THREE.LoopOnce)
    action.stop()
    action.play()
}

function getAnimationByName(arr, name)
{
    for (var i = 0; i < arr.length; i++)
    {
        if (arr[i].name == name)
        {
            return arr[i]
        }
    }
    return undefined
}

function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles, tileDispDuration) 
{
    // note: texture passed by reference, will be updated by the update function.
    this.tilesHorizontal = tilesHoriz
    this.tilesVertical = tilesVert
    // how many images does this spritesheet contain?
    //  usually equals tilesHoriz * tilesVert, but not necessarily,
    //  if there at blank tiles at the bottom of the spritesheet. 
    this.numberOfTiles = numTiles
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical)

    // how long should each image be displayed?
    this.tileDisplayDuration = tileDispDuration

    // how long has the current image been displayed?
    this.currentDisplayTime = 0

    // which image is currently being displayed?
    this.currentTile = 0

    this.update = function (milliSec)
    {
        this.currentDisplayTime += milliSec
        while (this.currentDisplayTime > this.tileDisplayDuration)
        {
            this.currentDisplayTime -= this.tileDisplayDuration
            this.currentTile++
            if (this.currentTile == this.numberOfTiles)
                this.currentTile = 0
            var currentColumn = this.currentTile % this.tilesHorizontal
            texture.offset.x = currentColumn / this.tilesHorizontal
            var currentRow = Math.floor(this.currentTile / this.tilesHorizontal)
            texture.offset.y = currentRow / this.tilesVertical
        }
    }
}