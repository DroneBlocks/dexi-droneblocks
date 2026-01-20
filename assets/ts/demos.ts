export interface Demo {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'navigation' | 'led' | 'apriltag' | 'advanced';
  blocklyXml: string;
}

export const demos: Demo[] = [
  {
    id: 'led-pixel-loop',
    name: 'LED Pixel Loop',
    description: 'Reset LEDs to black, then loop through all 45 pixels lighting each one white.',
    category: 'basic',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <variables>
    <variable id="i_var">i</variable>
  </variables>
  <block type="led_ring" x="50" y="50">
    <field name="color">black</field>
    <next>
      <block type="controls_for">
    <field name="VAR" id="i_var">i</field>
    <value name="FROM">
      <shadow type="math_number"><field name="NUM">0</field></shadow>
    </value>
    <value name="TO">
      <shadow type="math_number"><field name="NUM">44</field></shadow>
    </value>
    <value name="BY">
      <shadow type="math_number"><field name="NUM">1</field></shadow>
    </value>
    <statement name="DO">
      <block type="led_pixel">
        <value name="index">
          <block type="variables_get">
            <field name="VAR" id="i_var">i</field>
          </block>
        </value>
        <value name="red">
          <shadow type="math_number"><field name="NUM">255</field></shadow>
        </value>
        <value name="green">
          <shadow type="math_number"><field name="NUM">255</field></shadow>
        </value>
        <value name="blue">
          <shadow type="math_number"><field name="NUM">255</field></shadow>
        </value>
        <next>
          <block type="nav_wait">
            <value name="DURATION">
              <shadow type="math_number"><field name="NUM">0.1</field></shadow>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'led-light-show',
    name: 'LED Light Show',
    description: 'Cycle through different LED effects: rainbow, police, and solid colors.',
    category: 'basic',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="led_effect" x="50" y="50">
    <field name="EFFECT">rainbow</field>
    <next>
      <block type="nav_wait">
        <value name="DURATION">
          <shadow type="math_number"><field name="NUM">3</field></shadow>
        </value>
        <next>
          <block type="led_effect">
            <field name="EFFECT">police</field>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">3</field></shadow>
                </value>
                <next>
                  <block type="led_ring">
                    <field name="color">green</field>
                    <next>
                      <block type="nav_wait">
                        <value name="DURATION">
                          <shadow type="math_number"><field name="NUM">3</field></shadow>
                        </value>
                        <next>
                          <block type="led_effect">
                            <field name="EFFECT">off</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'takeoff-land',
    name: 'Takeoff and Land',
    description: 'Basic sequence: arm, switch to offboard mode, takeoff to 3m, wait 3 seconds, land, and disarm.',
    category: 'basic',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">3</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">3</field></shadow>
                </value>
                <next>
                  <block type="nav_land">
                    <next>
                      <block type="nav_disarm"></block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'color-cycle',
    name: 'Color Cycle',
    description: 'Cycle the LED ring through red, green, and blue colors.',
    category: 'basic',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="led_ring" x="50" y="50">
    <field name="color">red</field>
    <next>
      <block type="nav_wait">
        <value name="DURATION">
          <shadow type="math_number"><field name="NUM">2</field></shadow>
        </value>
        <next>
          <block type="led_ring">
            <field name="color">green</field>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
                <next>
                  <block type="led_ring">
                    <field name="color">blue</field>
                    <next>
                      <block type="nav_wait">
                        <value name="DURATION">
                          <shadow type="math_number"><field name="NUM">2</field></shadow>
                        </value>
                        <next>
                          <block type="led_ring">
                            <field name="color">black</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'hover-in-place',
    name: 'Hover in Place',
    description: 'Takeoff and hover in place for 10 seconds before landing.',
    category: 'basic',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">2</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">10</field></shadow>
                </value>
                <next>
                  <block type="nav_land">
                    <next>
                      <block type="nav_disarm"></block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'up-and-down',
    name: 'Up and Down',
    description: 'Vertical flight demo: takeoff, fly up 2m, fly down 2m, land.',
    category: 'basic',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">2</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
                <next>
                  <block type="nav_fly_up">
                    <value name="DISTANCE">
                      <shadow type="math_number"><field name="NUM">2</field></shadow>
                    </value>
                    <next>
                      <block type="nav_wait">
                        <value name="DURATION">
                          <shadow type="math_number"><field name="NUM">2</field></shadow>
                        </value>
                        <next>
                          <block type="nav_fly_down">
                            <value name="DISTANCE">
                              <shadow type="math_number"><field name="NUM">2</field></shadow>
                            </value>
                            <next>
                              <block type="nav_wait">
                                <value name="DURATION">
                                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                                </value>
                                <next>
                                  <block type="nav_land">
                                    <next>
                                      <block type="nav_disarm"></block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'square-pattern',
    name: 'Square Pattern',
    description: 'Fly in a 2m x 2m square pattern at 3m altitude.',
    category: 'navigation',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">3</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
                <next>
                  <block type="nav_fly_forward">
                    <value name="DISTANCE">
                      <shadow type="math_number"><field name="NUM">2</field></shadow>
                    </value>
                    <next>
                      <block type="nav_fly_right">
                        <value name="DISTANCE">
                          <shadow type="math_number"><field name="NUM">2</field></shadow>
                        </value>
                        <next>
                          <block type="nav_fly_backward">
                            <value name="DISTANCE">
                              <shadow type="math_number"><field name="NUM">2</field></shadow>
                            </value>
                            <next>
                              <block type="nav_fly_left">
                                <value name="DISTANCE">
                                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                                </value>
                                <next>
                                  <block type="nav_land">
                                    <next>
                                      <block type="nav_disarm"></block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'yaw-spin',
    name: 'Yaw Spin',
    description: 'Takeoff and perform a 360° rotation using yaw commands.',
    category: 'navigation',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">3</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
                <next>
                  <block type="nav_yaw_left">
                    <value name="DEGREES">
                      <shadow type="math_number"><field name="NUM">90</field></shadow>
                    </value>
                    <next>
                      <block type="nav_yaw_left">
                        <value name="DEGREES">
                          <shadow type="math_number"><field name="NUM">90</field></shadow>
                        </value>
                        <next>
                          <block type="nav_yaw_left">
                            <value name="DEGREES">
                              <shadow type="math_number"><field name="NUM">90</field></shadow>
                            </value>
                            <next>
                              <block type="nav_yaw_left">
                                <value name="DEGREES">
                                  <shadow type="math_number"><field name="NUM">90</field></shadow>
                                </value>
                                <next>
                                  <block type="nav_wait">
                                    <value name="DURATION">
                                      <shadow type="math_number"><field name="NUM">2</field></shadow>
                                    </value>
                                    <next>
                                      <block type="nav_land">
                                        <next>
                                          <block type="nav_disarm"></block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'forward-backward',
    name: 'Forward and Back',
    description: 'Fly forward 2m, wait, then fly backward 2m.',
    category: 'navigation',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">2</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
                <next>
                  <block type="nav_fly_forward">
                    <value name="DISTANCE">
                      <shadow type="math_number"><field name="NUM">2</field></shadow>
                    </value>
                    <next>
                      <block type="nav_wait">
                        <value name="DURATION">
                          <shadow type="math_number"><field name="NUM">2</field></shadow>
                        </value>
                        <next>
                          <block type="nav_fly_backward">
                            <value name="DISTANCE">
                              <shadow type="math_number"><field name="NUM">2</field></shadow>
                            </value>
                            <next>
                              <block type="nav_land">
                                <next>
                                  <block type="nav_disarm"></block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'left-right',
    name: 'Left and Right',
    description: 'Fly left 2m, wait, then fly right 2m.',
    category: 'navigation',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">2</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
                <next>
                  <block type="nav_fly_left">
                    <value name="DISTANCE">
                      <shadow type="math_number"><field name="NUM">2</field></shadow>
                    </value>
                    <next>
                      <block type="nav_wait">
                        <value name="DURATION">
                          <shadow type="math_number"><field name="NUM">2</field></shadow>
                        </value>
                        <next>
                          <block type="nav_fly_right">
                            <value name="DISTANCE">
                              <shadow type="math_number"><field name="NUM">2</field></shadow>
                            </value>
                            <next>
                              <block type="nav_land">
                                <next>
                                  <block type="nav_disarm"></block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'triangle-pattern',
    name: 'Triangle Pattern',
    description: 'Fly in a triangular pattern using forward and yaw movements.',
    category: 'navigation',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">2</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
                <next>
                  <block type="nav_fly_forward">
                    <value name="DISTANCE">
                      <shadow type="math_number"><field name="NUM">2</field></shadow>
                    </value>
                    <next>
                      <block type="nav_yaw_right">
                        <value name="DEGREES">
                          <shadow type="math_number"><field name="NUM">120</field></shadow>
                        </value>
                        <next>
                          <block type="nav_fly_forward">
                            <value name="DISTANCE">
                              <shadow type="math_number"><field name="NUM">2</field></shadow>
                            </value>
                            <next>
                              <block type="nav_yaw_right">
                                <value name="DEGREES">
                                  <shadow type="math_number"><field name="NUM">120</field></shadow>
                                </value>
                                <next>
                                  <block type="nav_fly_forward">
                                    <value name="DISTANCE">
                                      <shadow type="math_number"><field name="NUM">2</field></shadow>
                                    </value>
                                    <next>
                                      <block type="nav_yaw_right">
                                        <value name="DEGREES">
                                          <shadow type="math_number"><field name="NUM">120</field></shadow>
                                        </value>
                                        <next>
                                          <block type="nav_land">
                                            <next>
                                              <block type="nav_disarm"></block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'zigzag-pattern',
    name: 'Zigzag Pattern',
    description: 'Fly in a zigzag pattern: forward-right, forward-left, repeat.',
    category: 'navigation',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">2</field></shadow>
            </value>
            <next>
              <block type="nav_wait">
                <value name="DURATION">
                  <shadow type="math_number"><field name="NUM">2</field></shadow>
                </value>
                <next>
                  <block type="nav_fly_forward">
                    <value name="DISTANCE">
                      <shadow type="math_number"><field name="NUM">1</field></shadow>
                    </value>
                    <next>
                      <block type="nav_fly_right">
                        <value name="DISTANCE">
                          <shadow type="math_number"><field name="NUM">1</field></shadow>
                        </value>
                        <next>
                          <block type="nav_fly_forward">
                            <value name="DISTANCE">
                              <shadow type="math_number"><field name="NUM">1</field></shadow>
                            </value>
                            <next>
                              <block type="nav_fly_left">
                                <value name="DISTANCE">
                                  <shadow type="math_number"><field name="NUM">1</field></shadow>
                                </value>
                                <next>
                                  <block type="nav_fly_forward">
                                    <value name="DISTANCE">
                                      <shadow type="math_number"><field name="NUM">1</field></shadow>
                                    </value>
                                    <next>
                                      <block type="nav_fly_right">
                                        <value name="DISTANCE">
                                          <shadow type="math_number"><field name="NUM">1</field></shadow>
                                        </value>
                                        <next>
                                          <block type="nav_land">
                                            <next>
                                              <block type="nav_disarm"></block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'apriltag-led',
    name: 'Tag Triggers LED',
    description: 'Start monitoring AprilTags, when a tag is detected turn on rainbow LED effect.',
    category: 'apriltag',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="apriltag_start_monitoring" x="50" y="50">
    <next>
      <block type="nav_wait">
        <value name="DURATION">
          <shadow type="math_number"><field name="NUM">5</field></shadow>
        </value>
        <next>
          <block type="controls_if">
            <value name="IF0">
              <block type="logic_compare">
                <field name="OP">GTE</field>
                <value name="A">
                  <block type="apriltag_get_last_id"></block>
                </value>
                <value name="B">
                  <block type="math_number">
                    <field name="NUM">0</field>
                  </block>
                </value>
              </block>
            </value>
            <statement name="DO0">
              <block type="led_effect">
                <field name="EFFECT">rainbow</field>
              </block>
            </statement>
            <next>
              <block type="apriltag_stop_monitoring"></block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  },
  {
    id: 'apriltag-land',
    name: 'Tag 1 Triggers Land',
    description: 'While flying, if AprilTag ID 1 is detected, land the drone.',
    category: 'apriltag',
    blocklyXml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="nav_arm" x="50" y="50">
    <next>
      <block type="nav_switch_offboard_mode">
        <next>
          <block type="nav_takeoff">
            <value name="ALTITUDE">
              <shadow type="math_number"><field name="NUM">2</field></shadow>
            </value>
            <next>
              <block type="apriltag_start_monitoring">
                <next>
                  <block type="nav_wait">
                    <value name="DURATION">
                      <shadow type="math_number"><field name="NUM">5</field></shadow>
                    </value>
                    <next>
                      <block type="controls_if">
                        <value name="IF0">
                          <block type="logic_compare">
                            <field name="OP">EQ</field>
                            <value name="A">
                              <block type="apriltag_get_last_id"></block>
                            </value>
                            <value name="B">
                              <block type="math_number">
                                <field name="NUM">1</field>
                              </block>
                            </value>
                          </block>
                        </value>
                        <statement name="DO0">
                          <block type="nav_land">
                            <next>
                              <block type="nav_disarm"></block>
                            </next>
                          </block>
                        </statement>
                        <next>
                          <block type="apriltag_stop_monitoring"></block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`
  }
];

export function getDemoById(id: string): Demo | undefined {
  return demos.find(demo => demo.id === id);
}

export function getDemosByCategory(category: Demo['category']): Demo[] {
  return demos.filter(demo => demo.category === category);
}
