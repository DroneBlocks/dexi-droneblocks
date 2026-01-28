import * as Blockly from 'blockly/core';

// Python preamble with ROS2 imports and class definition
const PYTHON_PREAMBLE = `#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from dexi_interfaces.srv import ExecuteBlocklyCommand
import time


class DexiMission:
    def __init__(self):
        rclpy.init()
        self.node = rclpy.create_node('dexi_blockly_mission')
        self.client = self.node.create_client(
            ExecuteBlocklyCommand,
            '/dexi/execute_blockly_command'
        )
        while not self.client.wait_for_service(timeout_sec=1.0):
            self.node.get_logger().info('Waiting for service...')

    def execute_command(self, command: str, parameter: float = 0.0, timeout: float = 30.0):
        request = ExecuteBlocklyCommand.Request()
        request.command = command
        request.parameter = parameter
        request.timeout = timeout
        future = self.client.call_async(request)
        rclpy.spin_until_future_complete(self.node, future)
        return future.result()

    def execute_ned_command(self, north: float, east: float, down: float, yaw: float = 0.0, timeout: float = 30.0):
        request = ExecuteBlocklyCommand.Request()
        request.command = 'goto_ned'
        request.north = north
        request.east = east
        request.down = down
        request.yaw = yaw
        request.timeout = timeout
        future = self.client.call_async(request)
        rclpy.spin_until_future_complete(self.node, future)
        return future.result()

    def set_led_effect(self, effect: str):
        request = ExecuteBlocklyCommand.Request()
        request.command = f'led_effect_{effect}'
        future = self.client.call_async(request)
        rclpy.spin_until_future_complete(self.node, future)
        return future.result()

    def set_led_ring_color(self, color: str):
        request = ExecuteBlocklyCommand.Request()
        request.command = f'led_ring_{color}'
        future = self.client.call_async(request)
        rclpy.spin_until_future_complete(self.node, future)
        return future.result()

    def set_led_pixel(self, index: int, r: int, g: int, b: int):
        request = ExecuteBlocklyCommand.Request()
        request.command = 'led_pixel'
        request.index = index
        request.r = r
        request.g = g
        request.b = b
        future = self.client.call_async(request)
        rclpy.spin_until_future_complete(self.node, future)
        return future.result()

    def shutdown(self):
        self.node.destroy_node()
        rclpy.shutdown()


def main():
    mission = DexiMission()

`;

const PYTHON_POSTAMBLE = `
    mission.shutdown()


if __name__ == '__main__':
    main()
`;

// Indentation helper
function indent(code: string, level: number = 1): string {
  const spaces = '    '.repeat(level);
  return code.split('\n').map(line => line ? spaces + line : line).join('\n');
}

// Unit conversion helper - converts value to meters for Python code
function convertToMeters(value: string, unit: string): string {
  switch (unit) {
    case 'ft':
      return `float(${value}) * 0.3048`;
    default:
      return toFloat(value);
  }
}

// Ensure value is formatted as a Python float
function toFloat(value: string): string {
  // If it's already a float expression or has operators, wrap in float()
  if (value.includes('.') || value.includes('*') || value.includes('/') || value.includes('(')) {
    return value;
  }
  // Otherwise ensure it's a float by adding .0 or wrapping
  return `float(${value})`;
}

// Block generators - maps block type to Python code generator
type BlockGenerator = (block: Blockly.Block, indentLevel: number) => string;

