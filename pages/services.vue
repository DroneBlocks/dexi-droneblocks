<template>
    <div class="h-screen">
        
        <div class="p-5">

            <NuxtLink to="/">&larr; dashboard</NuxtLink>

            <h1 class="text-2xl mt-2">{{ title }}</h1>
            
            <div class="mt-2" v-if="params.service">
                Service: {{ params.service }} <br />
            </div>
            
            <ul class="mt-2">
                <li v-for="service in services">
                    <a :href="'?service=' + service">{{ service }}</a>
                </li>
            </ul>

            <div v-if="params.service" id="topic-message">
                <button @click="setGPIO(params.service, true)">High</button> &nbsp; <button @click="setGPIO(params.service, false)">Low</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import * as ROSLIB from 'roslib'
const title = ref('DEXI Service Browser')
const host = ref(useRequestURL().hostname)
const url = 'ws://' + host.value + ':9090'
const ros = new ROSLIB.Ros({ url: url })
const params = Object.fromEntries(new URLSearchParams(useRequestURL().search).entries())
const services = reactive([])

ros.on('connection', function () {
  init();
});

ros.on('close', function () {
	setTimeout(function() {
		// reconnect
		ros.connect(url);
	}, 2000);
});

function viewServicesList() {
	ros.getServices(function(servicesData) {
    Object.assign(services, servicesData);
	});
}

function setGPIO(service: string, state: boolean) {
  
  var gpioService = new ROSLIB.Service({
    ros : ros,
    name : service,
    serviceType : 'dexi_msgs/srv/GPIOSend'
  })

  var request = new ROSLIB.ServiceRequest({
    pin: 21,
    state: state
  })

  gpioService.callService(request, function(result) {
    console.log(result);
  })

}

function init() {
	if (!params.service) {
		viewServicesList();
	}
}
</script>