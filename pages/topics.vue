<template>
  <div>
    <NuxtLink to="/">&larr; dashboard</NuxtLink>
    <h1>{{ title }}</h1>
    <div v-if="params.topic">
      Topic: {{ params.topic }} <br />
      Type: {{ topicType }}
    </div>
    <ul>
      <li v-for="topic in topics" :key="topic.topic">
        <span v-if="topic.type == 'sensor_msgs/Image'" >
          <a :href="'http://' + host + ':8080/stream_viewer?topic=' + topic.topic" :title="topic.type">{{ topic.topic }}</a> &#x1F5BC;
        </span>
        <span v-else>
          <a :href="'?topic=' + topic.topic" :title="topic.type">{{ topic.topic }}</a>
        </span>
      </li>
    </ul>
    
    <pre v-if="params.topic" id="topic-message">
      <div>{{ counter }} messages received</div>
      {{ topicMessage }}
    </pre>
  </div>
</template>

<script setup lang="ts">
import * as ROSLIB from 'roslib'
const title = ref('DEXI Topic Browser');
const host = ref(useRequestURL().hostname);
const url = 'ws://' + host.value + ':9090';
const ros = new ROSLIB.Ros({ url: url });
const params = Object.fromEntries(new URLSearchParams(useRequestURL().search).entries());

const topics = reactive([]);
const counter = ref(0);
const topicMessage = ref('No messages received');
const topicType = ref();

ros.on('connection', function () {
  init();
});

ros.on('close', function () {
	setTimeout(function() {
		// reconnect
		ros.connect(url);
	}, 2000);
});

function viewTopicsList() {
	ros.getTopics(function(topicsData) {
    // Response is an object with an array of topics and array of types
    // We will enumerate and merge
    let mergedTopicsData = [];
    topicsData.topics.map((topic, i) => {
      mergedTopicsData.push({topic: topic, type: topicsData.types[i]})
    })
    Object.assign(topics, mergedTopicsData);
	});
}

function viewTopicMessage(topic) {
  counter.value++;
  
  // Get the topic type
  ros.getTopicType(topic, function(typeStr) {
		topicType.value = typeStr;
	});

  // Subscribe to the topic
  new ROSLIB.Topic({ ros: ros, name: topic }).subscribe(function(msg) {
    counter.value++;

    if (msg.header && msg.header.stamp) {
			if (params.date || params.offset) {
				let date = new Date(msg.header.stamp.secs * 1e3 + msg.header.stamp.nsecs * 1e-6);
				if (params.date) msg.header.date = date.toISOString();
				if (params.offset) msg.header.offset = (new Date() - date) * 1e-3;
			}
		}

    topicMessage.value = msg;

  });
}

function init() {
	if (!params.topic) {
		viewTopicsList();
	} else {
    viewTopicMessage(params.topic);
	}
}
</script>