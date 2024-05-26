import * as Blockly from 'blockly/core';
import {JavascriptGenerator, javascriptGenerator, Order} from 'blockly/javascript';

Blockly.Blocks['stock_buy_simple'] = {
  init: function () {
    this.appendValueInput('Number')
      .setCheck('Number')
      .appendField('Buy Stock ID')
      .appendField(new Blockly.FieldNumber(0), 'ID')
      .appendField('For amount')
      .appendField(new Blockly.FieldNumber(0), 'Amount')
      .appendField('At Price')
      .appendField(new Blockly.FieldNumber(0), 'Price');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, 'String');
    this.setColour(230);
    this.setTooltip('buy id');
    this.setHelpUrl('https://example.com');
  },
};

javascriptGenerator.forBlock['stock_buy_simple'] = function (block: Blockly.Block, generator: JavascriptGenerator) {
  const numberId = block.getFieldValue('ID');
  const numberAmount = block.getFieldValue('Amount');
  const numberPrice = block.getFieldValue('Price');
  const valueNumber = generator.valueToCode(block, 'Number', Order.ATOMIC);
  const code = `buy(${numberId},${numberAmount},${numberPrice},${valueNumber});\n`;
  return code;
};

Blockly.Blocks['stock_buy_prog'] = {
  init: function () {
    this.appendValueInput('Number')
      .setCheck('Number')
      .appendField('Buy Stock ID');
    this.appendValueInput('NAME').setCheck('Number').appendField('For amount');
    this.appendValueInput('NAME').setCheck('Number').appendField('At Price');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, 'String');
    this.setColour(230);
    this.setTooltip('buy id');
    this.setHelpUrl('https://example.com');
  },
};

javascriptGenerator.forBlock['stock_buy_prog'] = function (block: Blockly.Block, generator: JavascriptGenerator) {
  const valueNumber = generator.valueToCode(block, 'Number', Order.ATOMIC);
  const valueName = generator.valueToCode(block, 'NAME', Order.ATOMIC);
  const code = `buy(${valueNumber},${valueName},${valueName});\n`;
  return code;
};

Blockly.Blocks['stock_fetch_price'] = {
  init: function () {
    this.appendValueInput('Fetch')
      .setCheck('Number')
      .appendField('Fetch Price of Stock ID:');
    this.appendDummyInput()
      .appendField('And set to:')
      .appendField(new Blockly.FieldVariable('item'), 'variable');
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
    this.setTooltip('fetch stock price');
    this.setHelpUrl('https://example.com');
  },
};

javascriptGenerator.forBlock['stock_fetch_price'] = function (
  block: Blockly.Block,
  generator: JavascriptGenerator,
) {
  const valueFetch = generator.valueToCode(block, 'Fetch', Order.ATOMIC);
  const variableVariable = javascriptGenerator.nameDB_.getName(
    block.getFieldValue('variable'),
    Blockly.Names.NameType.VARIABLE,
  );
  const code = `fetch_price(${valueFetch},${variableVariable});\n`;
  return code;
};
