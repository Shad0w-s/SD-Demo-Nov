import { describe, it, expect, vi } from 'vitest'

vi.doUnmock('@/lib/map')

const {
  createClosedPath,
  computeSegments,
  interpolatePath,
  computeBearing,
  interpolateSegment,
  LOOP_PROGRESS_INCREMENT,
  SHUTTLE_PROGRESS_INCREMENT,
} = (await import('@/lib/map')).__testables

describe('Map path helpers', () => {
  describe('createClosedPath', () => {
    it('returns the same path when fewer than 3 points', () => {
      const path: [number, number][] = [
        [-122.5, 37.7],
        [-122.4, 37.8],
      ]
      expect(createClosedPath(path)).toEqual(path)
    })

    it('appends the first point to close the loop for 3+ points', () => {
      const path: [number, number][] = [
        [-122.5, 37.7],
        [-122.4, 37.8],
        [-122.3, 37.75],
      ]
      const closed = createClosedPath(path)
      expect(closed).toHaveLength(4)
      expect(closed[closed.length - 1]).toEqual(path[0])
    })

    it('avoids duplicating the last point if already closed', () => {
      const path: [number, number][] = [
        [-122.5, 37.7],
        [-122.4, 37.8],
        [-122.3, 37.75],
        [-122.5, 37.7],
      ]
      const closed = createClosedPath(path)
      expect(closed).toEqual(path)
    })
  })

  describe('computeSegments & interpolatePath', () => {
    it('computes total length for a simple line', () => {
      const path: [number, number][] = [
        [0, 0],
        [0.01, 0],
      ]
      const { totalLength, segments } = computeSegments(path)
      expect(segments).toHaveLength(1)
      expect(totalLength).toBeGreaterThan(0)
    })

    it('interpolates a point at halfway along the path', () => {
      const path: [number, number][] = [
        [0, 0],
        [0.01, 0],
        [0.01, 0.01],
      ]
      const collection = computeSegments(path)
      const result = interpolatePath(collection, 0.5)
      expect(result).not.toBeNull()
      if (!result) return
      // halfway should still lie on the path extents
      expect(result.point[0]).toBeGreaterThanOrEqual(0)
      expect(result.point[0]).toBeLessThanOrEqual(0.01)
      expect(result.point[1]).toBeGreaterThanOrEqual(0)
      expect(result.point[1]).toBeLessThanOrEqual(0.01)
    })

    it('returns the final point when progress is 1', () => {
      const path: [number, number][] = [
        [0, 0],
        [0.01, 0],
        [0.01, 0.01],
      ]
      const collection = computeSegments(path)
      const result = interpolatePath(collection, 1)
      expect(result).not.toBeNull()
      if (!result) return
      expect(result.point).toEqual(path[path.length - 1])
    })
  })

  describe('computeBearing & interpolateSegment', () => {
    it('provides correct bearing for eastward travel', () => {
      const bearing = computeBearing([0, 0], [1, 0])
      expect(Math.round(bearing)).toBe(0)
    })

    it('provides bearing roughly opposite when reversing direction', () => {
      const forward = computeBearing([0, 0], [0, 1])
      const backward = computeBearing([0, 1], [0, 0])
      expect(Math.round((forward - backward + 360) % 360)).toBeCloseTo(180, 0)
    })

    it('interpolates a segment fraction', () => {
      const point = interpolateSegment([0, 0], [10, 10], 0.25)
      expect(point).toEqual([2.5, 2.5])
    })

    it('clamps interpolation fractions outside [0,1]', () => {
      const low = interpolateSegment([0, 0], [10, 0], -1)
      const high = interpolateSegment([0, 0], [10, 0], 2)
      expect(low).toEqual([0, 0])
      expect(high).toEqual([10, 0])
    })
  })

  describe('animation constants', () => {
    it('uses the same progress increment for loop and shuttle markers', () => {
      expect(SHUTTLE_PROGRESS_INCREMENT).toBeCloseTo(LOOP_PROGRESS_INCREMENT)
    })
  })
})

