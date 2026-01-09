<script setup>
import * as Blockly from 'blockly/core';
import * as En from 'blockly/msg/en'
import 'blockly/blocks';

Blockly.setLocale(En);

const props = defineProps(['options']);
const blocklyToolbox = ref();
const blocklyDiv = ref();
const workspace = shallowRef();

onMounted(() => {
  const options = props.options || {};
  if (!options.toolbox) {
    options.toolbox = blocklyToolbox.value;
  }
  workspace.value = Blockly.inject(blocklyDiv.value, options);

  // Force resize after injection
  setTimeout(() => {
    if (workspace.value) {
      Blockly.svgResize(workspace.value);
    }
  }, 100);
});

defineExpose({workspace});
</script>

<template>
  <div ref="blocklyDiv" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
    <xml ref="blocklyToolbox" style="display: none">
      <slot></slot>
    </xml>
  </div>
</template>
