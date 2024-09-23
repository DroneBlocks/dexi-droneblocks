<template>
  <div>
    <h1>DEXI Dashboard</h1>
    <ul>
      <li>
        <NuxtLink to="/topics">
          Topic browser
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/services">
          Service browser
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="http://192.168.4.1:8080">
          Pi Camera
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="/droneblocks">
          DroneBlocks
        </NuxtLink>
      </li>
      <!-- <li>VS Code</li>
      <li>Terminal</li> -->
      <li>
        <NuxtLink to="https://github.com/droneblocks/dexi" target="_blank">
          GitHub
        </NuxtLink>
      </li>
      <li>
        <NuxtLink to="https://discord.gg/Wjw7wGf7Wn" target="_blank">
          Discord
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>