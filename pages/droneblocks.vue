<script setup lang="ts">
import '~/assets/ts/stocks';
import { Takeoff } from '~/assets/ts/takeoff';

import {javascriptGenerator} from 'blockly/javascript';
//import * as ROSLIB from 'roslib'
import { CommandProcessor } from '~/assets/ts/commandprocessor';

const takeoff = new Takeoff();
new CommandProcessor();


const foo = ref();
const code = ref();
const options = {
  media: 'media/',
  grid: {
    spacing: 25,
    length: 3,
    colour: '#ccc',
    snap: true,
  },
  toolbox: `<xml>
          <category name="Logic" colour="%{BKY_LOGIC_HUE}">
            <block type="controls_if"></block>
            <block type="logic_compare"></block>
            <block type="logic_operation"></block>
            <block type="logic_negate"></block>
            <block type="logic_boolean"></block>
          </category>
          <category name="Loops" colour="%{BKY_LOOPS_HUE}">
            <block type="controls_repeat_ext">
              <value name="TIMES">
                <block type="math_number">
                  <field name="NUM">10</field>
                </block>
              </value>
            </block>
            <block type="controls_whileUntil"></block>
          </category>
          <category name="Math" colour="%{BKY_MATH_HUE}">
            <block type="math_number">
              <field name="NUM">123</field>
            </block>
            <block type="math_arithmetic"></block>
            <block type="math_single"></block>
          </category>
          <category name="Text" colour="%{BKY_TEXTS_HUE}">
            <block type="text"></block>
            <block type="text_length"></block>
            <block type="text_print"></block>
          </category>
          <category name="Variables" custom="VARIABLE" colour="%{BKY_VARIABLES_HUE}">
            </category>
          <category name="Stocks" colour="%{BKY_LOOPS_HUE}">
            <block type="stock_buy_simple"></block>
            <block type="stock_buy_prog"></block>
            <block type="stock_fetch_price"></block>
          </category>
          <category name="Takeoff" colour="%{BKY_LOOPS_HUE}">
            <block type="arm"></block>
            <block type="takeoff"></block>
            <block type="disarm"></block>
          </category>
        </xml>`,
};

const showCode = () =>
  (code.value = javascriptGenerator.workspaceToCode(foo.value.workspace));
</script>

<template>
  <div>
    <blockly-component
      id="blockly2"
      :options="options"
      ref="foo"></blockly-component>
    <div id="code">
      <button v-on:click="showCode()">Show JavaScript</button>
      <pre v-html="code"></pre>
    </div>
  </div>
</template>

<style scoped>
html,
body {
  margin: 0;
}

#code {
  position: absolute;
  right: 0;
  top: 0;
  width: 50%;
  height: 100%;
  margin: 0;
  background-color: beige;
}

#blockly2 {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}
</style>