import { World } from '@dreamengine/runtime';
console.log('🌐 [Server] Initializing Server Physics Test...');
// Создаем сферу/куб с серверной физикой на высоте y=12
const boulder = World.spawnObject({
    name: 'HeavyBoulder',
    type: 'cube',
    position: { x: 0, y: 12, z: 0 },
    scale: { x: 2, y: 2, z: 2 },
    color: '#e11d48',
    anchored: false,
    mass: 5.0,
    physicsOwner: 'server',
});
const sphere = World.findObjectByName("Sphere22");
if (sphere) {
    sphere.physicsOwner = 'server';
}
// Каждые 3 секунды проверяем: если куб упал (y < 6), телепортируем его наверх
setInterval(() => {
    if (boulder) {
        console.log(`[Server] HeavyBoulder y=${boulder.position.y.toFixed(2)}`);
        if (boulder.position.y < 6.0) {
            console.log('🔄 Teleporting boulder back to top (y=12)');
            boulder.teleport(0, 12, 0);
        }
    }
}, 3000);
