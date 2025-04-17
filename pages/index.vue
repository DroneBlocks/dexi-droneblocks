<template>
    <div class="flex items-center justify-center h-screen">

        <div class="grid">

            <div class="flex p-10 justify-center">
                <img src="~/assets/droneblocks_logo.svg" />
            </div>

            <div class="grid grid-cols-4 gap-6 row-span-2">

                <div class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5">
                    <div class="px-4">
                        <div class="font-bold text-xl mb-2">DEXI Pi Camera</div>
                        <div class="flex flex-col gap-2 mt-2">
                            <div class="relative inline-block group">
                                <a :href="`http://${hostname}:8080`" target="_blank" class="link text-sm">📹 High Quality Stream</a>
                                <div class="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 -mt-2 left-full ml-2 w-48">
                                    Higher quality stream with increased bandwidth usage
                                </div>
                            </div>
                            <div class="relative inline-block group">
                                <a :href="`http://${hostname}:8080/stream_viewer?topic=/cam0/image_raw&amp;type=ros_compressed`" target="_blank" class="link text-sm">🎥 Compressed Stream</a>
                                <div class="absolute invisible group-hover:visible bg-gray-800 text-white text-xs rounded p-2 -mt-2 left-full ml-2 w-48">
                                    Lower quality stream optimized for reduced bandwidth
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

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

                <NuxtLink class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5" to="/topics">
                    <div class="px-4">
                        <div class="font-bold text-xl mb-2">Topic Browser</div>
                        <p class="text-gray-700 text-base">
                            View ROS2 topics running on DEXI
                        </p>
                    </div>
                </NuxtLink>

                <NuxtLink class="w-60 rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-5 pb-5" to="/services">
                    <div class="px-4">
                        <div class="font-bold text-xl mb-2">Service Browser</div>
                        <p class="text-gray-700 text-base">
                            View ROS2 services running on DEXI
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

            <div class="flex items-center justify-center mt-10">
            
                <div><a href="https://github.com/DroneBlocks/dexi-os/releases/tag/v0.09" target="_blank">DEXI-OS v0.09</a></div>

            </div>
        </div>
    </div>

</template>

<script setup>
const hostname = process.client ? window.location.hostname : '192.168.4.1'
</script>