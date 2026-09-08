import type { Vector2 } from '@/game/domain/geometry'

export interface ScreenPoint {
  readonly x: number
  readonly y: number
}

const WORLD_WIDTH = 960
const WORLD_HEIGHT = 700
const CAMERA_HEADING = Math.PI / 4
const CAMERA_PITCH = (31 * Math.PI) / 180
const CAMERA_DISTANCE = 2_200
const PROJECTION_SCALE = 0.82

export interface IsometricView {
  readonly rotation: number
  readonly zoom: number
}

export class IsometricCamera {
  readonly scale: number
  private readonly origin: ScreenPoint
  private readonly headingCosine: number
  private readonly headingSine: number
  private readonly pitchCosine = Math.cos(CAMERA_PITCH)
  private readonly pitchSine = Math.sin(CAMERA_PITCH)

  constructor(width: number, height: number, view: IsometricView) {
    const heading = CAMERA_HEADING + view.rotation
    this.headingCosine = Math.cos(heading)
    this.headingSine = Math.sin(heading)

    // A constant uniform scale keeps the camera stable throughout the orbit.
    // Perspective is applied per point from its actual camera-space depth.
    const fitScale = Math.min((width - 80) / 1_070, (height - 120) / 650)

    this.scale = fitScale * view.zoom
    this.origin = {
      x: width / 2,
      y: height * 0.52,
    }
  }

  project(point: Vector2, elevation = 0): ScreenPoint {
    const projected = this.toCameraSpace(point, elevation)
    const perspective = CAMERA_DISTANCE / projected.distance
    return {
      x: this.origin.x + projected.x * this.scale * perspective,
      y: this.origin.y + projected.y * this.scale * perspective,
    }
  }

  depth(point: Vector2): number {
    return -this.toCameraSpace(point, 0).distance
  }

  elevation(value: number): number {
    const ground = this.project({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }, 0)
    const raised = this.project({ x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 }, value)
    return ground.y - raised.y
  }

  private toCameraSpace(
    point: Vector2,
    elevation: number,
  ): ScreenPoint & { readonly distance: number } {
    const centeredX = point.x - WORLD_WIDTH / 2
    const centeredY = point.y - WORLD_HEIGHT / 2
    const horizontal = centeredX * this.headingSine - centeredY * this.headingCosine
    const groundDepth = centeredX * this.headingCosine + centeredY * this.headingSine
    return {
      x: horizontal * PROJECTION_SCALE,
      y: (groundDepth * this.pitchSine - elevation * this.pitchCosine) * PROJECTION_SCALE,
      distance: CAMERA_DISTANCE - groundDepth * this.pitchCosine - elevation * this.pitchSine,
    }
  }
}
