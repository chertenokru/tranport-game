import type { GameWorld } from '@/game/core/GameWorld'
import { type Bus, BusState } from '@/game/domain/Bus'
import { Direction } from '@/game/domain/Direction'
import { TRAFFIC_CONFIG, type TrafficConfig } from '@/game/config/traffic.config'
import { getVehicleBounds } from '@/game/tools/getVehicleBounds'
import { rotatePoint } from '@/game/tools/geometry'
import { getRayBoxInterval } from '@/game/tools/collision/getRayBoxInterval'
import { getBusMotion, type BusMotion, type BusMotions } from '../tools/movement/getBusMotion'
import { getTrafficZones, type TrafficZone } from './TrafficZone'

const EPSILON = 1e-7

interface PlannedBus {
  readonly bus: Bus
  readonly direction: Direction
  readonly unit: { x: number; y: number }
  readonly bounds: ReturnType<typeof getVehicleBounds>
  readonly baseline: BusMotion
  speed: number
}

export interface TrafficStep {
  readonly motions: BusMotions
  readonly duration: number
}

export class BusTrafficSystem {
  constructor(private readonly config: TrafficConfig = TRAFFIC_CONFIG) {
    if (!Number.isFinite(config.minimumGap) || config.minimumGap < 0) {
      throw new RangeError('Traffic clearance must be finite and non-negative')
    }
  }

  plan(
    world: GameWorld,
    maximumTime: number,
    zones: readonly TrafficZone[] = getTrafficZones(world),
  ): TrafficStep {
    this.releaseExitedZones(world, zones)
    const buses: PlannedBus[] = [...world.buses.values()].map((bus) => {
      const baseline = getBusMotion(world, bus)
      return {
        bus,
        baseline,
        direction: baseline.direction,
        unit: rotatePoint({ x: 0, y: 1 }, baseline.direction),
        bounds: getVehicleBounds({ ...bus, direction: baseline.direction }),
        speed: Math.hypot(baseline.velocity.x, baseline.velocity.y),
      }
    })
    const lanes = Object.values(Direction).map((direction) =>
      buses
        .filter((bus) => bus.direction === direction)
        .sort((a, b) => projection(b) - projection(a) || a.bus.id.localeCompare(b.bus.id)),
    )

    this.followLeaders(lanes)
    this.reserveZones(world, buses, zones)
    // A bus stopped at a zone may also hold up the entire lane behind it.
    this.followLeaders(lanes)

    const motions = new Map<string, BusMotion>()
    let duration = maximumTime
    for (const bus of buses) {
      const originalSpeed = Math.hypot(bus.baseline.velocity.x, bus.baseline.velocity.y)
      const factor = originalSpeed > 0 ? bus.speed / originalSpeed : 0
      const motion: BusMotion = {
        direction: bus.direction,
        velocity: { x: bus.baseline.velocity.x * factor, y: bus.baseline.velocity.y * factor },
        duration:
          bus.bus.state === BusState.WaitingAtStop
            ? bus.baseline.duration
            : factor > 0
              ? bus.baseline.duration / factor
              : Infinity,
      }
      motions.set(bus.bus.id, motion)
      if (motion.duration > 0) duration = Math.min(duration, motion.duration)

      if (bus.speed === 0) continue
      for (const zone of zones) {
        const interval = zoneInterval(bus, zone)
        if (!interval || interval.exit <= EPSILON) continue
        const ownsZone = world.trafficZoneOwners.get(zone.id) === bus.bus.id
        const distance = ownsZone ? interval.exit : interval.enter - this.config.minimumGap
        if (distance > EPSILON) duration = Math.min(duration, distance / bus.speed)
      }
    }
    for (const lane of lanes) {
      for (let index = 1; index < lane.length; index++) {
        const follower = lane[index]!
        for (const leader of lane.slice(0, index)) {
          const gap = followingGap(follower, leader)
          const closingSpeed = follower.speed - leader.speed
          if (gap !== null && gap > this.config.minimumGap + EPSILON && closingSpeed > 0) {
            duration = Math.min(duration, (gap - this.config.minimumGap) / closingSpeed)
          }
        }
      }
    }
    return { motions, duration }
  }

  releaseExitedZones(
    world: GameWorld,
    zones: readonly TrafficZone[] = getTrafficZones(world),
  ): void {
    for (const [id, busId] of world.trafficZoneOwners) {
      const zone = zones.find((zone) => zone.id === id)
      const bus = world.buses.get(busId)
      if (!zone || !bus) {
        world.trafficZoneOwners.delete(id)
        continue
      }
      const { direction } = getBusMotion(world, bus)
      const interval = zoneInterval(
        {
          bounds: getVehicleBounds({ ...bus, direction }),
          unit: rotatePoint({ x: 0, y: 1 }, direction),
        },
        zone,
      )
      if (!interval || interval.exit <= EPSILON) world.trafficZoneOwners.delete(id)
    }
  }

  private followLeaders(lanes: readonly PlannedBus[][]): void {
    for (const lane of lanes) {
      for (let index = 1; index < lane.length; index++) {
        const follower = lane[index]!
        for (const leader of lane.slice(0, index)) {
          const gap = followingGap(follower, leader)
          if (gap !== null && gap <= this.config.minimumGap + EPSILON) {
            follower.speed = Math.min(follower.speed, leader.speed)
          }
        }
      }
    }
  }

  private reserveZones(
    world: GameWorld,
    buses: readonly PlannedBus[],
    zones: readonly TrafficZone[],
  ): void {
    for (const zone of zones) {
      let owner = buses.find((bus) => bus.bus.id === world.trafficZoneOwners.get(zone.id))
      const approaches = buses.flatMap((bus) => {
        const interval = zoneInterval(bus, zone)
        return interval && interval.exit > EPSILON ? [{ bus, distance: interval.enter }] : []
      })
      if (!owner) {
        const contenders = approaches.filter(
          ({ bus, distance }) =>
            distance < -EPSILON ||
            (!zone.blocked && bus.speed > 0 && distance <= this.config.minimumGap + EPSILON),
        )
        contenders.sort(
          (a, b) => a.distance - b.distance || a.bus.bus.id.localeCompare(b.bus.bus.id),
        )
        owner = contenders[0]?.bus
        if (owner) world.trafficZoneOwners.set(zone.id, owner.bus.id)
      }
      for (const { bus, distance } of approaches) {
        if (bus !== owner && distance <= this.config.minimumGap + EPSILON) bus.speed = 0
      }
    }
  }
}

function projection(bus: PlannedBus): number {
  return bus.bounds.position.x * bus.unit.x + bus.bounds.position.y * bus.unit.y
}

function followingGap(follower: PlannedBus, leader: PlannedBus): number | null {
  const along = follower.unit.x !== 0 ? 'x' : 'y'
  const across = along === 'x' ? 'y' : 'x'
  if (
    Math.abs(follower.bounds.position[across] - leader.bounds.position[across]) >=
    follower.bounds.halfSize[across] + leader.bounds.halfSize[across]
  )
    return null
  return (
    projection(leader) -
    projection(follower) -
    follower.bounds.halfSize[along] -
    leader.bounds.halfSize[along]
  )
}

function zoneInterval(bus: Pick<PlannedBus, 'bounds' | 'unit'>, zone: TrafficZone) {
  return getRayBoxInterval(
    { x: bus.bounds.position.x - zone.position.x, y: bus.bounds.position.y - zone.position.y },
    bus.unit,
    { x: zone.halfSize.x + bus.bounds.halfSize.x, y: zone.halfSize.y + bus.bounds.halfSize.y },
  )
}
