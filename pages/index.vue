<template>
    <div class="flex items-center justify-center h-screen">

        <div class="grid">

            <div class="flex p-10 justify-center">
                <img src="~/assets/droneblocks_logo.svg" />
            </div>

            <div class="flex flex-col gap-8">
                <!-- First row: 3 panels -->
                <div class="grid grid-cols-3 gap-6 justify-center">

                    <NuxtLink class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5" to="/gcs">
                        <div class="px-4">
                            <div class="font-bold text-xl mb-2">DEXI GCS</div>
                            <div class="flex flex-col gap-2 mt-2">
                                Access DEXI's camera, LED, servos, and more
                            </div>
                        </div>
                    </NuxtLink>

                    <NuxtLink class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5" :to="`http://${hostname}:1880`" target="_blank">
                        <div class="px-4">
                            <div class="font-bold text-xl mb-2">Node-RED</div>
                            <p class="text-gray-700 text-base">
                                Node-RED visual programming with DEXI
                            </p>
                        </div>
                    </NuxtLink>

                    <NuxtLink class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5" :to="`http://${hostname}:9999`" target="_blank">
                        <div class="px-4">
                            <div class="font-bold text-xl mb-2">VS Code Server</div>
                            <p class="text-gray-700 text-base">
                                Coding with the DEXI ROS2 project in your browser
                            </p>
                        </div>
                    </NuxtLink>

                </div>

                <!-- Second row: 3 panels centered -->
                <div class="grid grid-cols-3 gap-6 justify-center">

                    <NuxtLink class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5" to="/ros">
                        <div class="px-4">
                            <div class="font-bold text-xl mb-2">ROS Debug</div>
                            <p class="text-gray-700 text-base">
                                Debug ROS topics and services on DEXI
                            </p>
                        </div>
                    </NuxtLink>

                    <NuxtLink class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5" to="https://github.com/droneblocks/dexi" target="_blank">
                        <div class="px-4">
                            <div class="font-bold text-xl mb-2">GitHub</div>
                            <p class="text-gray-700 text-base">
                                Access the DEXI code repository
                            </p>
                        </div>
                    </NuxtLink>

                    <NuxtLink class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5" to="https://discord.gg/Wjw7wGf7Wn" target="_blank">
                        <div class="px-4">
                            <div class="font-bold text-xl mb-2">Discord</div>
                            <p class="text-gray-700 text-base">
                                Join the DroneBlocks Discord for support and conversation
                            </p>
                        </div>
                    </NuxtLink>

                </div>

            </div>

            <div class="flex items-center justify-center mt-10">
            
                <div><a href="https://github.com/DroneBlocks/dexi-os/releases/tag/v0.11" target="_blank">DEXI-OS v0.11</a></div>

            </div>
        </div>
    </div>

</template>

<script setup>
const hostname = process.client ? window.location.hostname : '192.168.4.1'
</script>