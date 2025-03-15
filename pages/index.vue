<template>
    <div class="flex items-center justify-center h-screen">

        <div class="grid">

            <div class="flex p-10 justify-center">
                <img src="~/assets/droneblocks_logo.svg" />
            </div>

            <div class="grid grid-cols-3 row-span-2">

                <NuxtLink class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 ml-5 mr-5" to="/topics">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Topic Browser</div>
                        <p class="text-gray-700 text-base">
                            View ROS2 topics running on DEXI
                        </p>
                    </div>
                </NuxtLink>

                <NuxtLink class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 ml-5 mr-5" to="/services">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Service Browser</div>
                        <p class="text-gray-700 text-base">
                            View ROS2 services running on DEXI
                        </p>
                    </div>
                </NuxtLink>

                <div class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 ml-5 mr-5">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Pi Camera</div>
                        <p class="text-gray-700 text-base">
                            View DEXI's Pi Camera Stream<br /><br />
                            <a href="http://192.168.4.1:8080" target="_blank" class="link">Raw (higher quality, higher bandwidth)</a><br />
                            <a href="http://192.168.4.1:8080/stream_viewer?topic=/cam0/image_raw&amp;type=ros_compressed" target="_blank" class="link">Compressed (lower quality, lower bandwidth)</a>
                        </p>
                    </div>
                </div>

                <NuxtLink class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 mt-10 ml-5 mr-5" to="http://192.168.4.1:1880">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Node-RED</div>
                        <p class="text-gray-700 text-base">
                            Launch the Node-RED editor and program DEXI
                        </p>
                    </div>
                </NuxtLink>

                <NuxtLink class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 mt-10 ml-5 mr-5" to="https://github.com/droneblocks/dexi" target="_blank">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">GitHub</div>
                        <p class="text-gray-700 text-base">
                            Access the DEXI code repository
                        </p>
                    </div>
                </NuxtLink>

                <NuxtLink class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 mt-10 ml-5 mr-5" to="https://discord.gg/Wjw7wGf7Wn" target="_blank">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Discord</div>
                        <p class="text-gray-700 text-base">
                            Join the DroneBlocks Discord for support and conversation
                        </p>
                    </div>
                </NuxtLink>

            </div>

            <div class="flex items-center justify-center mt-10">
            
                <div><a href="https://github.com/DroneBlocks/dexi-os/releases/tag/v0.07" target="_blank">DEXI-OS v0.07</a></div>

            </div>
        </div>
    </div>

</template>