const blockGenerators: Record<string, BlockGenerator> = {
  // Setup blocks
  nav_arm: (block, indentLevel) => indent(`mission.execute_command('arm')`, indentLevel),
  nav_disarm: (block, indentLevel) => indent(`mission.execute_command('disarm')`, indentLevel),
  nav_start_offboard_heartbeat: (block, indentLevel) => indent(`mission.execute_command('start_offboard_heartbeat')`, indentLevel),
  nav_stop_offboard_heartbeat: (block, indentLevel) => indent(`mission.execute_command('stop_offboard_heartbeat')`, indentLevel),
  nav_switch_offboard_mode: (block, indentLevel) => indent(`mission.execute_command('switch_offboard_mode')`, indentLevel),
  nav_switch_hold_mode: (block, indentLevel) => indent(`mission.execute_command('switch_hold_mode')`, indentLevel),

  // Takeoff blocks
  nav_takeoff: (block, indentLevel) => {
    const altitude = getInputValue(block, 'ALTITUDE', '2.0');
    const unit = block.getFieldValue('UNIT') || 'm';
    const altitudeExpr = convertToMeters(altitude, unit);
    const comment = unit !== 'm' ? `  # ${altitude} ${unit}` : '';
    return indent(`mission.execute_command('offboard_takeoff', ${altitudeExpr})${comment}`, indentLevel);
  },
  nav_takeoff_after: (block, indentLevel) => {
    const delay = getInputValue(block, 'DELAY', '5');
    return indent(`time.sleep(${delay})`, indentLevel) + '\n' + indent(`mission.execute_command('offboard_takeoff', 2.0)`, indentLevel);
  },
  nav_takeoff_and_wait: (block, indentLevel) => {
    const waitTime = getInputValue(block, 'WAIT_TIME', '5');
    return indent(`mission.execute_command('offboard_takeoff', 2.0)`, indentLevel) + '\n' + indent(`time.sleep(${waitTime})`, indentLevel);
  },

  // Land blocks
  nav_land: (block, indentLevel) => indent(`mission.execute_command('land')`, indentLevel),
  nav_land_after: (block, indentLevel) => {
    const delay = getInputValue(block, 'DELAY', '5');
    return indent(`time.sleep(${delay})`, indentLevel) + '\n' + indent(`mission.execute_command('land')`, indentLevel);
  },
  nav_land_wait_takeoff: (block, indentLevel) => {
    const duration = getInputValue(block, 'DURATION', '5');
    return indent(`mission.execute_command('land')`, indentLevel) + '\n' +
           indent(`time.sleep(${duration})`, indentLevel) + '\n' +
           indent(`mission.execute_command('offboard_takeoff', 2.0)`, indentLevel);
  },

  // Navigation blocks
  nav_fly_forward: (block, indentLevel) => {
    const distance = getInputValue(block, 'DISTANCE', '1.0');
    const unit = block.getFieldValue('UNIT') || 'm';
    const distanceExpr = convertToMeters(distance, unit);
    const comment = unit !== 'm' ? `  # ${distance} ${unit}` : '';
    return indent(`mission.execute_command('fly_forward', ${distanceExpr})${comment}`, indentLevel);
  },
  nav_fly_backward: (block, indentLevel) => {
    const distance = getInputValue(block, 'DISTANCE', '1.0');
    const unit = block.getFieldValue('UNIT') || 'm';
    const distanceExpr = convertToMeters(distance, unit);
    const comment = unit !== 'm' ? `  # ${distance} ${unit}` : '';
    return indent(`mission.execute_command('fly_backward', ${distanceExpr})${comment}`, indentLevel);
  },
  nav_fly_left: (block, indentLevel) => {
    const distance = getInputValue(block, 'DISTANCE', '1.0');
    const unit = block.getFieldValue('UNIT') || 'm';
    const distanceExpr = convertToMeters(distance, unit);
    const comment = unit !== 'm' ? `  # ${distance} ${unit}` : '';
    return indent(`mission.execute_command('fly_left', ${distanceExpr})${comment}`, indentLevel);
  },
  nav_fly_right: (block, indentLevel) => {
    const distance = getInputValue(block, 'DISTANCE', '1.0');
    const unit = block.getFieldValue('UNIT') || 'm';
    const distanceExpr = convertToMeters(distance, unit);
    const comment = unit !== 'm' ? `  # ${distance} ${unit}` : '';
    return indent(`mission.execute_command('fly_right', ${distanceExpr})${comment}`, indentLevel);
  },
  nav_fly_up: (block, indentLevel) => {
    const distance = getInputValue(block, 'DISTANCE', '1.0');
    const unit = block.getFieldValue('UNIT') || 'm';
    const distanceExpr = convertToMeters(distance, unit);
    const comment = unit !== 'm' ? `  # ${distance} ${unit}` : '';
    return indent(`mission.execute_command('fly_up', ${distanceExpr})${comment}`, indentLevel);
  },
  nav_fly_down: (block, indentLevel) => {
    const distance = getInputValue(block, 'DISTANCE', '1.0');
    const unit = block.getFieldValue('UNIT') || 'm';
    const distanceExpr = convertToMeters(distance, unit);
    const comment = unit !== 'm' ? `  # ${distance} ${unit}` : '';
    return indent(`mission.execute_command('fly_down', ${distanceExpr})${comment}`, indentLevel);
  },
  nav_yaw_left: (block, indentLevel) => {
    const degrees = getInputValue(block, 'DEGREES', '90');
    return indent(`mission.execute_command('yaw_left', ${toFloat(degrees)})`, indentLevel);
  },
  nav_yaw_right: (block, indentLevel) => {
    const degrees = getInputValue(block, 'DEGREES', '90');
    return indent(`mission.execute_command('yaw_right', ${toFloat(degrees)})`, indentLevel);
  },
  nav_wait: (block, indentLevel) => {
    const duration = getInputValue(block, 'DURATION', '1');
    return indent(`time.sleep(${duration})`, indentLevel);
  },
  nav_goto_ned: (block, indentLevel) => {
    const north = getInputValue(block, 'NORTH', '0');
    const east = getInputValue(block, 'EAST', '0');
    const down = getInputValue(block, 'DOWN', '-2');
    return indent(`mission.execute_ned_command(${north}, ${east}, ${down})`, indentLevel);
  },
  nav_goto_ned_with_yaw: (block, indentLevel) => {
    const north = getInputValue(block, 'NORTH', '0');
    const east = getInputValue(block, 'EAST', '0');
    const down = getInputValue(block, 'DOWN', '-2');
    const yaw = getInputValue(block, 'YAW', '0');
    return indent(`mission.execute_ned_command(${north}, ${east}, ${down}, ${yaw})`, indentLevel);
  },

  // LED blocks
  led_effect: (block, indentLevel) => {
    const effect = block.getFieldValue('effect') || 'rainbow';
    return indent(`mission.set_led_effect('${effect}')`, indentLevel);
  },
  led_ring: (block, indentLevel) => {
    const color = block.getFieldValue('color') || 'white';
    return indent(`mission.set_led_ring_color('${color}')`, indentLevel);
  },
  led_pixel: (block, indentLevel) => {
    const index = getInputValue(block, 'index', '0');
    const red = getInputValue(block, 'red', '255');
    const green = getInputValue(block, 'green', '255');
    const blue = getInputValue(block, 'blue', '255');
    return indent(`mission.set_led_pixel(${index}, ${red}, ${green}, ${blue})`, indentLevel);
  },

  // AprilTag blocks
  apriltag_start_monitoring: (block, indentLevel) => indent(`# Start monitoring AprilTags (handled by ROS2 node)`, indentLevel),
  apriltag_stop_monitoring: (block, indentLevel) => indent(`# Stop monitoring AprilTags (handled by ROS2 node)`, indentLevel),
  apriltag_get_last_id: () => `last_detected_tag_id`,
  apriltag_get_tag_count: () => `detected_tag_count`,

  // Control flow - loops
  controls_repeat_ext: (block, indentLevel) => {
    const times = getInputValue(block, 'TIMES', '10');
    const statements = generateStatementsForInput(block, 'DO', indentLevel + 1);
    return indent(`for _ in range(${times}):`, indentLevel) + '\n' + (statements || indent('pass', indentLevel + 1));
  },
  controls_whileUntil: (block, indentLevel) => {
    const mode = block.getFieldValue('MODE');
    const condition = generateValueCode(block, 'BOOL') || 'True';
    const statements = generateStatementsForInput(block, 'DO', indentLevel + 1);
    const conditionCode = mode === 'UNTIL' ? `not (${condition})` : condition;
    return indent(`while ${conditionCode}:`, indentLevel) + '\n' + (statements || indent('pass', indentLevel + 1));
  },
  controls_for: (block, indentLevel) => {
    const variable = block.getFieldValue('VAR') || 'i';
    const from = getInputValue(block, 'FROM', '1');
    const to = getInputValue(block, 'TO', '10');
    const by = getInputValue(block, 'BY', '1');
    const statements = generateStatementsForInput(block, 'DO', indentLevel + 1);
    return indent(`for ${variable} in range(${from}, ${to} + 1, ${by}):`, indentLevel) + '\n' + (statements || indent('pass', indentLevel + 1));
  },
  controls_forEach: (block, indentLevel) => {
    const variable = block.getFieldValue('VAR') || 'item';
    const list = generateValueCode(block, 'LIST') || '[]';
    const statements = generateStatementsForInput(block, 'DO', indentLevel + 1);
    return indent(`for ${variable} in ${list}:`, indentLevel) + '\n' + (statements || indent('pass', indentLevel + 1));
  },
  controls_flow_statements: (block, indentLevel) => {
    const flow = block.getFieldValue('FLOW');
    if (flow === 'BREAK') return indent('break', indentLevel);
    if (flow === 'CONTINUE') return indent('continue', indentLevel);
    return '';
  },

  // Logic blocks
  controls_if: (block, indentLevel) => {
    let code = '';
    let i = 0;

    // Handle IF clauses
    while (block.getInput('IF' + i)) {
      const condition = generateValueCode(block, 'IF' + i) || 'True';
      const statements = generateStatementsForInput(block, 'DO' + i, indentLevel + 1);

      if (i === 0) {
        code += indent(`if ${condition}:`, indentLevel) + '\n' + (statements || indent('pass', indentLevel + 1));
      } else {
        code += '\n' + indent(`elif ${condition}:`, indentLevel) + '\n' + (statements || indent('pass', indentLevel + 1));
      }
      i++;
    }

    // Handle ELSE clause
    if (block.getInput('ELSE')) {
      const statements = generateStatementsForInput(block, 'ELSE', indentLevel + 1);
      code += '\n' + indent('else:', indentLevel) + '\n' + (statements || indent('pass', indentLevel + 1));
    }

    return code;
  },
  controls_ifelse: (block, indentLevel) => {
    const condition = generateValueCode(block, 'IF0') || 'True';
    const ifStatements = generateStatementsForInput(block, 'DO0', indentLevel + 1);
    const elseStatements = generateStatementsForInput(block, 'ELSE', indentLevel + 1);
    return indent(`if ${condition}:`, indentLevel) + '\n' + (ifStatements || indent('pass', indentLevel + 1)) + '\n' + indent('else:', indentLevel) + '\n' + (elseStatements || indent('pass', indentLevel + 1));
  },
  logic_compare: (block) => {
    const operator = block.getFieldValue('OP');
    const a = generateValueCode(block, 'A') || '0';
    const b = generateValueCode(block, 'B') || '0';
    const ops: Record<string, string> = {
      'EQ': '==',
      'NEQ': '!=',
      'LT': '<',
      'LTE': '<=',
      'GT': '>',
      'GTE': '>='
    };
    return `${a} ${ops[operator] || '=='} ${b}`;
  },
  logic_operation: (block) => {
    const operator = block.getFieldValue('OP');
    const a = generateValueCode(block, 'A') || 'True';
    const b = generateValueCode(block, 'B') || 'True';
    const op = operator === 'AND' ? 'and' : 'or';
    return `${a} ${op} ${b}`;
  },
  logic_negate: (block) => {
    const value = generateValueCode(block, 'BOOL') || 'True';
    return `not ${value}`;
  },
  logic_boolean: (block) => {
    const value = block.getFieldValue('BOOL');
    return value === 'TRUE' ? 'True' : 'False';
  },
  logic_null: () => 'None',
  logic_ternary: (block) => {
    const condition = generateValueCode(block, 'IF') || 'True';
    const then = generateValueCode(block, 'THEN') || 'None';
    const otherwise = generateValueCode(block, 'ELSE') || 'None';
    return `${then} if ${condition} else ${otherwise}`;
  },

  // Math blocks
  math_number: (block) => {
    return String(block.getFieldValue('NUM') || 0);
  },
  math_arithmetic: (block) => {
    const operator = block.getFieldValue('OP');
    const a = generateValueCode(block, 'A') || '0';
    const b = generateValueCode(block, 'B') || '0';
    const ops: Record<string, string> = {
      'ADD': '+',
      'MINUS': '-',
      'MULTIPLY': '*',
      'DIVIDE': '/',
      'POWER': '**'
    };
    return `(${a} ${ops[operator] || '+'} ${b})`;
  },
  math_single: (block) => {
    const operator = block.getFieldValue('OP');
    const num = generateValueCode(block, 'NUM') || '0';
    const ops: Record<string, string> = {
      'ROOT': `math.sqrt(${num})`,
      'ABS': `abs(${num})`,
      'NEG': `-(${num})`,
      'LN': `math.log(${num})`,
      'LOG10': `math.log10(${num})`,
      'EXP': `math.exp(${num})`,
      'POW10': `10 ** ${num}`
    };
    return ops[operator] || num;
  },
  math_trig: (block) => {
    const operator = block.getFieldValue('OP');
    const num = generateValueCode(block, 'NUM') || '0';
    const ops: Record<string, string> = {
      'SIN': `math.sin(math.radians(${num}))`,
      'COS': `math.cos(math.radians(${num}))`,
      'TAN': `math.tan(math.radians(${num}))`,
      'ASIN': `math.degrees(math.asin(${num}))`,
      'ACOS': `math.degrees(math.acos(${num}))`,
      'ATAN': `math.degrees(math.atan(${num}))`
    };
    return ops[operator] || num;
  },
  math_constant: (block) => {
    const constant = block.getFieldValue('CONSTANT');
    const constants: Record<string, string> = {
      'PI': 'math.pi',
      'E': 'math.e',
      'GOLDEN_RATIO': '(1 + math.sqrt(5)) / 2',
      'SQRT2': 'math.sqrt(2)',
      'SQRT1_2': 'math.sqrt(0.5)',
      'INFINITY': 'float("inf")'
    };
    return constants[constant] || '0';
  },
  math_number_property: (block) => {
    const property = block.getFieldValue('PROPERTY');
    const num = generateValueCode(block, 'NUMBER_TO_CHECK') || '0';
    const props: Record<string, string> = {
      'EVEN': `(${num}) % 2 == 0`,
      'ODD': `(${num}) % 2 == 1`,
      'PRIME': `is_prime(${num})`,
      'WHOLE': `(${num}) % 1 == 0`,
      'POSITIVE': `(${num}) > 0`,
      'NEGATIVE': `(${num}) < 0`,
      'DIVISIBLE_BY': `(${num}) % ${generateValueCode(block, 'DIVISOR') || '1'} == 0`
    };
    return props[property] || 'False';
  },
  math_round: (block) => {
    const operator = block.getFieldValue('OP');
    const num = generateValueCode(block, 'NUM') || '0';
    const ops: Record<string, string> = {
      'ROUND': `round(${num})`,
      'ROUNDUP': `math.ceil(${num})`,
      'ROUNDDOWN': `math.floor(${num})`
    };
    return ops[operator] || num;
  },
  math_modulo: (block) => {
    const dividend = generateValueCode(block, 'DIVIDEND') || '0';
    const divisor = generateValueCode(block, 'DIVISOR') || '1';
    return `(${dividend}) % (${divisor})`;
  },
  math_constrain: (block) => {
    const value = generateValueCode(block, 'VALUE') || '0';
    const low = generateValueCode(block, 'LOW') || '0';
    const high = generateValueCode(block, 'HIGH') || '100';
    return `max(${low}, min(${value}, ${high}))`;
  },
  math_random_int: (block) => {
    const from = generateValueCode(block, 'FROM') || '1';
    const to = generateValueCode(block, 'TO') || '100';
    return `random.randint(${from}, ${to})`;
  },
  math_random_float: () => 'random.random()',
  math_on_list: (block) => {
    const operator = block.getFieldValue('OP');
    const list = generateValueCode(block, 'LIST') || '[]';
    const ops: Record<string, string> = {
      'SUM': `sum(${list})`,
      'MIN': `min(${list})`,
      'MAX': `max(${list})`,
      'AVERAGE': `sum(${list}) / len(${list})`,
      'MEDIAN': `statistics.median(${list})`,
      'STD_DEV': `statistics.stdev(${list})`,
      'RANDOM': `random.choice(${list})`
    };
    return ops[operator] || list;
  },

  // Text blocks
  text: (block) => {
    const text = block.getFieldValue('TEXT') || '';
    return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  },
  text_join: (block, indentLevel) => {
    const itemCount = (block as any).itemCount_ || 2;
    const items: string[] = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(generateValueCode(block, 'ADD' + i) || '""');
    }
    return `str(${items.join(') + str(')})`;
  },
  text_length: (block) => {
    const text = generateValueCode(block, 'VALUE') || '""';
    return `len(${text})`;
  },
  text_isEmpty: (block) => {
    const text = generateValueCode(block, 'VALUE') || '""';
    return `not ${text}`;
  },
  text_print: (block, indentLevel) => {
    const text = generateValueCode(block, 'TEXT') || '""';
    return indent(`print(${text})`, indentLevel);
  },
  text_append: (block, indentLevel) => {
    const variable = block.getFieldValue('VAR') || 'text';
    const text = generateValueCode(block, 'TEXT') || '""';
    return indent(`${variable} += str(${text})`, indentLevel);
  },

  // List blocks
  lists_create_with: (block) => {
    const itemCount = (block as any).itemCount_ || 0;
    const items: string[] = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(generateValueCode(block, 'ADD' + i) || '');
    }
    return `[${items.filter(i => i).join(', ')}]`;
  },
  lists_repeat: (block) => {
    const item = generateValueCode(block, 'ITEM') || 'None';
    const num = generateValueCode(block, 'NUM') || '5';
    return `[${item}] * ${num}`;
  },
  lists_length: (block) => {
    const list = generateValueCode(block, 'VALUE') || '[]';
    return `len(${list})`;
  },
  lists_isEmpty: (block) => {
    const list = generateValueCode(block, 'VALUE') || '[]';
    return `len(${list}) == 0`;
  },

  // Variables
  variables_get: (block) => {
    return block.getFieldValue('VAR') || 'x';
  },
  variables_set: (block, indentLevel) => {
    const variable = block.getFieldValue('VAR') || 'x';
    const value = generateValueCode(block, 'VALUE') || '0';
    return indent(`${variable} = ${value}`, indentLevel);
  }
};

