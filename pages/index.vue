<template>
    <div class="flex items-center justify-center h-screen bg-gray-400">

        <div class="grid grid-rows-2">

            <div class="grid grid-cols-3 row-span-2">

                <a class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 ml-5 mr-5" href="/topics">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Topic Browser</div>
                        <p class="text-gray-700 text-base">
                            View ROS2 topics running on DEXI
                        </p>
                    </div>
                </a>

                <a class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 ml-5 mr-5" href="/services">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Service Browser</div>
                        <p class="text-gray-700 text-base">
                            View ROS2 services running on DEXI
                        </p>
                    </div>
                </a>

                <a class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 ml-5 mr-5" href="http://192.168.4.1:8080">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Pi Camera</div>
                        <p class="text-gray-700 text-base">
                            View DEXI's Pi Camera Stream
                        </p>
                    </div>
                </a>

                <a class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 mt-10 ml-5 mr-5" href="http://192.168.4.1:1880">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Node-RED</div>
                        <p class="text-gray-700 text-base">
                            Launch the Node-RED editor and program DEXI
                        </p>
                    </div>
                </a>

                <a class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 mt-10 ml-5 mr-5" href="https://github.com/droneblocks/dexi" target="_blank">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">GitHub</div>
                        <p class="text-gray-700 text-base">
                            Access the DEXI code repository
                        </p>
                    </div>
                </a>

                <a class="max-w-sm rounded overflow-hidden shadow-lg bg-primary-content hover:bg-info pt-10 pb-10 mt-10 ml-5 mr-5" href="https://discord.gg/Wjw7wGf7Wn" target="_blank">
                    <div class="px-6">
                        <div class="font-bold text-xl mb-2">Discord</div>
                        <p class="text-gray-700 text-base">
                            Join the DroneBlocks Discord for support and conversation
                        </p>
                    </div>
                </a>

            </div>

            <div class="flex items-center justify-center mt-10">
            
                <div><a href="https://github.com/DroneBlocks/dexi-os/releases/tag/v0.06" target="_blank">DEXI-OS v0.06</a></div>

            </div>
        </div>
    </div>

</template>