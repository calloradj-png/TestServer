import { World, Network } from '@dreamengine/runtime';
console.log('Server script starting: 3DModel walking around moving CubeCenter');
// Find or create CubeCenter in the scene
let cubeCenter = World.findObjectByName('CubeCenter');
if (!cubeCenter) {
    cubeCenter = World.spawnObject({
        name: 'CubeCenter',
        type: 'cube',
        position: { x: 0, y: 0.5, z: 0 },
        scale: { x: 1.2, y: 1.2, z: 1.2 },
        color: '#f59e0b',
        material: 'smooth_plastic',
        isServerOwned: true,
    });
}
// Find 3DModel in the scene
const model = World.findObjectByName('3DModel') || World.getAllObjects().find((o) => o.type === 'model');
if (!model) {
    console.warn('[Server] 3DModel object not found in the world!');
}
else {
    console.log(`[Server] Found 3DModel: ${model.name} (ID: ${model.id})`);
    const initialModelY = model.position.y;
    const initialCenterPos = { x: cubeCenter?.position.x || 0, z: cubeCenter?.position.z || 0 };
    const radius = 5;
    const walkSpeed = 1.3; // Orbit speed (rad/s)
    const stepFrequency = 7.5; // Walking step cadence
    const centerMoveSpeed = 1.5; // Speed of CubeCenter oscillation
    const centerMoveAmplitude = 5; // Range of left-right movement
    let angle = 0;
    let time = 0;
    let isPaused = false;
    // RemoteEvent for pausing/resuming animation from client via Spacebar
    const toggleEvent = Network.getEvent('ToggleAnimation');
    toggleEvent.onClientEvent((data, clientId) => {
        isPaused = !isPaused;
        console.log(`📡 [Server] Received ToggleAnimation. IsPaused = ${isPaused}`);
    });
    World.onUpdate((deltaTime) => {
        if (isPaused)
            return;
        time += deltaTime;
        angle += walkSpeed * deltaTime;
        // 1. Move CubeCenter slowly left and right (along X-axis)
        const centerOffsetX = Math.sin(time * centerMoveSpeed) * centerMoveAmplitude;
        const centerVelX = Math.cos(time * centerMoveSpeed) * centerMoveAmplitude * centerMoveSpeed;
        const currentCenterX = initialCenterPos.x + centerOffsetX;
        const currentCenterZ = initialCenterPos.z;
        if (cubeCenter) {
            cubeCenter.position.x = currentCenterX;
            cubeCenter.position.z = currentCenterZ;
        }
        // 2. 3DModel walks in circle relative to CubeCenter position
        const x = currentCenterX + Math.cos(angle) * radius;
        const z = currentCenterZ + Math.sin(angle) * radius;
        // 3. Facing direction along total velocity (orbiting tangent + center movement)
        const orbitVelX = -Math.sin(angle) * walkSpeed * radius;
        const orbitVelZ = Math.cos(angle) * walkSpeed * radius;
        const totalVelX = orbitVelX + centerVelX;
        const totalVelZ = orbitVelZ;
        const heading = Math.atan2(totalVelX, totalVelZ) + Math.PI;
        // 4. Step cadence & bounce
        const stepPhase = time * stepFrequency;
        const bounceHeight = Math.abs(Math.sin(stepPhase)) * 0.28;
        const y = initialModelY + bounceHeight;
        // 5. Side-to-side waddling / sway & dynamic tilt
        const swayRoll = Math.sin(stepPhase) * 0.14;
        const pitch = 0.06 + Math.cos(stepPhase * 2) * 0.03;
        // 6. Squash and stretch
        const stretch = Math.sin(stepPhase * 2);
        const scaleY = 1.0 + stretch * 0.24;
        const scaleX = 1.0 - stretch * 0.12;
        const scaleZ = 1.0 - stretch * 0.12;
        // Apply authoritative transforms
        model.position.set(x, y, z);
        model.rotation.set(pitch, heading, swayRoll);
        model.scale.set(scaleX, scaleY, scaleZ);
    });
}