// Helper: Get value from input (for number inputs with shadow blocks)
function getInputValue(block: Blockly.Block, inputName: string, defaultValue: string): string {
  const input = block.getInput(inputName);
  if (!input) return defaultValue;

  const connection = input.connection;
  if (!connection) return defaultValue;

  const targetBlock = connection.targetBlock();
  if (!targetBlock) return defaultValue;

  // If it's a math_number block, get the NUM field directly
  if (targetBlock.type === 'math_number') {
    const num = targetBlock.getFieldValue('NUM');
    return num !== null && num !== undefined ? String(num) : defaultValue;
  }

  // Otherwise, generate code for the block
  return generateBlockCode(targetBlock, 1) || defaultValue;
}

// Helper: Generate code for a value input
function generateValueCode(block: Blockly.Block, inputName: string): string {
  const input = block.getInput(inputName);
  if (!input || !input.connection) return '';

  const targetBlock = input.connection.targetBlock();
  if (!targetBlock) return '';

  return generateBlockCode(targetBlock, 1);
}

// Helper: Generate code for statement inputs
function generateStatementsForInput(block: Blockly.Block, inputName: string, indentLevel: number): string {
  const input = block.getInput(inputName);
  if (!input || !input.connection) return '';

  const targetBlock = input.connection.targetBlock();
  if (!targetBlock) return '';

  return generateBlocksCode(targetBlock, indentLevel);
}

