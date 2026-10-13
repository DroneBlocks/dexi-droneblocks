// Python examples shown on the Demos page. The scripts live in the ROS packages
// (and dexi-mavsdk), so they ship with the image at the same version as the
// nodes they call. Paths are relative to the code-server home folder, which is
// /home/dexi on the drone and /home/ubuntu in the simulator.

export interface PythonExample {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface PythonExampleGroup {
  id: string;
  name: string;
  description: string;
  examples: PythonExample[];
}

const OFFBOARD = 'dexi_ws/src/dexi_offboard/examples/python';
const APRILTAG = 'dexi_ws/src/dexi_apriltag/examples/python';
const MAVSDK = 'dexi-mavsdk/missions';

export const pythonExampleGroups: PythonExampleGroup[] = [
  {
    id: 'getting-started',
    name: 'Getting started',
    description: 'ROS 2 and the offboard manager: one service call per step.',
    examples: [
      {
        id: 'simple-flight',
        name: 'Simple Flight',
        description: 'Arm, take off, hold, and land. The smallest complete mission.',
        path: `${OFFBOARD}/simple_flight.py`
      },
      {
        id: 'box-mission',
        name: 'Box Mission',
        description: 'Take off and fly a 1 m box, one command after another.',
        path: `${OFFBOARD}/droneblocks_box_mission.py`
      },
      {
        id: 'circle-mission',
        name: 'Circle Mission',
        description: 'Fly a smooth circle with a single manager command.',
        path: `${OFFBOARD}/droneblocks_circle_mission.py`
      }
    ]
  },
  {
    id: 'apriltags',
    name: 'AprilTags',
    description: 'Navigate by the tags on the floor with tag_nav.',
    examples: [
      {
        id: 'hop-to-next-tag',
        name: 'Hop to the Next Tag',
        description: 'Take off over tag 0, center and hold, fly forward until tag 1 is seen, land on it.',
        path: `${APRILTAG}/hop_to_next_tag.py`
      },
      {
        id: 'hop-back',
        name: 'Hop Back',
        description: 'Take off over tag 1, center and hold, fly backward until tag 0 is seen, land on it.',
        path: `${APRILTAG}/hop_back_to_previous_tag.py`
      },
      {
        id: 'tag-hop-route',
        name: 'Tag Hop Route',
        description: 'Take off and hop down a route of tags, tag 0 to tag 1 by default. Options set the route, altitude, and speed.',
        path: `${OFFBOARD}/apriltag_tag_hop.py`
      },
      {
        id: 'tag-hop-handoff',
        name: 'Tag Hop from a Pilot Hand-off',
        description: 'Fly by hand over the first tag and flip to Offboard; the mission takes over and hops the route.',
        path: `${OFFBOARD}/apriltag_tag_hop_handoff.py`
      }
    ]
  },
  {
    id: 'patterns',
    name: 'Flight patterns',
    description: 'Position and velocity setpoints for shapes in the air.',
    examples: [
      {
        id: 'position-square',
        name: 'Square',
        description: 'Fly a square with position targets, then turn a full circle.',
        path: `${OFFBOARD}/position_square.py`
      },
      {
        id: 'position-circle-orbit',
        name: 'Circle Orbit',
        description: 'Orbit a point with the nose along the path or facing the center.',
        path: `${OFFBOARD}/position_circle_orbit.py`
      },
      {
        id: 'position-figure-eight',
        name: 'Figure Eight',
        description: 'A figure eight from position targets, nose following the path.',
        path: `${OFFBOARD}/position_figure_eight.py`
      },
      {
        id: 'velocity-circle',
        name: 'Velocity Circle',
        description: 'A 1 m circle from a forward speed and a yaw rate.',
        path: `${OFFBOARD}/velocity_circle.py`
      },
      {
        id: 'velocity-figure-eight',
        name: 'Velocity Figure Eight',
        description: 'Two velocity circles in opposite directions.',
        path: `${OFFBOARD}/velocity_figure_eight.py`
      }
    ]
  },
  {
    id: 'mavsdk',
    name: 'MAVSDK',
    description: 'The same flights over MAVLink, without ROS.',
    examples: [
      {
        id: 'mavsdk-takeoff-land',
        name: 'Takeoff and Land',
        description: 'Arm, take off to 2.5 m, hover, and land.',
        path: `${MAVSDK}/takeoff_and_land.py`
      },
      {
        id: 'mavsdk-fly-forward',
        name: 'Fly Forward',
        description: 'Take off, fly forward 2 m in offboard mode, and land.',
        path: `${MAVSDK}/takeoff_fly_forward_land.py`
      },
      {
        id: 'mavsdk-box',
        name: 'Box Mission',
        description: 'Take off and fly a 1 m box in offboard mode.',
        path: `${MAVSDK}/box_mission.py`
      }
    ]
  }
];

export function findPythonExample(path: string): PythonExample | undefined {
  for (const group of pythonExampleGroups) {
    const hit = group.examples.find(e => e.path === path);
    if (hit) return hit;
  }
  return undefined;
}