// Generate code for a single block
function generateBlockCode(block: Blockly.Block, indentLevel: number): string {
  const generator = blockGenerators[block.type];
  if (generator) {
    return generator(block, indentLevel);
  }

  // Fallback for unknown blocks
  return indent(`# Unknown block: ${block.type}`, indentLevel);
}

// Generate code for a chain of blocks
// Each block generator is responsible for its own indentation
function generateBlocksCode(startBlock: Blockly.Block | null, indentLevel: number): string {
  const lines: string[] = [];
  let block = startBlock;

  while (block) {
    const code = generateBlockCode(block, indentLevel);
    if (code) {
      // Block generators handle their own indentation, so just add the code
      lines.push(code);
    }
    block = block.getNextBlock();
  }

  return lines.join('\n');
}

// Main function: Generate Python code from workspace
export function generatePythonFromWorkspace(workspace: Blockly.Workspace): string {
  const topBlocks = workspace.getTopBlocks(true);

  // Filter to only include blocks that are part of the main program (have previousStatement)
  const statementBlocks = topBlocks.filter(block => {
    const json = (block as any).jsonInit_ || {};
    // Include blocks that can be connected in sequence
    return block.previousConnection !== null || block.nextConnection !== null ||
           // Or blocks that are control structures
           block.type.startsWith('controls_') ||
           block.type.startsWith('nav_') ||
           block.type.startsWith('led_') ||
           block.type.startsWith('apriltag_');
  });

  if (statementBlocks.length === 0) {
    return PYTHON_PREAMBLE + indent('# Add blocks to generate Python code', 1) + PYTHON_POSTAMBLE;
  }

  const codeLines: string[] = [];

  for (const block of statementBlocks) {
    const code = generateBlocksCode(block, 1);
    if (code) {
      codeLines.push(code);
    }
  }

  const mainCode = codeLines.join('\n\n');

  return PYTHON_PREAMBLE + (mainCode || indent('pass', 1)) + PYTHON_POSTAMBLE;
}
